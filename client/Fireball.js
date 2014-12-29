var PIXI = require("pixi.js");
var Groups = require("./Groups");
var destroyOutOfMap = require("./behavior/destroyOutOfMap");
var velUpdate = require("./behavior/velUpdate");
var dieAfterTimeout = require("./behavior/dieAfterTimeout");

var fireballTexture = PIXI.Texture.fromImage("./img/fireball.png");

function Fireball (scale, life) {
  PIXI.Sprite.call(this, fireballTexture);
  this.pivot.set(16, 16);
  this.growSpeed = 0.005;
  this.targetScale = scale;
  this.scale.set(0, 0);
  this.dieTimeout = life || 6000;
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
  destroyOutOfMap.call(this, t, dt);
  dieAfterTimeout.call(this, t, dt);
};
Fireball.prototype.toQuadTreeObject = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x + 0.2 * this.width,
    y: this.y - this.pivot.y * this.scale.y + 0.2 * this.height,
    w: this.width * 0.6,
    h: this.height * 0.6,
    obj: this,
    group: Groups.PARTICLE
  };
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
  if (this.parent) this.parent.removeChild(this);
};
Fireball.prototype.hitPlayer = function (player) {
  player.onFireball(this);
};

module.exports = Fireball;
