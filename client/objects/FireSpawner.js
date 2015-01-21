var PIXI = require("pixi.js");

var Spawner = require("entity-spawner");
var Fireball = require("./Fireball");
var RotatingSpawner = require("./RotatingSpawner");
var fireSpawnerTexture = PIXI.Texture.fromImage("/img/firespawner.png");
var fireSpawnerWeaponTexture = PIXI.Texture.fromImage("/img/firespawnerweapon.png");

function FireSpawner (item, addParticle) {
  var scale = item.scale;
  delete item.scale;
  item.front = 20;
  item.seed = "" + item.pos;
  item.spawn = function (o) {
    var particle = new Fireball(scale(o));
    particle.position.set.apply(particle.position, o.position);
    particle.vel = o.velocity;
    particle.rotation = o.angle;
    addParticle(particle);
  };
  var spawner = new Spawner(item);
  
  RotatingSpawner.call(this, spawner, 60, fireSpawnerTexture, fireSpawnerWeaponTexture);
  this.position.set.apply(this.position, item.pos);
  this.scale.set(0.5, 0.5);

  this.spawner = spawner;
}

FireSpawner.prototype = Object.create(RotatingSpawner.prototype);
FireSpawner.prototype.constructor = FireSpawner;
FireSpawner.prototype.update = function (t, dt) {
  RotatingSpawner.prototype.update.call(this, t, dt);
  this.spawner.update(t);
};

module.exports = FireSpawner;
