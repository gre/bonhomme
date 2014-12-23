var Qajax = require("qajax");
var _ = require("lodash");

var scoresEndPoint = "/scores";

var currentPromise;

function refreshScores () {
  currentPromise = Qajax(scoresEndPoint)
    .then(Qajax.filterSuccess)
    .then(Qajax.toJSON);
  return currentPromise;
}

function submitScore (player) {
  var score = player.getScore();
  console.log("submitScore", score);
  return Qajax(scoresEndPoint, {
    method: "PUT",
    data: score
  })
  .then(Qajax.filterSuccess);
}

module.exports = {
  refreshScores: refreshScores,
  submitScore: submitScore,
  scores: function () {
    if (!currentPromise) refreshScores();
    return currentPromise;
  }
};
