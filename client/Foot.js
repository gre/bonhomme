var PIXI = require("pixi.js");
var tilePIXI = require("./utils/tilePIXI");

var footsTexture = PIXI.Texture.fromImage("./img/foots.png");
var footsTextures = [0,1,2,3,4,5,6,7,8,9].map(function (i) {
  return tilePIXI.tile24(footsTexture, 0, i);
});
function Foot (width) {
  PIXI.Sprite.call(this, footsTextures[~~(Math.random()*footsTextures.length)]);
  this.rotation = Math.random() * 2 * Math.PI;
  this.pivot.set(12, 12);
  this.height = this.width = width;
}
Foot.prototype = Object.create(PIXI.Sprite.prototype);
Foot.prototype.constructor = Foot;

module.exports = Foot;
