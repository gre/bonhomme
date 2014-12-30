var PIXI = require("pixi.js");
var generateCar = require("./generateCar");
var velUpdate = require("./behavior/velUpdate");
var Groups = require("./Groups");

var WIDTH = 84;
var HEIGHT = 48;

function Car (random, cache) {
  var texture = !cache ?
    generateCar(random) :
    cache[~~(cache.length * random())];
  PIXI.Sprite.call(this, texture);

  this._bound = {
    x:0,y:0,w:0,h:0,
    group: Groups.CAR,
    obj: this
  };
}
Car.prototype = Object.create(PIXI.Sprite.prototype);
Car.prototype.constructor = Car;
Car.prototype.destroy = function () {
  if (this.parent) this.parent.removeChild(this);
};
Car.prototype.update = function (t, dt) {
  if (!this._init) {
    this._init = true;
    this.width  = this.vel[0] < 0 ? -WIDTH : WIDTH; // FIXME hack...
    this.height = HEIGHT;
    this._bound.w = WIDTH * 0.8;
    this._bound.h = HEIGHT;
  }
  velUpdate.call(this, t, dt);
  this._bound.x = this.x + Math.min(this.width, 0) + WIDTH * 0.1;
  this._bound.y = this.y;
};
Car.prototype.toQuadTreeObject = function () {
  return this._bound;
};

module.exports = Car;
