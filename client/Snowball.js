var PIXI = require("pixi.js");
var destroyOutOfMap = require("./behavior/destroyOutOfMap");
var velUpdate = require("./behavior/velUpdate");
var Groups = require("./Groups");
var dieAfterTimeout = require("./behavior/dieAfterTimeout");

var snowballTexture = PIXI.Texture.fromImage("./img/snowball.png");

// FIXME : use Vec2 for velocity
function Snowball (scale, life) {
  PIXI.Sprite.call(this, snowballTexture);
  this.pivot.set(16, 16);
  this.scale.set(scale, scale);
  this.dieTimeout = life || 6000;
}
Snowball.prototype = Object.create(PIXI.Sprite.prototype);
Snowball.prototype.constructor = Snowball;
Snowball.prototype.update = function (t, dt) {
  velUpdate.call(this, t, dt);
  destroyOutOfMap.call(this, t, dt);
  dieAfterTimeout.call(this, t, dt);
};
Snowball.prototype.toQuadTreeObject = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x + 0.2 * this.width,
    y: this.y - this.pivot.y * this.scale.y + 0.2 * this.height,
    w: this.width * 0.6,
    h: this.height * 0.6,
    obj: this,
    group: Groups.PARTICLE
  };
};
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
  if (this.parent) this.parent.removeChild(this);
};
Snowball.prototype.hitPlayer = function (player) {
  player.onSnowball(this);
};

module.exports = Snowball;
