var smoothstep = require("smoothstep");
var PIXI = require("pixi.js");

var halfPI = Math.PI/2;

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
  var sprites = this.heads.children;
  var r = this.radius;
  this.syncHeadCount(heads.length);
  for (var i=0; i<heads.length; ++i) {
    var head = heads[i];
    var sprite = sprites[i];
    sprite.rotation = head.angle + halfPI;
    sprite.pivot.y = r * ( !head.trigger ? 0.8 : 1 - 0.1 * smoothstep(0.5, 0.0, head.p) );
  }
};

module.exports = RotatingSpawner;


