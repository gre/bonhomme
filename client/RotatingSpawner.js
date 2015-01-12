
var PIXI = require("pixi.js");

function RotatingSpawner (spawner, radius, baseTexture, weaponTexture) {
  PIXI.Sprite.call(this, baseTexture);
  this.weaponTexture = weaponTexture;
  this.spawner = spawner;
  this.pivot.set(radius, radius);
  this.radius = radius;
}

RotatingSpawner.prototype = Object.create(PIXI.Sprite.prototype);
RotatingSpawner.prototype.constructor = RotatingSpawner;
RotatingSpawner.prototype.syncHeadCount = function (n) {
  var curn = this.children.length;
  var i;
  for (i=curn; i<n; ++i) {
    var head = new PIXI.Sprite(this.weaponTexture);
    head.pivot.set(this.radius, this.radius);
    head.position.set(this.radius, this.radius);
    this.addChild(head);
  }
  for (i=curn; i>n; --i) {
    this.removeChild(this.children[0]);
  }
};
RotatingSpawner.prototype.update = function (t) {
  var rots = this.spawner.getCurrentRotations(t);
  this.syncHeadCount(rots.length);
  for (var i=0; i<rots.length; ++i) {
    this.children[i].rotation = rots[i] + Math.PI/2;
  }
};

module.exports = RotatingSpawner;


