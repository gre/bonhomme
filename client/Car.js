var spriteCollides = require("./utils/spriteCollides");

var PIXI = require("pixi.js");
var svgTexture = require('./utils/svgTexture');
var templateCar = require("./svg/car");

function randomColor (r) { // TODO better color palette
  /*
  return "rgb("+[
    ~~(255*r()),
    ~~(255*r()),
    ~~(255*r())
  ]+")";
  */
  var a = r();

  return "hsl("+[
    ~~( 255 * ((3-2*a)*a*a) ),
    ~~( 80 - 70 * (0.333*(r()+r()+r())) )+"%",
    ~~( 90 - 60 * (0.5*(r()+r())) ) + "%"
  ]+")";
}

function generateCar (random) {
  var color = randomColor(random);
  var shape = random() < 0.3 ? templateCar.shapes[~~(random()*templateCar.shapes.length)] : null;
  return templateCar(color, shape);
}

function Car (random) {
  PIXI.Sprite.call(this, svgTexture(generateCar(random)));
}
Car.prototype = Object.create(PIXI.Sprite.prototype);
Car.prototype.constructor = Car;
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
