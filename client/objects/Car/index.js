var PIXI = require("pixi.js");
var generateCar = require("./generateCar");
var velUpdate = require("../../behavior/velUpdate");
var destroyOutOfLivingBound = require("../../behavior/destroyOutOfLivingBound");
var Groups = require("../../Groups");

var WIDTH = 84;
var HEIGHT = 48;

function Car (random) {
  PIXI.DisplayObjectContainer.call(this);
  var carObject = generateCar(random);
  this.addChild(carObject);

  this._bound = {
    x:0,y:0,w:0,h:0,
    group: Groups.CAR,
    obj: this
  };
}
Car.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
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
  destroyOutOfLivingBound.call(this, t, dt);
  velUpdate.call(this, t, dt);
  this._bound.x = this.x + Math.min(this.width, 0) + WIDTH * 0.1;
  this._bound.y = this.y;
};
Car.prototype.toQuadTreeObject = function () {
  return this._bound;
};

module.exports = Car;
