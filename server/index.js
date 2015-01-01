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

var logger = new (winston.Logger)({ transports: [
    new (winston.transports.Console)({ level: "debug" })
  ]
});

var MONGO = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/ld31';
var PORT = process.env.PORT || 9832;
var COLL = "scores";
var conf = require("../client/conf");
var nameRegexp = /^[a-zA-Z0-9]{3,10}$/;

logger.debug("mongo:", MONGO, COLL);
logger.debug("port:", PORT);
logger.debug("conf:", conf);

// app.use(reqLogger.create(logger));
app.use(require("body-parser").json());
app.use(serveStatic('static'));

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

function saveScore (item) {
  return Q.fcall(function () {
    if (validScore(item)) {
      return connectMongo(MONGO).then(function (db) {
        var collection = db.collection(COLL);
        item = {
          player: item.player,
          x: Math.round(item.x),
          score: Math.round(item.score),
          date: Date.now()
        };
        return Q.ninvoke(collection, "insert", item)
          .thenResolve(dbScoreToScore(item));
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
var playersCurrentData = {};

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
  var track = [];

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

  socket.once("ready", function (obj) {

    if (!_.isEqual(Object.keys(obj), ["name"]) ||
        !obj.name || !nameRegexp.exec(obj.name)) {
      logger.warn("Invalid player: ", obj);
      socket.disconnect();
      return;
    }
    debouncedGetScores().then(function (scores) {
      players[id] = obj;
      socket.emit("scores", scores);
      socket.emit("players", players);
      socket.broadcast.emit("playerenter", obj, id, Date.now());
    });

    socket.on("player", function (ev, obj) {
      if (!obj) return;
      if (!obj.pos) return;

      // TODO validate events & check illegal moves
      playersCurrentData[id] = obj;
      var y = obj.pos.y;
      socketsChunks.move([ conf.HEIGHT-y, (conf.HEIGHT-y)+conf.HEIGHT ]);

      var roomId = roomForChunk(chunkForY(y));

      socket
        .to(roomId)
        .emit("playerevent", ev, obj, id, Date.now());
    });

    socket.on("die", function (score) {
      // TODO validate that player was effectively around this place.
      socket
        .broadcast
        .emit("playerevent", "die", score, id, Date.now());
      saveScore(score).then(function (item) {
        socket.broadcast.emit("newscore", item);
        socket.emit("newscore", item);
      });
    });

    socket.on("disconnect", function () {
      socket.broadcast.emit("playerleave", id, Date.now());
      delete players[id];
    });
  });
});

http.listen(PORT, function () {
  logger.info('listening on http://localhost:'+PORT);
});
