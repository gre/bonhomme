var PIXI = require("pixi.js");

var mapTextures = [
  PIXI.Texture.fromImage("./img/map1.png")
];
function MapTile (index) {
  PIXI.Sprite.call(this, mapTextures[index % mapTextures.length]);
};
MapTile.prototype = Object.create(PIXI.Sprite.prototype);
MapTile.prototype.constructor = MapTile;

module.exports = MapTile;
