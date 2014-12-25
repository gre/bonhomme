var PIXI = require("pixi.js");

var audio = require("./audio");
var conf = require("./conf");

var DeadCarrot = require("./DeadCarrot");
var ParticleExplosion = require("./ParticleExplosion");

var updateChildren = require("./behavior/updateChildren");
var spriteIntersect = require("./utils/spriteIntersect");
var tilePIXI = require("./utils/tilePIXI");
var tile64 = tilePIXI.tile64;

var fireExplosionTexture = PIXI.Texture.fromImage("./img/fireexplosion.png");
var fireExplosionTextures = [
  tile64(fireExplosionTexture, 0, 0),
  tile64(fireExplosionTexture, 1, 0),
  tile64(fireExplosionTexture, 2, 0)
];
var snowExplosionTexture = PIXI.Texture.fromImage("./img/snowexplosion.png");
var snowExplosionTextures = [
  tile64(snowExplosionTexture, 0, 0),
  tile64(snowExplosionTexture, 1, 0),
  tile64(snowExplosionTexture, 2, 0)
];
var playerExplosionTexture = PIXI.Texture.fromImage("./img/playerexplosion.png");
var playerExplosionTextures = [
  tile64(playerExplosionTexture, 0, 0),
  tile64(playerExplosionTexture, 1, 0),
  tile64(playerExplosionTexture, 2, 0)
];

function World () {
  PIXI.DisplayObjectContainer.call(this);
};

World.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
World.prototype.constructor = World;
World.prototype.update = updateChildren;
World.prototype.playerDied = function (player) {
  var obj = player.getScore();
  obj.opacity = 1;
  var self = this;
  setTimeout(function () {
    self.addChild(new DeadCarrot(obj, true, true));
  }, 800);
  this.addChild(new ParticleExplosion(player, playerExplosionTextures, 250));
};
World.prototype.snowballExplode = function (snowball) {
  audio.play("snowballHit", snowball, 0.6);
  this.addChild(new ParticleExplosion(snowball, snowExplosionTextures));
};
World.prototype.carHitPlayerExplode = function (car, player) {
  var rect = spriteIntersect(car, player);
  var x = rect.from.x + (rect.to.x - rect.from.x) / 2;
  var y = rect.from.y + (rect.to.y - rect.from.y) / 2;
  // this.addChild(new ParticleExplosion(/* FIXME HACK */{ position: new PIXI.Point(x, y), width: 100 }, snowExplosionTextures));
}
World.prototype.fireballExplode = function (fireball) {
  audio.play("burn", fireball, 0.3);
  this.addChild(new ParticleExplosion(fireball, fireExplosionTextures));
};
World.prototype.getWindow = function () {
  return [ this.position.y, this.position.y+conf.HEIGHT ];
};
World.prototype.focusOn = function (player) {
  var y = conf.HEIGHT - Math.max(player.position.y, player.maxSafeProgress + player.maxMoveBack + player.height / 2);

  y = Math.max(0, y);
  //var y = HEIGHT-50-player.position.y;
  //var y = HEIGHT - Math.max(player.position.y, player.maxProgress-100);
  this.position.y = this.position.y + (y-this.position.y) * 0.07;
};

module.exports = World;
