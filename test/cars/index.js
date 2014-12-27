var Car = require("../../client/Car");
var PIXI = require("pixi.js");
var requestAnimFrame = require("raf");
var _ = require("lodash");

var mathRandom = Math.random.bind(Math);

function prependRandom (start, cont) {
  var i = 0;
  return function () {
    return i < start.length ? start[i++] : cont();
  };
}


var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
document.body.style.overflow = "hidden";
document.body.style.padding = "0";
document.body.style.margin = "0";
document.body.appendChild(renderer.view);

var stage = new PIXI.Stage(0x222233);
var cars = new PIXI.DisplayObjectContainer();
stage.addChild(cars);

setInterval(function () {
  cars.children.forEach(function (car) {
    setTimeout(function () {
      car.destroy();
    }, 500+500*Math.random()); // delay a bit the destroy to remove blinks
  });
  _.range(0, renderer.width, 90).forEach(function (x) {
    _.range(0, renderer.height, 50).forEach(function (y) {
      var random = prependRandom([ y/renderer.height, x/renderer.width ], mathRandom);
      var car = new Car(random);
      car.position.set(x, y);
      cars.addChild(car);
    });
  });
}, 1000);

requestAnimFrame(function loop () {
  requestAnimFrame(loop);
  renderer.render(stage);
});
