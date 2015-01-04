var PIXI = require("pixi.js");

var RotatingSpawner = require("./RotatingSpawner");
var fireSpawnerTexture = PIXI.Texture.fromImage("/img/firespawner.png");
var fireSpawnerWeaponTexture = PIXI.Texture.fromImage("/img/firespawnerweapon.png");

function FireSpawner (spawner) {
  RotatingSpawner.call(this, spawner, 60, fireSpawnerTexture, fireSpawnerWeaponTexture);
  this.scale.set(0.5, 0.5);
}

FireSpawner.prototype = Object.create(RotatingSpawner.prototype);
FireSpawner.prototype.constructor = FireSpawner;

module.exports = FireSpawner;
