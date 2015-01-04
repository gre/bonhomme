
var PIXI = require("pixi.js");

function RotatingSpawner (spawner, radius, baseTexture, weaponTexture) {
  PIXI.Sprite.call(this, baseTexture);
  this.weaponTexture = weaponTexture;
  this.spawner = spawner;
  this.heads = [];
  this.pivot.set(radius, radius);
  for (var i=0; i<spawner.count; ++i) {
    var head = new PIXI.Sprite(weaponTexture);
    head.pivot.set(radius, radius);
    head.position.set(radius, radius);
    this.addChild(head);
    this.heads.push(head);
  }
}

RotatingSpawner.prototype = Object.create(PIXI.Sprite.prototype);
RotatingSpawner.prototype.constructor = RotatingSpawner;
RotatingSpawner.prototype.update = function (t) {
  var rots = this.spawner.getCurrentRotations(t);
  for (var i=0; i<rots.length; ++i) {
    this.heads[i].rotation = rots[i] + Math.PI/2;
  }
};

module.exports = RotatingSpawner;


