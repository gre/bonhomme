#!/usr/bin/env node

require('date-utils');

var MongoClient = require('mongodb').MongoClient;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var serveStatic = require('serve-static');
var Q = require("q");
var Qdebounce = require("qdebounce");
var _ = require("lodash");
var ntp = require("socket-ntp");
var SlidingWindow = require("sliding-window");

var conf = require("../client/conf");

var nameRegexp = /^[a-zA-Z0-9]{3,10}$/;

app.use(require("body-parser").json());
app.use(serveStatic('static'));

var MONGO = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/ld31';
var PORT = process.env.PORT || 9832;
var COLL = "scores";

var connectMongo = Q.nbind(MongoClient.connect, MongoClient);

connectMongo(MONGO)
  .then(function (db) {
    return Q.ninvoke(db.collection(COLL).find(), "toArray");
  })
  .then(function (res) {
    console.log("Nb Entries: "+res.length);
  })
  .done();


// TODO: vary with influence.
var CARROT_PERSISTENCE = 24 * 3600 * 1000;

function getScores () {
  var timeOfDay = +Date.today();
  return connectMongo(MONGO)
  .then(function (db) {
    var collection = db.collection(COLL);
    return Q.ninvoke(collection.find({ "date" : { "$gt": timeOfDay } }).sort({ "score": -1 }), "toArray");
  })
  .then(function (results) {
    return results.map(function (item) {
      return {
        opacity: Math.max(0, 1 - (Date.now() - item.date) / CARROT_PERSISTENCE),
        x: item.x,
        score: item.score,
        player: item.player
      };
    });
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
        return Q.ninvoke(collection, "insert", item).thenResolve(item);
      });
    }
    else {
      console.log(item);
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
  ntp.sync(socket);

  var id = socket.id;
  var ready = false;

  console.log("connected", id);

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

  socket.on("ready", function (obj) {
    if (ready) return;
    ready = true;
    if (!_.isEqual(Object.keys(obj), ["name"]) ||
        !obj.name || !nameRegexp.exec(obj.name)) {
      console.log("Invalid player: ", obj);
      socket.disconnect();
      return;
    }
    debouncedGetScores().then(function (scores) {
      players[id] = obj;
      socket.emit("scores", scores);
      socket.emit("players", players);
      socket.broadcast.emit("playerenter", obj, id, Date.now());
    });
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

  socket.on("player", function (ev, obj) {
    if (!ready) return;

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

  socket.on("disconnect", function () {
    if (!ready) return;
    console.log("disconnected", id);
    socket.broadcast.emit("playerleave", id, Date.now());
    delete players[id];
  });
});

http.listen(PORT, function () {
  console.log('listening on http://localhost:'+PORT);
});
