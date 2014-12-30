var PIXI = require("pixi.js");

var BitmapText = require("./BitmapText");
var font = require("./font");

var highscoreIcons = [
  PIXI.Texture.fromImage("./img/scoreIcon1.png"),
  PIXI.Texture.fromImage("./img/scoreIcon2.png"),
  PIXI.Texture.fromImage("./img/scoreIcon3.png")
];
function HighScore (score, i) {
  PIXI.DisplayObjectContainer.call(this);
  if (highscoreIcons[i]) {
    var icon = new PIXI.Sprite(highscoreIcons[i]);
    icon.position.set(0, 0);
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
