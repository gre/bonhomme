#!/usr/bin/env node

var Q = require("q");
var Qdebounce = require("qdebounce");
var _ = require("lodash");
var SlidingWindow = require("sliding-window");
var MongoClient = require('mongodb').MongoClient;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var serveStatic = require('serve-static');
var winston = require('winston');
// var reqLogger = require('express-request-logger');
var ntp = require("socket-ntp");
require('date-utils');

var PlayerMoveState = require("../client/network/PlayerMoveState");

var logger = new (winston.Logger)({ transports: [
    new (winston.transports.Console)({ level: "debug" })
  ]
});

var MONGO = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/bonhomme';
var PORT = process.env.PORT || 9832;
var COLL = "scores";
var conf = require("../client/conf");
var nameRegexp = /^[a-zA-Z0-9]{3,10}$/;

var EV = conf.events;

logger.debug("mongo:", MONGO, COLL);
logger.debug("port:", PORT);
logger.debug("conf:", conf);

// app.use(reqLogger.create(logger));
app.use(require("body-parser").json());
app.use(serveStatic('static'));
app.post("/", function (req, res) {
  res.sendFile("index.html", {root: './static'});
});


app.post("/report/error", function (req, res) {
  logger.error("ERROR REPORT:", req.body);
  res.send();
});

var connectMongo = Q.nbind(MongoClient.connect, MongoClient);

connectMongo(MONGO)
  .then(function (db) {
    return Q.ninvoke(db.collection(COLL).find(), "toArray");
  })
  .then(function (res) {
    logger.debug("Nb Scores:", res.length);
  })
  .done();


// TODO: vary with influence & score distance ?
var CARROT_PERSISTENCE = 24 * 3600 * 1000;

function dbScoreToScore (item) {
  return {
    opacity: Math.max(0, 1 - (Date.now() - item.date) / CARROT_PERSISTENCE),
    x: item.x,
    score: item.score,
    player: item.player
  };
}

function getScores () {
  var timeOfDay = +Date.today();
  return connectMongo(MONGO)
  .then(function (db) {
    var collection = db.collection(COLL);
    return Q.ninvoke(collection.find({ "date" : { "$gt": timeOfDay } }).sort({ "score": -1 }), "toArray");
  })
  .then(function (results) {
    return results.map(dbScoreToScore);
  })
  .timeout(3000);
}

var debouncedGetScores = Qdebounce(getScores, 200);

function validScore (item) {
  return (
    typeof item.player === "string" && nameRegexp.exec(item.player) &&
    typeof item.x === "number" && !isNaN(item.x) &&
    typeof item.score === "number" && !isNaN(item.score) &&
    0 <= item.x && item.x <= 320 &&
    item.score > 0
  );
}

function encodeTrack (track) {
  return track.map(PlayerMoveState.encode);
}
/*
function decodeTrack (track) {
  return track.map(PlayerMoveState.decode);
}
*/

function saveScore (item, track) {
  return Q.fcall(function () {
    if (validScore(item)) {
      return connectMongo(MONGO).then(function (db) {
        var collection = db.collection(COLL);
        item = {
          player: item.player,
          x: Math.round(item.x),
          score: Math.round(item.score),
          date: Date.now(),
          track: encodeTrack(track)
        };
        var score = dbScoreToScore(item);
        return Q.ninvoke(collection, "insert", item)
          .then(function () {
            logger.debug("score saved:", score);
          })
          .thenResolve(score);
      });
    }
    else {
      logger.error(item);
      throw new Error("score requirement: { player /* alphanum in 3-10 chars */, x, score }");
    }
  });
}

var CHUNK_SIZE = 480;

var players = {};
var playersLastMove = {};

function roomForChunk (i) {
  return "chunk@"+i;
}

function chunkForY (y) {
  return Math.floor((conf.HEIGHT - y) / CHUNK_SIZE);
}

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
    debouncedGetScores().then(function (scores) {
      socket.emit(EV.scores, scores);
    });
  });

  socket.once(EV.playerready, function (playerInfos) {
    if (!_.isEqual(Object.keys(playerInfos), ["name"]) ||
        !playerInfos.name || !nameRegexp.exec(playerInfos.name)) {
      logger.warn(id, "Invalid player: ", playerInfos);
      socket.disconnect();
      return;
    }
    logger.debug("player connect", id, playerInfos);

    players[id] = playerInfos;
    socket.emit(EV.players, players);
    socket.broadcast.emit(EV.playerenter, playerInfos, id, Date.now());

    socket.on(EV.playermove, function (obj) {
      if (!PlayerMoveState.validateEncoded(obj)) {
        logger.warn(id, "Invalid playermove:", obj);
        return;
      }
      var move = PlayerMoveState.decode(obj);

      var now = Date.now();
      var deltaServerTime = now - move.time;

      if (Math.abs(deltaServerTime) > 400) {
        logger.warn(id, "The client is not in sync with the server time", { server: now, client: move.time, delta: deltaServerTime });
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
      if (!validScore(score)) {
        logger.warn(id, "invalid score sent", score);
        return;
      }
      var now = Date.now();
      var track = currentTrack;
      currentTrack = [];

      socket
        .broadcast
        .emit(EV.playerdie, score, id, now);


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

      saveScore(score, track)
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
      socket.broadcast.emit(EV.playerleave, id, Date.now());
      currentTrack = 0;
      delete playersLastMove[id];
      delete players[id];
    });
  });
});

http.listen(PORT, function () {
  logger.info('listening on http://localhost:'+PORT);
});
