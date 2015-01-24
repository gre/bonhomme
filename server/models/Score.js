
var Q = require("q");

var env = require("../env");
var connectMongo = require("../utils/connectMongo");
var logger = require("../utils/logger");
var now = require("../utils/now");
var today = require("../../common/today");
var PlayerMoveState = require("../../common/PlayerMoveState");
var nameRegexp = require("../../common/PlayerName").regexp;

var COLL = "scores";

// TODO: vary with influence & score distance ?
var CARROT_PERSISTENCE = 24 * 3600 * 1000;

function encodeTrack (track) {
  return track.map(PlayerMoveState.encode);
}


function dbScoreToScore (item) {
  return {
    opacity: Math.max(0, 1 - (now() - item.date) / CARROT_PERSISTENCE),
    x: item.x,
    score: item.score,
    player: item.player
  };
}


module.exports = {
  ready: connectMongo(env.MONGO).invoke("collection", COLL).ninvoke("count"),

  valid: function (item) {
    return (
      typeof item.player === "string" && nameRegexp.exec(item.player) &&
      typeof item.x === "number" && !isNaN(item.x) &&
      typeof item.score === "number" && !isNaN(item.score) &&
      0 <= item.x && item.x <= 320 &&
      item.score > 0
    );
  },

  listDay: function (day) {
    var timeOfDay = day || today(now());
    return connectMongo(env.MONGO)
    .then(function (db) {
      var collection = db.collection(COLL);
      return Q.ninvoke(collection.find({ "date" : { "$gt": timeOfDay } }).sort({ "score": -1 }), "toArray");
    })
    .then(function (results) {
      return results.map(dbScoreToScore);
    })
    .timeout(30000);
  },

  validateUserInput: function (input, track) {
    var self = this;
    return Q.fcall(function () {
      if (self.valid(input)) {
        return {
          player: input.player,
          x: Math.round(input.x),
          score: Math.round(input.score),
          date: now(),
          track: encodeTrack(track)
        };
      }
      else {
        throw new Error("score requirement: { player /* alphanum in 3-10 chars */, x, score }");
      }
    });
  },

  save: function (item) {
    return connectMongo(env.MONGO).then(function (db) {
      var collection = db.collection(COLL);
      var score = dbScoreToScore(item);
      return Q.ninvoke(collection, "insert", item)
        .then(function () {
          logger.debug("score saved:", score);
        })
        .thenResolve(score);
    });
  }
};
