var PIXI = require("pixi.js");
var destroyOutOfMap = require("../behavior/destroyOutOfMap");
var velUpdate = require("../behavior/velUpdate");
var dieAfterTimeout = require("../behavior/dieAfterTimeout");

var fireballTexture = PIXI.Texture.fromImage("./img/fireball.png");

function Fireball (scale, life) {
  PIXI.Sprite.call(this, fireballTexture);
  this.pivot.set(16, 16);
  this.growSpeed = 0.005;
  this.targetScale = scale;
  this.initialScale = scale;
  this.scale.set(0, 0);
  this.dieTimeout = life || 6000;
  this.box = [0,0,0,0];
}
Fireball.prototype = Object.create(PIXI.Sprite.prototype);
Fireball.prototype.constructor = Fireball;
Fireball.prototype.update = function (t, dt) {
  velUpdate.call(this, t, dt);
  if (!this.startT) this.startT = t;
  if (this.scale.x < this.targetScale) {
    var scale = Math.min((t-this.startT) * this.growSpeed, this.targetScale);
    this.scale.set(scale, scale);
  }
  var w = this.width, h = this.height;
  this.box[0] = this.x - this.pivot.x * this.scale.x + 0.2 * w;
  this.box[1] = this.y - this.pivot.y * this.scale.y + 0.2 * h;
  this.box[2] = this.box[0] + w * 0.6;
  this.box[3] = this.box[1] + h * 0.6;

  destroyOutOfMap.call(this, t, dt);
  dieAfterTimeout.call(this, t, dt);
};
Fireball.prototype.playerLifeValue = function () {
  return -30 * this.initialScale;
};
Fireball.prototype.explodeInWorld = function (world) {
  world.fireballExplode(this);
  if (this.parent) this.parent.removeChild(this);
};
Fireball.prototype.hitPlayer = function (player) {
  player.onFireball(this);
};

module.exports = Fireball;
