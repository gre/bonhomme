
var Qajax = require("qajax");

function getScores () {
  return Qajax("/scores")
    .then(Qajax.filterSuccess)
    .then(Qajax.toJSON);
}

function submitScore (player) {
  var score = player.getScore();
  console.log("submitScore", score);
  return Qajax("/scores", {
    method: "PUT",
    data: score
  })
  .then(Qajax.filterSuccess);
}

function NetworkGameScore (socket) {
  this.socket = socket;
}

NetworkGameScore.prototype = {
  setGame: function (game) {
    getScores().then(game.setScores.bind(game)).done();
    game.on("GameOver", function () {
      submitScore(game.player)
        .delay(6000)
        .done();
    });
  }
};

module.exports = NetworkGameScore;
