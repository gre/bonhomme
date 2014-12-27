var PIXI = require("pixi.js");
var _ = require("lodash");

var audio = require("./audio");
var conf = require("./conf");
var vibrate = require("./vibrate");

var DeadCarrot = require("./DeadCarrot");
var Snowball = require("./Snowball");
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

function ring (pos, n, scale, vel, front, Particle, angleOffset) {
  if (!angleOffset) angleOffset = 0;
  console.log("ring", n);
  return _.map(_.range(0, 2*Math.PI, 2*Math.PI / n), function (a) {
    var p = new Particle(scale);
    var angle = a + angleOffset;
    p.position.set(
      pos[0] + front * Math.cos(angle),
      pos[1] + front * Math.sin(angle)
    );
    p.vel = [
      vel * Math.cos(angle),
      vel * Math.sin(angle)
    ];
    return p;
  });
}

function World (particles) {
  PIXI.DisplayObjectContainer.call(this);
  this._focusY = 0;
  this.shaking = 0;

  this.particles = particles;
}

World.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
World.prototype.constructor = World;
World.prototype.update = function (t, dt) {
  updateChildren.call(this, t, dt);
  this.position.set(0, this._focusY);
  if (this.shaking) {
    var dx = this.shaking * (Math.random()-0.5);
    var dy = this.shaking * (Math.random()-0.5);
    this.position.x += dx;
    this.position.y += dy;
    this.shaking = Math.max(0, this.shaking + this.shakingVel * dt);
  }
};
World.prototype.playerDied = function (player) {
  var obj = player.getScore();
  obj.opacity = 1;
  var self = this;
  setTimeout(function () {
    audio.play("lose");
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

  this.shaking += 10 + (player.life<=0 ? 10 : 0);
  this.shakingVel = -30 / 1000;
  vibrate(player.life<=0 ? 400 : 200);

  if (this.particles) {
    var scale = 0.4 + player.life / 500;
    var n = ~~(10 / scale);
    ring([ x, y ], n, scale, 0.1, 4 + player.width / 2, Snowball, Math.random())
      .forEach(this.particles.addChild, this.particles);
  }
};
World.prototype.fireballExplode = function (fireball) {
  audio.play("burn", fireball, 0.3);
  this.addChild(new ParticleExplosion(fireball, fireExplosionTextures));
};
World.prototype.getWindow = function () {
  return [ this._focusY, this._focusY+conf.HEIGHT ];
};
World.prototype.focusOn = function (player) {
  var y = conf.HEIGHT - Math.max(player.y, player.maxProgress + player.maxMoveBack + player.height / 2);

  y = Math.floor(Math.max(0, y));
  //var y = HEIGHT-50-player.position.y;
  //var y = HEIGHT - Math.max(player.position.y, player.maxProgress-100);

  this._focusY = this._focusY + (y-this._focusY) * 0.07;
};
World.prototype.focusOnY = function (y) {
  this._focusY = y;
};

module.exports = World;
