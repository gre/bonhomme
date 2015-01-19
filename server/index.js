#!/usr/bin/env node

var Q = require("q");
var Qdebounce = require("qdebounce");
var _ = require("lodash");
var SlidingWindow = require("sliding-window");
var serveStatic = require('serve-static');
var ntp = require("socket-ntp");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var env = require("./env");
var MapName = require("./models/MapName");
var Score = require("./models/Score");
var logger = require("./utils/logger");
var now = require("./utils/now");
var nameRegexp = require("../common/PlayerName").regexp;
var PlayerMoveState = require("../common/PlayerMoveState");
var conf = require("../conf.json");
var EV = conf.events;

var debouncedGetScore = Qdebounce(Score.listDay, 200);
var CHUNK_SIZE = 480;

var players = {};
var playersLastMove = {};

var logPlayersSize = _.debounce(function () {
  logger.debug("Nb players:", Object.keys(players).length);
}, 1000);

function roomForChunk (i) {
  return "chunk@"+i;
}
function chunkForY (y) {
  return Math.floor((conf.HEIGHT - y) / CHUNK_SIZE);
}

app.use(require("body-parser").json());
app.use(serveStatic('static'));
app.post("/", function (req, res) {
  res.sendFile("index.html", {root: './static'});
});
app.post("/report/error", function (req, res) {
  logger.error("ERROR REPORT:", req.body);
  res.send();
});

// Real Time
io.sockets.on('connection', function (socket) {
  var id = socket.id;
  ntp.sync(socket);

  var currentTrack = [];

  var socketsChunks = new SlidingWindow(function (i) {
    var roomId = roomForChunk(i);
    socket.join(roomId);
    return roomId;
  }, function (i, roomId) {
    socket.leave(roomId);
  }, {
    chunkSize: CHUNK_SIZE,
    ahead: 1,
    behind: 1,
    bounds: [0, +Infinity]
  });

  socket.once(EV.ready, function (clientConf) {
    if (!_.isEqual(conf, clientConf)) {
      socket.send("error", "Client version doesn't match server version.");
      logger.warn(id, "Client version doesn't match server version.", clientConf, conf);
      return;
    }
    debouncedGetScore().then(function (scores) {
      socket.emit(EV.scores, scores);
    });
  });

  socket.on(EV.newgame, function () {
    Q.all([ MapName.getCurrent() ])
    .spread(function (mapname) {
      socket.emit(EV.gameinfo, { mapname: mapname });
    })
    .done();
  });

  socket.once(EV.playerready, function (playerInfos) {
    logPlayersSize();
    if (!_.isEqual(Object.keys(playerInfos), ["name"]) ||
        !playerInfos.name || !nameRegexp.exec(playerInfos.name)) {
      logger.warn(id, "Invalid player: ", playerInfos);
      socket.disconnect();
      return;
    }
    logger.debug("player connect", id, playerInfos);

    players[id] = playerInfos;
    socket.emit(EV.players, players);
    socket.broadcast.emit(EV.playerenter, playerInfos, id, now());

    socket.on(EV.playermove, function (obj) {
      if (!PlayerMoveState.validateEncoded(obj)) {
        logger.warn(id, "Invalid playermove:", obj);
        return;
      }
      var move = PlayerMoveState.decode(obj);

      var tnow = now();
      var deltaServerTime = tnow - move.time;

      if (Math.abs(deltaServerTime) > 400) {
        // logger.warn(id, "The client is not in sync with the server time", { server: tnow, client: move.time, delta: deltaServerTime });
        return;
      }

      var last = playersLastMove[id];
      playersLastMove[id] = move;

      var y = move.pos[1];

      if (last && currentTrack.length > 0) {
        var delta = [
          move.pos[0] - last.pos[0],
          move.pos[1] - last.pos[1]
        ];
        var dt = move.time-last.time;
        if (dt <= 0) {
          logger.warn(id, "time is lower or equal to lastTime...", move.time, last.time);
          return;
        }
        var dist = Math.sqrt(delta[0]*delta[0]+delta[1]*delta[1]);
        var speed = dist / dt;
        var speedOverflow = speed - conf.playerMoveSpeed;

        if (speedOverflow > 2) {
          logger.warn(id, "speed is too high", speed);
          return;
        }
      }

      currentTrack.push(move);

      socketsChunks.move([ conf.HEIGHT-y, (conf.HEIGHT-y)+conf.HEIGHT ]);

      var roomId = roomForChunk(chunkForY(y));

      socket
        .to(roomId)
        .emit(EV.playermove, obj, id, move.time);
    });

    socket.on(EV.playerdie, function (score) {
      if (!Score.valid(score)) {
        logger.warn(id, "invalid score sent", score);
        return;
      }
      var tnow = now();
      var track = currentTrack;
      currentTrack = [];

      socket
        .broadcast
        .emit(EV.playerdie, score, id, tnow);


      var length = track.length;

      if (length < 10) {
        logger.warn(id, "die too early", track.length);
        return;
      }

      var overflows = 0;
      for (var i=1; i<length; ++i) {
        var from = track[i-1];
        var to = track[i];
        var delta = [
          to.pos[0] - from.pos[0],
          to.pos[1] - from.pos[1]
        ];
        var dist = Math.sqrt(delta[0]*delta[0]+delta[1]*delta[1]);
        var dt = to.time - from.time;
        if (dt <= 0) {
          logger.warn(id, "invalid times betwen 2 moves:", from, to);
          return;
        }
        var speed = dist / dt;
        var speedOverflow = speed - conf.playerMoveSpeed;
        overflows += speedOverflow;
        if (speedOverflow > 6) {
          logger.warn(id, "invalid track between 2 moves:", from, to);
          return;
        }
      }

      if (overflows/length > 0.5) {
        logger.warn(id, "invalid track. too much overflow of speed", overflows);
        return;
      }

      Score.validateUserInput(score, track)
        .then(Score.save)
        .then(function (item) {
          socket.broadcast.emit(EV.newscore, item);
          socket.emit(EV.newscore, item);
        })
        .fail(function (err) {
          logger.error("Failure in saving the score: " + err);
        });
    });

    socket.on("disconnect", function () {
      logger.debug("player disconnect", id);
      socket.broadcast.emit(EV.playerleave, id, now());
      currentTrack = 0;
      delete playersLastMove[id];
      delete players[id];
      logPlayersSize();
    });
  });
});

logger.debug("mongo:", env.MONGO);
logger.debug("port:", env.PORT);
logger.debug("conf:", conf);

Score.ready.then(function (count) {
  logger.debug("Nb Scores:", count);
}).done();

MapName.getCurrent().then(function (mapname) {
  logger.debug("Daily map name: ", mapname);
}).done();

http.listen(env.PORT, function () {
  logger.info('listening on http://localhost:'+env.PORT);
});
