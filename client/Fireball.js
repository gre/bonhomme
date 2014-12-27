var PIXI = require("pixi.js");
var spriteCollides = require("./utils/spriteCollides");
var destroyOutOfMap = require("./behavior/destroyOutOfMap");

var fireballTexture = PIXI.Texture.fromImage("./img/fireball.png");

function Fireball (scale) {
  PIXI.Sprite.call(this, fireballTexture);
  this.targetScale = scale;
  this.growSpeed = 0.005;
  this.scale.set(0, 0);
  this.pivot.set(16, 16);
}
Fireball.prototype = Object.create(PIXI.Sprite.prototype);
Fireball.prototype.constructor = Fireball;
Fireball.prototype.update = function (t, dt) {
  if (!this.startT) this.startT = t;
  if (this.scale.x < this.targetScale) {
    var scale = Math.min((t-this.startT) * this.growSpeed, this.targetScale);
    this.scale.set(scale, scale);
  }
  destroyOutOfMap.call(this, t, dt);
};
Fireball.prototype.hitBox = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x + 0.2 * this.width,
    y: this.y - this.pivot.y * this.scale.y + 0.2 * this.height,
    width: this.width * 0.6,
    height: this.height * 0.6
  };
};
Fireball.prototype.playerLifeValue = function () {
  return -30 * this.scale.x;
};
Fireball.prototype.explodeInWorld = function (world) {
  world.fireballExplode(this);
};
Fireball.prototype.hitPlayer = function (player) {
  player.onFireball(this);
};
Fireball.prototype.collides = spriteCollides;

module.exports = Fireball;
