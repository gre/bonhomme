
var PIXI = require("pixi.js");

function RotatingSpawner (spawner, radius, baseTexture, weaponTexture) {
  PIXI.DisplayObjectContainer.call(this);
  this.weaponTexture = weaponTexture;
  this.spawner = spawner;
  this.pivot.set(radius, radius);
  this.radius = radius;
  this.heads = new PIXI.DisplayObjectContainer();
  this.addChild(this.heads);
  this.addChild(new PIXI.Sprite(baseTexture));
}

RotatingSpawner.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
RotatingSpawner.prototype.constructor = RotatingSpawner;
RotatingSpawner.prototype.syncHeadCount = function (n) {
  var curn = this.heads.children.length;
  var i;
  for (i=curn; i<n; ++i) {
    var head = new PIXI.Sprite(this.weaponTexture);
    head.pivot.set(this.radius, this.radius);
    head.position.set(this.radius, this.radius);
    this.heads.addChild(head);
  }
  for (i=curn; i>n; --i) {
    this.heads.removeChild(this.children[0]);
  }
};
RotatingSpawner.prototype.update = function (t) {
  var heads = this.spawner.getHeads(t);
  this.syncHeadCount(heads.length);
  for (var i=0; i<heads.length; ++i) {
    var head = heads[i];
    var sprite = this.heads.children[i];
    sprite.rotation = head.angle + Math.PI/2;
    sprite.pivot.y = (head.trigger ? 1 : 0.8) * this.radius;
  }
};

module.exports = RotatingSpawner;


