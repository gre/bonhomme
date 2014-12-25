var PIXI = require("pixi.js");

var conf = require("./conf");
var spriteCollides = require("./utils/spriteCollides");

var snowballTexture = PIXI.Texture.fromImage("./img/snowball.png");

function Snowball (scale) {
  PIXI.Sprite.call(this, snowballTexture);
  this.scale.set(scale, scale);
  this.pivot.set(16, 16);
}
Snowball.prototype = Object.create(PIXI.Sprite.prototype);
Snowball.prototype.constructor = Snowball;
Snowball.prototype.update = function () {
  if (
    this.position.y > 0
    || this.position.x < -this.width
    || this.position.x > conf.WIDTH+this.width
  ) this.parent.removeChild(this);
};
Snowball.prototype.hitBox = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x,
    y: this.y - this.pivot.y * this.scale.y,
    width: this.width,
    height: this.height
  };
};
Snowball.prototype.explodeInWorld = function (world) {
  world.snowballExplode(this);
};
Snowball.prototype.hitPlayer = function (player) {
  player.onSnowball(this);
};
Snowball.prototype.collides = spriteCollides;

module.exports = Snowball;
