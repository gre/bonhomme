var PIXI = require("pixi.js");
var _ = require("lodash");
var updateChildren = require("./behavior/updateChildren");
var dieWhenEmpty = require("./behavior/dieWhenEmpty");

var RingSpawnerDefault = {
  pos: [0,0],
  vel: 0.2,
  n: 8,
  spawn: null,
  front: 0,
  angleOffset: 0
};

function RingSpawner (parameters) {
  PIXI.DisplayObjectContainer.call(this);
  _.extend(this, parameters);

  if (typeof this.spawn !== "function")
    throw new Error("spawn function must be implemented and return a PIXI object.");

  this._trigger();
}

RingSpawner.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
RingSpawner.prototype.constructor = RingSpawner;
_.extend(RingSpawner.prototype, RingSpawnerDefault);

RingSpawner.prototype._trigger = function () {
  _.range(0, 2*Math.PI, 2*Math.PI / this.n).forEach(function (a) {
    var p = this.spawn();
    var angle = a + this.angleOffset;
    p.position.set(
      this.pos[0] + this.front * Math.cos(angle),
      this.pos[1] + this.front * Math.sin(angle)
    );
    p.vel = [
      this.vel * Math.cos(angle),
      this.vel * Math.sin(angle)
    ];
    this.addChild(p);
  }, this);
};

RingSpawner.prototype.update = function (t, dt) {
  updateChildren.call(this, t, dt);
  dieWhenEmpty.call(this);
};

module.exports = RingSpawner;
