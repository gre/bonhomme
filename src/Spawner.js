var PIXI = require("pixi.js");
var _ = require("lodash");
var seedrandom = require("seedrandom");

var updateChildren = require("./behavior/updateChildren");
var findChildrenCollide = require("./behavior/findChildrenCollide");

var SpawnerDefault = {
  // The initial absolute time
  initialTime: 0,

  // The duration in ms between each particle tick
  speed: 1000,
  
  // angle in radians the spawner will rotate for each particle tick
  rotate: 0,

  // Particle initial position
  pos: [0,0],

  // Spawner initial angle at initial time
  ang: 0,

  // Spawner particle velocity
  vel: 0.1,

  /**
   * an optional array to describe a pattern to loop on when spawing.
   * e.g: [ 2, -1, 3, -2 ] // 2 bullets followed by 1 hole, followed by 3 bullets, followed by 2 holes
   */
  seq: null,

  /**
   * a function whcih creates a PIXI object to use for the spawing object
   */
  spawn: null,

  // Particle life
  life: 10000,

  // optionally give a bounding box where the particles lives (dies outside)
  livingBound: null,

  // Determinist Randomness
  randLife: 0,
  randPos: 0,
  randAngle: 0,
  randVel: 0,
  seed: ""
};

/**
 * A Spawner is a PIXI container that contains particles.
 * particles are triggered reccurently based on parameters.
 */
function Spawner (parameters) {
  // console.log("new Spawner", parameters);
  PIXI.DisplayObjectContainer.call(this);
  _.extend(this, SpawnerDefault, parameters);

  if (typeof this.spawn !== "function")
    throw new Error("spawn function must be implemented and return a PIXI object.");
}

Spawner.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Spawner.prototype.constructor = Spawner;

Object.defineProperty(Spawner.prototype, "seq", {
  set: function (seq) {
    this._seq = seq;
    if (seq) {
      var seqlength = seq.reduce(function (acc, n) { return acc + Math.abs(n); }, 0);
      var pattern = new Uint8Array(seqlength);
      var p = 0;
      for (var i=0; i<seq.length; ++i) {
        var v = seq[i];
        var abs = Math.abs(v);
        for (var j=0; j<abs; ++j) {
          pattern[p++] = v > 0 ? 1 : 0;
        }
      }
      this.pattern = pattern;
    }
  },
  get: function () {
    return this._seq;
  }
});

/**
 * init the spawner from a given time (usually call once with the t given to update)
 * it can be used to trigger a lot of bullets from the past
 */
Spawner.prototype.init = function (currentTime) {
  var t = currentTime - this.initialTime;
  var ti = Math.floor(t / this.speed);
  var toffset = t - ti * this.speed;
  
  if (this.pattern) {
    var ipattern = ti % this.pattern.length;
    this._ip = ipattern;
  }

  this.lastPop = t + toffset - this.speed;
  this.lastti = ti;
};

Spawner.prototype.update = function (t, dt) {
  updateChildren.apply(this, arguments);
  this.children.forEach(function (child) {
    // Increment velocity
    child.position.x += child.vel[0] * dt;
    child.position.y += child.vel[1] * dt;

    if (t > child._dieAfter || this.livingBound && !child.collides(this.livingBound)) {
      this.removeChild(child);
    }
  }, this);

  var currentti = Math.floor((t - this.initialTime) / this.speed);

  // Trigger all missing particles or do nothing
  while (this.lastti < currentti) {
    var ti = ++this.lastti;
    var start = ti * this.speed;
    var delta = t - start;
  
    if (this.pattern) {
      var shouldSkip = this.pattern[this._ip] === 0;
      this._ip = this._ip >= this.pattern.length-1 ? 0 : this._ip + 1;
      if (shouldSkip) return;
    }

    var random = seedrandom(this.seed + "" + ti);

    var particle = this.spawn(ti, random);
    var angle = this.ang + this.randAngle * (random() - 0.5) + (this.rotate * ti) % (2*Math.PI);
    var vel = this.vel + this.randVel * (random() - 0.5);
    particle.vel = [
      vel * Math.cos(angle),
      -vel * Math.sin(angle)
    ];
    particle.position.x = this.pos[0] + this.randPos * (random() - 0.5) + particle.vel[0] * delta;
    particle.position.y = this.pos[1] + this.randPos * (random() - 0.5) + particle.vel[1] * delta;

    particle._dieAfter = start + this.life + this.randLife * (random()-0.5);
    this.addChild(particle);
  }

};
Spawner.prototype.collides = findChildrenCollide;


module.exports = Spawner;
