var PIXI = require("pixi.js");

var mapTextures = [
  PIXI.Texture.fromImage("./img/map1.png"),
  PIXI.Texture.fromImage("./img/map2.png"),
  PIXI.Texture.fromImage("./img/map3.png")
];
function MapTile (random) {
  PIXI.Sprite.call(this, mapTextures[(random() * mapTextures.length) | 0]);
}
MapTile.prototype = Object.create(PIXI.Sprite.prototype);
MapTile.prototype.constructor = MapTile;

module.exports = MapTile;
