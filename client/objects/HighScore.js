var PIXI = require("pixi.js");

var BitmapText = require("../pixi-extend/BitmapText");
var font = require("../font");
var tilePIXI = require("../utils/tilePIXI");

var highscoreColors = [
  0xFFCC22,
  0x99AABB,
  0xc67d28
];
var carrotTexture = tilePIXI.tile64(PIXI.Texture.fromImage("./img/carrots.png"), 0, 0);

function HighScore (score, i) {
  PIXI.DisplayObjectContainer.call(this);
  if (highscoreColors[i]) {
    var icon = new PIXI.Sprite(carrotTexture);
    icon.width = icon.height = 24;
    icon.tint = highscoreColors[i];
    icon.position.set(2, 2);
    this.addChild(icon);
  }

  var playerText = new BitmapText(score.player, { align: "center", font: font.style(10) });
  playerText.tint = 0xCC4400;
  playerText.updateText();
  playerText.position.set(30, 10);
  this.addChild(playerText);

  var scoreText = new BitmapText(""+score.score, { align: "center", font: font.style(12, true)});
  scoreText.tint = 0xCC4400;
  scoreText.updateText();
  scoreText.position.set(100, 10);
  this.addChild(scoreText);
}
HighScore.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
HighScore.prototype.constructor = HighScore;

module.exports = HighScore;
