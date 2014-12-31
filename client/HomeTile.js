var PIXI = require("pixi.js");

var HighScore = require("./HighScore");

var homeTexture = PIXI.Texture.fromImage("./img/homebg.png");

function HomeTile () {
  PIXI.Sprite.call(this, homeTexture);
}
HomeTile.prototype = Object.create(PIXI.Sprite.prototype);
HomeTile.prototype.constructor = HomeTile;

HomeTile.prototype.setScores = function (scores) {
  this.removeChildren();
  for (var i=0; i<scores.length && i < 5; ++i) {
    var score = scores[i];
    var h = new HighScore(score, i);
    h.position.set(40, 240 + 30 * i);
    this.addChild(h);
  }
};

module.exports = HomeTile;
