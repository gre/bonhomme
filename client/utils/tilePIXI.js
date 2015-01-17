var PIXI = require("pixi.js");

function tilePIXI (size) {
  return function (baseTexture, x, y) {
    return new PIXI.Texture(baseTexture, { x: x * size, y: y * size, width: size, height: size });
  };
}

tilePIXI.tile24 = tilePIXI(24);
tilePIXI.tile64 = tilePIXI(64);
tilePIXI.tile256 = tilePIXI(256);

module.exports = tilePIXI;
