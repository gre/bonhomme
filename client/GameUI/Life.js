var PIXI = require("pixi.js");
var font = require("../font");
var BitmapText = require("../BitmapText");
var Player = require("../Player");

var m2Texture = PIXI.Texture.fromImage("./img/m2.png");

function Life (game) {
  PIXI.DisplayObjectContainer.call(this);
  this.game = game;
  var life = new BitmapText("", { font: font.style(20) });
  this.life = life;
  var m2 = new PIXI.Sprite(m2Texture);
  this.m2 = m2;
  m2.scale.set(0.5, 0.5);
  m2.position.set(40, -12);
  this.addChild(life);
  this.addChild(m2);
}
Life.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Life.prototype.constructor = Life;

Life.prototype.update = function () {
  var playerLife = this.game.player.life;
  var s = Player.getPlayerScore(this.game.player);
  if (s > 0 && playerLife > 0) {
    this.m2.tint = this.life.tint = playerLife < 50 ? 0xFF0000 : (playerLife <= 100 ? 0xFF9900 : (playerLife <= 200 ? 0x999999 : 0x66CC66 ));
    this.life.text = "" + (playerLife / 100).toFixed(2);
    this.alpha = 1;
  }
  else {
    this.alpha = 0;
  }
};

module.exports = Life;
