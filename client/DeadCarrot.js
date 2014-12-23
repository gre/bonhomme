var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var font = require("./font");
var Player = require("./Player");

var deadCarrotTexture = PIXI.Texture.fromImage("./img/dead_carrot.png");

function DeadCarrot (score, animated, me, size) {
  PIXI.DisplayObjectContainer.call(this);
  var carrot = new PIXI.Sprite(deadCarrotTexture);
  carrot.pivot.set(12, 24);
  var text = new PIXI.Text(score.player, { align: 'center', font: 'normal '+(size||10)+'px '+font.name, fill: me ?  '#F40' : '#C40'});
  text.position.set(-text.width/2, 0);
  this.position.set(score.x, Player.scoreToY(score.score));
  this.addChild(carrot);
  this.addChild(text);
  this.alpha = score.opacity;
  this.animated = animated;
  this.start = Date.now();
};

DeadCarrot.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
DeadCarrot.prototype.constructor = DeadCarrot;
DeadCarrot.prototype.update = function () {
  if (this.animated) {
    var scale = 1 + smoothstep(4000, 0, Date.now()-this.start);
    this.scale.set(scale, scale);
  }
};

module.exports = DeadCarrot;
