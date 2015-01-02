
var Qdebounce = require("qdebounce");
var conf = require("./conf");
var EV = conf.events;

function NetworkGameScore (socket) {
  this.socket = socket;
  this.scores = [];
  this.refreshScores = Qdebounce(this._refreshScores.bind(this), 800);

  var self = this;
  socket.on(EV.scores, function (scores) {
    self.scores = self.scores.concat(scores);
    self.refreshScores(false);
  });
  socket.on(EV.newscore, this.addScore.bind(this));
}

NetworkGameScore.prototype = {
  addScore: function (score) {
    this.scores.push(score);
    this.refreshScores(true);
  },
  _refreshScores: function (animated) {
    this.scores.sort(function (a, b) {
      return a.score < b.score;
    });
    if (this.game) {
      this.game.setScores(this.scores, animated);
    }
  },
  setGame: function (game) {
    var self = this;
    this.game = game;
    game.setScores(this.scores);
    game.on("GameOver", function (e) {
      self.socket.emit(EV.playerdie, e.data);
    });
  }
};

module.exports = NetworkGameScore;
