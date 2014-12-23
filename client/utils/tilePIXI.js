var PIXI = require("pixi.js");

function tilePIXI (size) {
  return function (baseTexture, x, y) {
    return new PIXI.Texture(baseTexture, { x: x * size, y: y * size, width: size, height: size });
  };
};
var tile64 = tilePIXI(64);
var tile24 = tilePIXI(24);

tilePIXI.tile64 = tile64;
tilePIXI.tile24 = tile24;

module.exports = tilePIXI;
