var spriteCollides = require("./utils/spriteCollides");

var PIXI = require("pixi.js");
var svgTexture = require('./utils/svgTexture');
var templateCar = require("./svg/car");

function randomColor (r) { // TODO better color palette
  var a = r(), b = r();

  var hue = ((3-2*a)*a*a);
  var sat = (0.8 - 0.7 * b * hue );
  var lum = 0.9 - 0.6 * (0.5*(r()+r()));

  if (r() < hue && r() < 0.5) {
    lum = r() < 0.5 ? lum * r() : Math.min(lum + r(), 1);
  }

  return "hsl("+[ ~~(255 * hue), ~~(100 * sat)+"%", ~~(100 * lum)+"%" ]+")";
}

function generateCar (random) {
  var color = randomColor(random);
  var shape = random() < 0.3 ? templateCar.shapes[~~(random()*templateCar.shapes.length)] : null;
  return templateCar(color, shape);
}

function Car (random) {
  var texture = svgTexture(generateCar(random));
  PIXI.Sprite.call(this, texture);
  this._texture = texture;
}
Car.prototype = Object.create(PIXI.Sprite.prototype);
Car.prototype.constructor = Car;
Car.prototype.destroy = function () {
  this._texture.destroy(true);
  if (this.parent) this.parent.removeChild(this);
};
Car.prototype.update = function () {
  this.width  = this.vel[0] < 0 ? -84 : 84; // FIXME hack...
  this.height = 48;
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
Car.prototype.collides = spriteCollides;

module.exports = Car;
