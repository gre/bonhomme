var PIXI = require("pixi.js");
var updateChildren = require("./behavior/updateChildren");

function Container () {
  PIXI.DisplayObjectContainer.call(this);
}
Container.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Container.prototype.constructor = Container;
Container.prototype.update = updateChildren;

module.exports = Container;
