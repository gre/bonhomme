var PIXI = require("pixi.js");
var hslToHexa = require("./utils/hslToHexa");

var chassisTexture = PIXI.Texture.fromImage("./img/car_chassis.png");
var carTopTexture = PIXI.Texture.fromImage("./img/car_top.png");
var shapesTexture = {
  racestripe1: PIXI.Texture.fromImage("./img/car_racestripe1.png"),
  racestripe2: PIXI.Texture.fromImage("./img/car_racestripe2.png"),
  racestripe3: PIXI.Texture.fromImage("./img/car_racestripe3.png")
};

var shapesKeys = Object.keys(shapesTexture);

function templateCar (chassisColor, shapes) {
  var obj = new PIXI.DisplayObjectContainer();
  var chassis = new PIXI.Sprite(chassisTexture);
  var top = new PIXI.Sprite(carTopTexture);
  chassis.tint = chassisColor;
  obj.addChild(chassis);
  shapes.forEach(function (shape) {
    var sprite = new PIXI.Sprite(shapesTexture[shape]);
    obj.addChild(sprite);
  });
  obj.addChild(top);
  obj.width = 84;
  obj.height = 48;
  return obj;
}

function randomColor (random) {
  // Pull of randomness (try to limit number of call to random())
  var a=random(), b=random(), c=random(), d=random(), e=random(), f=random();

  var hue =
    a*a // Give more important to red
    ;
  var sat =
    0.6 +
    - 0.5 * b * hue + // blue tones less saturated because ugly
    Math.pow(d, 3) // rarely very saturated
    ;
  var lum =
    0.2*(e+f) + // centered around 0.4
    (1.2 + 0.5*c) * (0.5-Math.abs(hue - 0.3)) // green tones becomes more light
    ;

  // Dark cars should have grey tones
  if (lum < 0.3) {
    lum *= 0.5; // and also a bit more darker!
    sat *= 0.3;
  }

  // Bright cars should have grey tones
  else if (lum > 0.85) {
    sat *= 0.5;
  }

  // when a bit flashy, make it more flashy!
  else if (sat > 0.5 && lum < 0.7) {
    sat = 1;
  }

  return hslToHexa(
    ~~(360 * hue),
    ~~(100 * Math.max(0, Math.min(sat, 1))),
    ~~(100 * Math.max(0, Math.min(lum, 1))));
}

function generateCar (random) {
  var color = randomColor(random);
  var shapes = random() < 0.25 ? [ shapesKeys[~~(random()*shapesKeys.length)] ] : [];
  return templateCar(color, shapes);
}

module.exports = generateCar;
