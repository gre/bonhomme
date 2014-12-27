
var templateCar = require("./svg/car");
var svgTexture = require('./utils/svgTexture');

function randomColor (r) {
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
  return svgTexture(templateCar(color, shape));
}

module.exports = generateCar;
