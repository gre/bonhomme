var PIXI = require("pixi.js");

function ParticleExplosion (ref, textures, speed) {
  PIXI.DisplayObjectContainer.call(this);
  this.position.x = ref.position.x;
  this.position.y = ref.position.y;
  this.speed = speed || 150;
  this.alpha = ref.alpha || 1;
  this.width = ref.width;
  this.height = ref.width;
  this.rotation = Math.random() * 2 * Math.PI;
  this.pivot.set(32, 32);
  this.nb = textures.length;
  this.sprites = textures.map(function (t) {
    return new PIXI.Sprite(t);
  });
}
ParticleExplosion.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
ParticleExplosion.prototype.constructor = ParticleExplosion;
ParticleExplosion.prototype.update = function (t) {
  if (!this.current) {
    this.start = t;
  }
  var i = ~~((t-this.start)/this.speed);
  if (i < this.nb) {
    var s = this.sprites[i];
    if (s !== this.current) {
      if (this.current) this.removeChild(this.current);
      this.addChild(s);
      this.current = s;
    }
  }
  else {
    this.parent.removeChild(this);
  }
};

module.exports = ParticleExplosion;
