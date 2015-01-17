var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var seedrandom = require("seedrandom");

var BitmapText = require("../pixi-extend/BitmapText");
var font = require("../font");
var Player = require("./Player");
var tilePIXI = require("../utils/tilePIXI");

var deadCarrotTexture = PIXI.Texture.fromImage("./img/carrots.png");
var deadCarrotTextures = [0,1,2].map(function (i) {
  return tilePIXI.tile64(deadCarrotTexture, i, 0);
});


function DeadCarrot (score, animated, me, size) {
  PIXI.DisplayObjectContainer.call(this);
  var random = seedrandom(score.player+":"+score.score);
  var carrot = new PIXI.Sprite(deadCarrotTextures[ (deadCarrotTextures.length * random()) | 0 ]);
  carrot.pivot.set(32, 64);
  carrot.scale.set(0.33, 0.33);
  var text = new BitmapText(score.player, { align: "center", font: font.style(size||10) });
  carrot.tint = text.tint = !me ? 0xEE6600 : 0xFF7700;
  text.updateText();
  text.position.set(-text.width/2, 0);
  this.position.set(score.x, Player.scoreToY(score.score));
  this.addChild(carrot);
  this.addChild(text);
  this.alpha = score.opacity;
  this.animated = animated;
}

DeadCarrot.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
DeadCarrot.prototype.constructor = DeadCarrot;
DeadCarrot.prototype.update = function (t) {
  if (!this.start) this.start = t;
  if (this.animated) {
    var scale = 1 + smoothstep(4000, 0, t-this.start);
    this.scale.set(scale, scale);
  }
};

module.exports = DeadCarrot;
