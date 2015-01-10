var PIXI = require("pixi.js");
var destroyOutOfMap = require("./behavior/destroyOutOfMap");
var velUpdate = require("./behavior/velUpdate");
var Groups = require("./Groups");
var dieAfterTimeout = require("./behavior/dieAfterTimeout");
var tilePIXI = require("./utils/tilePIXI");

var snowballsTexture = PIXI.Texture.fromImage("./img/snowballs.png");
var snowballsTextures = [0,1,2,3].map(function (i) {
  return tilePIXI.tile64(snowballsTexture, i, 0);
});

function Snowball (scale, random) {
  PIXI.Sprite.call(this, snowballsTextures[(snowballsTextures.length * random()) | 0]);
  this.rotation = 2 * Math.PI * random();
  this.pivot.set(32, 32);
  this.scale.set(scale, scale);
  this.dieTimeout = 6000;

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
  return 20 * this.scale.x;
};
Snowball.prototype.explodeInWorld = function (world) {
  world.snowballExplode(this);
  if (this.parent) this.parent.removeChild(this);
};
Snowball.prototype.hitPlayer = function (player) {
  player.onSnowball(this);
};

module.exports = Snowball;
