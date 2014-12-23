var PIXI = require("pixi.js");

var updateChildren = require("./behavior/updateChildren");
var findChildrenCollide = require("./behavior/findChildrenCollide");

function SpawnerCollection () {
  PIXI.DisplayObjectContainer.call(this);
}
SpawnerCollection.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
SpawnerCollection.prototype.constructor = SpawnerCollection;
SpawnerCollection.prototype.update = updateChildren;
SpawnerCollection.prototype.collides = findChildrenCollide;

module.exports = SpawnerCollection;
