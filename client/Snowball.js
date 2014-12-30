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

  this._bound = {
    x:0,y:0,w:0,h:0,
    group: Groups.PARTICLE,
    obj: this
  };
}
Snowball.prototype = Object.create(PIXI.Sprite.prototype);
Snowball.prototype.constructor = Snowball;
Snowball.prototype.update = function (t, dt) {
  velUpdate.call(this, t, dt);
  destroyOutOfMap.call(this, t, dt);
  dieAfterTimeout.call(this, t, dt);
  var w = this.width, h = this.height;
  this._bound.x =  this.x - this.pivot.x * this.scale.x + 0.2 * w;
  this._bound.y =  this.y - this.pivot.y * this.scale.y + 0.2 * h;
  this._bound.w = w * 0.6;
  this._bound.h = h * 0.6;
};
Snowball.prototype.toQuadTreeObject = function () {
  return this._bound;
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
