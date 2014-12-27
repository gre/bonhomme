var generateCar = require("./generateCar");

function generateCars (nb, random) {
  var cars = [];
  for (var i=0; i<nb; ++i) {
    cars.push(generateCar(random));
  }
  return cars;
}

module.exports = generateCars;
