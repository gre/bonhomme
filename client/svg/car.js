var fs = require('fs');
var _ = require("lodash");
var svg = require("../utils/svg");

var carSvg = svg(fs.readFileSync(__dirname + '/car.svg', 'utf8'));

function templateCar (chassisColor, shapeId) {
  var node = carSvg.cloneNode(true);
  var chassis = node.getElementById("chassis");
  chassis.style.fill = chassisColor;
  if (shapeId) {
    var shape = node.getElementById(shapeId);
    if (shape) {
      shape.style.opacity = 1;
    }
  }
  return node;
}
templateCar.shapes = _.pluck(carSvg.getElementById("shapes").children, "id");

module.exports = templateCar;
