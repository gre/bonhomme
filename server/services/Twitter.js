var Twitter = require('twitter');
var Q = require("q");

var now = require("../utils/now");
var today = require("../../common/today");
var MapName = require("../models/MapName");
var Score = require("../models/Score");

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

function tweetDayResult (top5, mapname) {
    var status = "Today in "+mapname+": "+top5.map(function (score) {
      return score.player+" ("+score.score + ")";
    }).join(", ");
    console.log("Tweeting... "+status);
    return Q.ninvoke(client, "post", "statuses/update", { status: status });
  }

module.exports = {
  tweetDay: function (day) {
      if (!day) day = today(now());
    return Q.all([
      Score.listDay(day).then(function (all) { return all.slice(0, 5); }),
      MapName.computeForDay(day)
    ])
    .spread(tweetDayResult);
  }
};

