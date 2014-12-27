var PIXI = require("pixi.js");
var spriteCollides = require("./utils/spriteCollides");
var destroyOutOfMap = require("./behavior/destroyOutOfMap");
var velUpdate = require("./behavior/velUpdate");

var snowballTexture = PIXI.Texture.fromImage("./img/snowball.png");

// FIXME : use Vec2 for velocity
function Snowball (scale) {
  PIXI.Sprite.call(this, snowballTexture);
  this.scale.set(scale, scale);
  this.pivot.set(16, 16);
}
Snowball.prototype = Object.create(PIXI.Sprite.prototype);
Snowball.prototype.constructor = Snowball;
Snowball.prototype.update = function (t, dt) {
  destroyOutOfMap.call(this, t, dt);
  velUpdate.call(this, t, dt);
}
Snowball.prototype.hitBox = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x,
    y: this.y - this.pivot.y * this.scale.y,
    width: this.width,
    height: this.height
  };
};
Snowball.prototype.playerLifeValue = function () {
  return 10 * this.scale.x;
};
Snowball.prototype.explodeInWorld = function (world) {
  world.snowballExplode(this);
};
Snowball.prototype.hitPlayer = function (player) {
  player.onSnowball(this);
};
Snowball.prototype.collides = spriteCollides;

module.exports = Snowball;
