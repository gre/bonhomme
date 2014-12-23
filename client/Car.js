var PIXI = require("pixi.js");

var spriteCollides = require("./utils/spriteCollides");

var carTextures = [
  PIXI.Texture.fromImage("./img/car1.png"),
  PIXI.Texture.fromImage("./img/car2.png"),
  PIXI.Texture.fromImage("./img/car3.png"),
  PIXI.Texture.fromImage("./img/car4.png"),
  PIXI.Texture.fromImage("./img/car5.png"),
  PIXI.Texture.fromImage("./img/car6.png"),
  PIXI.Texture.fromImage("./img/car7.png"),
  PIXI.Texture.fromImage("./img/car8.png"),
  PIXI.Texture.fromImage("./img/car9.png"),
  PIXI.Texture.fromImage("./img/car10.png")
];

function Car (random) {
  PIXI.Sprite.call(this, carTextures[~~(random() * carTextures.length)]);
  this.width = 0;
  this.height = 0;
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
