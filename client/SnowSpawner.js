var PIXI = require("pixi.js");

var RotatingSpawner = require("./RotatingSpawner");
var snowSpawnerTexture = PIXI.Texture.fromImage("/img/snowspawner.png");
var snowSpawnerWeaponTexture = PIXI.Texture.fromImage("/img/snowspawnerweapon.png");

function SnowSpawner (spawner) {
  RotatingSpawner.call(this, spawner, 60, snowSpawnerTexture, snowSpawnerWeaponTexture);
  this.scale.set(0.5, 0.5);
}

SnowSpawner.prototype = Object.create(RotatingSpawner.prototype);
SnowSpawner.prototype.constructor = SnowSpawner;

module.exports = SnowSpawner;

