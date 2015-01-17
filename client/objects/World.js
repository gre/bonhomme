var PIXI = require("pixi.js");
var vibrate = require("vibrate");

var Snowball = require("./Snowball");
var ParticleExplosion = require("./ParticleExplosion");
var RingSpawner = require("./RingSpawner");

var audio = require("../audio"); // FIXME remove this dep. audio should be done on game level? Events or not events?
var conf = require("../conf");
var updateChildren = require("../behavior/updateChildren");
var spriteIntersect = require("../utils/spriteIntersect");
var tilePIXI = require("../utils/tilePIXI");
var tile64 = tilePIXI.tile64;
var tile256 = tilePIXI.tile256;

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
var playerExplosionTexture = PIXI.Texture.fromImage("./img/playerdeath.png");
var playerExplosionTextures = [
  tile256(playerExplosionTexture, 0, 0),
  tile256(playerExplosionTexture, 1, 0),
  tile256(playerExplosionTexture, 2, 0),
  tile256(playerExplosionTexture, 3, 0)
];

function playLose () {
  audio.play("lose");
}

function World (particles, explosions, explosionsPlayer) {
  PIXI.DisplayObjectContainer.call(this);
  this._focusY = 0;
  this.shaking = 0;

  this.particles = particles;
  this.explosions = explosions;
  this.explosionsPlayer = explosionsPlayer;
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
World.prototype.playerDied = function (player, isMyself) {
  var explosion = new ParticleExplosion(player.position, Math.max(100, player.width), playerExplosionTextures, 256, 200, 0.5 * Math.PI);
  this.explosionsPlayer.addChild(explosion);
  if (isMyself) {
    vibrate(400);
    setTimeout(playLose, 800);
  }
};
World.prototype.snowballExplode = function (snowball) {
  audio.play("snowballHit", snowball, 0.6);
  this.explosions.addChild(new ParticleExplosion(snowball.position, snowball.width * 2, snowExplosionTextures, 64, 150, 2*Math.PI));
};
World.prototype.carHitPlayerExplode = function (car, player) {
  var rect = spriteIntersect(car, player);
  var x = rect.from.x + (rect.to.x - rect.from.x) / 2;
  var y = rect.from.y + (rect.to.y - rect.from.y) / 2;

  this.shaking = 10 + (player.life<=0 ? 10 : 0);
  this.shakingVel = -30 / 1000;
  
  if (player.life <= 0) return;

  // FIXME move at game level
  vibrate(200);

  if (this.particles) {
    var scale = 0.2 + player.life / 2000;
    var n = ~~(5 / scale);
    this.particles.addChild(
      new RingSpawner({
        pos: [x,y],
        n: n,
        spawn: function () {
          return new Snowball(scale, Math.random);
        },
        vel: 0.1,
        front: 4 + player.width / 2,
        angleOffset: Math.random()
      })
    );
  }
};
World.prototype.fireballExplode = function (fireball) {
  audio.play("burn", fireball, 0.3);
  this.explosions.addChild(new ParticleExplosion(fireball.position, fireball.width * 2, fireExplosionTextures, 64, 150, 2*Math.PI));
};
World.prototype.getWindow = function () {
  return [ this._focusY-conf.HEIGHT, this._focusY ];
};
World.prototype.focusOn = function (player) {
  var y = conf.HEIGHT - Math.max(player.y, player.maxProgress + player.maxMoveBack + player.height / 2);

  y = Math.floor(Math.max(0, y));

  this._focusY = this._focusY + (y-this._focusY) * 0.07;
};
World.prototype.focusOnY = function (y) {
  this._focusY = y;
};

module.exports = World;
