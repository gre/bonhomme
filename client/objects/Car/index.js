var PIXI = require("pixi.js");
var generateCar = require("./generateCar");
var velUpdate = require("../../behavior/velUpdate");
var destroyOutOfLivingBound = require("../../behavior/destroyOutOfLivingBound");

var WIDTH = 84;
var HEIGHT = 48;

function Car (random, livingBound) {
  PIXI.DisplayObjectContainer.call(this);
  var carObject = generateCar(random);
  this.addChild(carObject);
  this.cacheAsBitmap = true;

  this.livingBound = livingBound;
  this.box = [ 0, 0, 0, 0 ];
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
    this.w = Math.min(this.width, 0);
  }
  velUpdate.call(this, t, dt);
  this.box[0] = this.x + this.w + WIDTH * 0.1;
  this.box[1] = this.y;
  this.box[2] = this.box[0] + WIDTH * 0.8;
  this.box[3] = this.box[1] + HEIGHT;

  destroyOutOfLivingBound.call(this, t, dt);
};

module.exports = Car;
