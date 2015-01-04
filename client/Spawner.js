var PIXI = require("pixi.js");
var _ = require("lodash");
var seedrandom = require("seedrandom");

var updateChildren = require("./behavior/updateChildren");
var destroyOutOfLivingBound = require("./behavior/destroyOutOfLivingBound");

function lazySeedrandom (seed) {
  var rnd;
  return function () {
    if (!rnd) rnd = seedrandom(seed);
    return rnd();
  };
}

var SpawnerDefault = {
  // The initial absolute time
  initialTime: 0,

  // The duration in ms between each particle tick
  speed: 1000,

  // How much particles should be spawned per particle tick
  count: 1,
  
  // angle in radians the spawner will rotate for each particle tick
  rotate: 0,
  applyRotation: true, // Should the spawner apply the rotation to the spawned item ?

  // Particle initial position
  pos: [0,0],

  // Spawner initial angle at initial time
  ang: 0,

  // Spawner particle velocity
  vel: 0.1,

  // front pixel distance
  front: 0,

  /**
   * an optional array to describe a pattern to loop on when spawing.
   * e.g: [ 2, -1, 3, -2 ] // 2 bullets followed by 1 hole, followed by 3 bullets, followed by 2 holes
   */
  seq: null,

  /**
   * a function whcih creates a PIXI object to use for the spawing object
   */
  spawn: null,

  // optionally give a bounding box where the particles lives (dies outside)
  livingBound: null,

  // Determinist Randomness
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
  _.extend(this, parameters);

  if (this.speed <= 0) throw new Error("speed must be non null positive.");

  this.maxCatchup = 1000;
  this.maxPerLoop = 100;

  if (typeof this.spawn !== "function")
    throw new Error("spawn function must be implemented and return a PIXI object.");
}

Spawner.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Spawner.prototype.constructor = Spawner;

_.extend(Spawner.prototype, SpawnerDefault);

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

// Compute the current rotation position of "heads" useful for drawing rotating weapons.
Spawner.prototype.getCurrentRotations = function (currentTime) {
  var t = currentTime - this.initialTime;
  var ti = Math.floor(t / this.speed); // FIXME this math floor can be removed once make the count working
  var angles = [];
  for (var j=0; j<this.count; ++j)
    angles.push( this.ang + (this.rotate * (this.count * ti + j)) % (2*Math.PI) );
  return angles;
};

Spawner.prototype.update = function (t, dt) {
  updateChildren.call(this, t, dt);
  destroyOutOfLivingBound.call(this, t, dt);

  var maxCatchup = this.maxCatchup;
  var maxPerLoop = this.maxPerLoop;

  var currentti = Math.floor((t - this.initialTime) / this.speed);
  var deltai = currentti - this.lastti;

  if (deltai > maxCatchup) { // Avoid overflow of particles
    console.log("Spawner: "+deltai+" particles to catchup. maximized to "+maxCatchup+" and lost some.");
    this.lastti = currentti -  100;
  }

  // Trigger all missing particles or do nothing
  for (var i=0; this.lastti < currentti && i<maxPerLoop; ++i) {
    var ti = ++this.lastti;
    if (this.pattern) {
      var shouldSkip = this.pattern[this._ip] === 0;
      this._ip = this._ip >= this.pattern.length-1 ? 0 : this._ip + 1;
      if (shouldSkip) continue;
    }

    var delta = t - ti * this.speed;
    var random = lazySeedrandom(this.seed + "@" + ti);

    // FIXME: this is not tested and used yet...
    for (var j=0; j<this.count; ++j) {
      var particle = this.spawn(ti, random, j);
      var angle = this.ang + this.randAngle * (random() - 0.5) + (this.rotate * (this.count * ti + j)) % (2*Math.PI);
      var vel = this.vel + this.randVel * (random() - 0.5);
      var xAngle = Math.cos(angle);
      var yAngle = Math.sin(angle);
      var velx = vel * xAngle;
      var vely = vel * yAngle;
      particle.x = this.pos[0] + this.randPos * (random() - 0.5) + velx * delta + this.front * xAngle;
      particle.y = this.pos[1] + this.randPos * (random() - 0.5) + vely * delta + this.front * yAngle;
      if (vel) {
        particle.vel = [ velx, vely ];
      }
      if (this.applyRotation) {
        particle.rotation = angle;
      }
      this.addChild(particle);
    }
  }

};

module.exports = Spawner;
