var PIXI = require("pixi.js");

var updateChildren = require("./behavior/updateChildren");

function SpawnerCollection () {
  PIXI.DisplayObjectContainer.call(this);
}
SpawnerCollection.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
SpawnerCollection.prototype.constructor = SpawnerCollection;
SpawnerCollection.prototype.update = updateChildren;

module.exports = SpawnerCollection;
