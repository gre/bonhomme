var PIXI = require("pixi.js");
var generateCar = require("./generateCar");
var velUpdate = require("./behavior/velUpdate");
var Groups = require("./Groups");

function Car (random, cache) {
  var texture = !cache ?
    generateCar(random) :
    cache[~~(cache.length * random())];
  PIXI.Sprite.call(this, texture);
}
Car.prototype = Object.create(PIXI.Sprite.prototype);
Car.prototype.constructor = Car;
Car.prototype.destroy = function () {
  if (this.parent) this.parent.removeChild(this);
};
Car.prototype.update = function (t, dt) {
  velUpdate.call(this, t, dt);
  this.width  = this.vel[0] < 0 ? -84 : 84; // FIXME hack...
  this.height = 48;
};
Car.prototype.toQuadTreeObject = function () {
  var w = Math.abs(this.width);
  return {
    x: Math.min(this.x, this.x+this.width) - this.pivot.x + w * 0.2,
    y: Math.min(this.y, this.y+this.height) - this.pivot.y,
    w: w * 0.6,
    h: Math.abs(this.height),
    obj: this,
    group: Groups.CAR
  };
};
Car.prototype.hitBox = function () {
  var w = Math.abs(this.width);
  return {
    x: Math.min(this.x, this.x+this.width) - this.pivot.x + w * 0.2,
    y: Math.min(this.y, this.y+this.height) - this.pivot.y,
    width: w * 0.6,
    height: Math.abs(this.height)
  };
};

module.exports = Car;
