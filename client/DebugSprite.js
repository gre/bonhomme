var PIXI = require("pixi.js");

var debugTexture = PIXI.Texture.fromImage("./img/debug.png");

function DebugSprite (observe) {
  PIXI.Sprite.call(this, debugTexture);
  this.o = observe;
}
DebugSprite.prototype = Object.create(PIXI.Sprite.prototype);
DebugSprite.prototype.constructor = DebugSprite;
DebugSprite.prototype.update = function () {
  var hitBox = this.o.hitBox();
  this.position.set(hitBox.x, hitBox.y);
  this.width = hitBox.width;
  this.height = hitBox.height;
};

module.exports = DebugSprite;
