var PIXI = require("pixi.js");

var HighScore = require("./HighScore");
var BitmapText = require("./BitmapText");
var font = require("./font");
var conf = require("./conf");

var homeTexture = PIXI.Texture.fromImage("./img/map1.png");
var logoTexture = PIXI.Texture.fromImage("./img/logo.png");

function HomeTile () {
  PIXI.Sprite.call(this, homeTexture);
  this.logo = new PIXI.Sprite(logoTexture);
  this.logo.scale.set(0.5, 0.5);
  this.logo.position.set((conf.WIDTH-200)/2, 0);
  this.logo.tint = 0x000000;
  this.highscoresTitle = new BitmapText("Daily Highscores", { font: font.style(18, true) });
  this.highscoresTitle.position.set(10, 200);
  this.highscoresTitle.tint = 0x111111;
  this.highscoresTitle.updateText();
  this.highscores = new PIXI.DisplayObjectContainer();
  this.addChild(this.logo);
  this.addChild(this.highscoresTitle);
  this.addChild(this.highscores);
}
HomeTile.prototype = Object.create(PIXI.Sprite.prototype);
HomeTile.prototype.constructor = HomeTile;

HomeTile.prototype.setScores = function (scores) {
  this.highscores.removeChildren();
  for (var i=0; i<scores.length && i < 5; ++i) {
    var score = scores[i];
    var h = new HighScore(score, i);
    h.position.set(40, 240 + 30 * i);
    this.highscores.addChild(h);
  }
};

module.exports = HomeTile;
