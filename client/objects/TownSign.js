var PIXI = require("pixi.js");
var BitmapText = require("../pixi-extend/BitmapText");
var font = require("../font");

var townSignTexture = PIXI.Texture.fromImage("./img/townsign.png");

function TownSign (name) {
  PIXI.DisplayObjectContainer.call(this);
  var townSign = new PIXI.Sprite(townSignTexture);
  var townName = new BitmapText(name, { font: font.style(50) });
  townName.tint = 0x010101;
  townName.updateText();
  townName.position.set(
    75 + (250-townName.width) / 2,
    130 + (70-townName.height) / 2);

  this.addChild(townSign);
  this.addChild(townName);
  this.pivot.set(200, 375);
  this.scale.set(0.5, 0.5);
}
TownSign.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
TownSign.prototype.constructor = TownSign;

module.exports = TownSign;
