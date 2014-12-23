var PIXI = require("pixi.js");

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

  var playerText = new PIXI.Text(score.player, { align: 'center', font: 'normal 10px '+font.name, fill: '#C40'});
  playerText.position.set(30, 10);
  this.addChild(playerText);

  var scoreText = new PIXI.Text(score.score, { align: 'center', font: 'bold 12px '+font.name, fill: '#C40'});
  scoreText.position.set(100, 10);
  this.addChild(scoreText);
};
HighScore.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
HighScore.prototype.constructor = HighScore;

module.exports = HighScore;
