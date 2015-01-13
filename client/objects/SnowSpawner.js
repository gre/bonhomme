var PIXI = require("pixi.js");
var Spawner = require("entity-spawner");

var Snowball = require("./Snowball");
var RotatingSpawner = require("./RotatingSpawner");

var snowSpawnerTexture = PIXI.Texture.fromImage("/img/snowspawner.png");
var snowSpawnerWeaponTexture = PIXI.Texture.fromImage("/img/snowspawnerweapon.png");

function SnowSpawner (item, particles) {
  var scale = item.scale;
  delete item.scale;
  item.front = 40;
  item.seed = "" + item.pos;
  item.spawn = function (o) {
    var particle = new Snowball(scale(o), o.random);
    particle.position.set.apply(particle.position, o.position);
    particle.vel = o.velocity;
    particle.rotation += o.angle;
    particles.addChild(particle);
  };
  var spawner = new Spawner(item);

  RotatingSpawner.call(this, spawner, 60, snowSpawnerTexture, snowSpawnerWeaponTexture);
  this.position.set.apply(this.position, item.pos);
  this.scale.set(0.5, 0.5);

  this.spawner = spawner;
}

SnowSpawner.prototype = Object.create(RotatingSpawner.prototype);
SnowSpawner.prototype.constructor = SnowSpawner;
SnowSpawner.prototype.update = function (t, dt) {
  RotatingSpawner.prototype.update.call(this, t, dt);
  this.spawner.update(t);
};

module.exports = SnowSpawner;

