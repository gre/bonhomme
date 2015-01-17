var PIXI = require("pixi.js");

function ParticleExplosion (position, size, textures, textureSize, speed, randomRotation) {
  PIXI.DisplayObjectContainer.call(this);
  var pivot = textureSize / 2;
  this.position.x = position.x;
  this.position.y = position.y;
  this.speed = speed;
  this.nb = textures.length;
  var rot = 0;
  this.sprites = textures.map(function (t) {
    var s = new PIXI.Sprite(t);
    s.pivot.set(pivot, pivot);
    if (randomRotation)
      s.rotation = ( rot += randomRotation * (Math.random()-0.5) );
    s.width = s.height = size;
    return s;
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
