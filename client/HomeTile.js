var PIXI = require("pixi.js");

var HighScore = require("./HighScore");

var network = require("./network");

var homeTexture = PIXI.Texture.fromImage("./img/homebg.png");

function HomeTile () {
  PIXI.Sprite.call(this, homeTexture);
  var self = this;
  network.scores().then(function (scores) {
    scores = [].concat(scores);
    scores.sort(function (a, b) {
      return b.score - a.score;
    });
    var bestScores = scores.splice(0, 5);
    bestScores.forEach(function (score, i) {
      var h = new HighScore(score, i);
      h.position.set(40, 240 + 30 * i);
      self.addChild(h);
    });
  }).done();
}
HomeTile.prototype = Object.create(PIXI.Sprite.prototype);
HomeTile.prototype.constructor = HomeTile;

module.exports = HomeTile;
