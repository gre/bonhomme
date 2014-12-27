var Car = require("../../client/Car");
var PIXI = require("pixi.js");
var _ = require("lodash");

var random = Math.random.bind(Math);

var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
document.body.style.overflow = "hidden";
document.body.style.padding = "0";
document.body.style.margin = "0";
document.body.appendChild(renderer.view);

var stage = new PIXI.Stage(0x222233);
var cars = new PIXI.DisplayObjectContainer();
stage.addChild(cars);

setInterval(function () {
  _.range(0, renderer.width, 90).forEach(function (x) {
    _.range(0, renderer.height, 50).forEach(function (y) {
      var car = new Car(random);
      car.position.set(x, y);
      cars.addChild(car);
    });
  });

  renderer.render(stage);
}, 1000);
