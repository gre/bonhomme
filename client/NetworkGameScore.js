
var Qdebounce = require("qdebounce");

function NetworkGameScore (socket) {
  this.socket = socket;
  this.scores = [];
  this.refreshScores = Qdebounce(this._refreshScores.bind(this));

  var self = this;
  socket.on("scores", function (scores) {
    scores.forEach(function (s) {
      self.scores.push(s);
    });
    self.refreshScores();
  });
  socket.on("newscore", this.addScore.bind(this));
}

NetworkGameScore.prototype = {
  addScore: function (score) {
    this.scores.push(score);
    this.refreshScores();
  },
  _refreshScores: function () {
    this.scores.sort(function (a, b) {
      return a.score < b.score;
    });
    if (this.game) {
      this.game.setScores(this.scores);
    }
  },
  setGame: function (game) {
    var self = this;
    this.game = game;
    game.setScores(this.scores);
    game.on("GameOver", function (e) {
      self.socket.emit("die", e.data);
    });
  }
};

module.exports = NetworkGameScore;
