var PIXI = require("pixi.js");
var spriteCollides = require("./utils/spriteCollides");

var fireballTexture = PIXI.Texture.fromImage("./img/fireball.png");

function Fireball (scale) {
  PIXI.Sprite.call(this, fireballTexture);
  var scale = 0.3 + 0.2 * Math.random() + 0.5 * Math.random() * Math.random();
  this.scale.set(scale, scale);
  this.pivot.set(16, 16);
}
Fireball.prototype = Object.create(PIXI.Sprite.prototype);
Fireball.prototype.constructor = Fireball;
Fireball.prototype.update = function () {
  if (this.position.y > 0) this.parent.removeChild(this);
};
Fireball.prototype.hitBox = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x + 0.2 * this.width,
    y: this.y - this.pivot.y * this.scale.y + 0.2 * this.height,
    width: this.width * 0.6,
    height: this.height * 0.6
  };
};
Fireball.prototype.explodeInWorld = function (world) {
  world.fireballExplode(this);
};
Fireball.prototype.hitPlayer = function (player) {
  player.onFireball(this);
}
Fireball.prototype.collides = spriteCollides;

module.exports = Fireball;
