var font = require("../font");
var BitmapText = require("../pixi-extend/BitmapText");
var Player = require("./Player");

function OtherPlayer (name, namesContainer, maxAlpha, env) {
  this.nameSprite = new BitmapText("", { font: font.style(12) });
  this.nameSprite.tint = 0xCC4400;
  namesContainer.addChild(this.nameSprite);

  Player.call(this, name);
  this.maxAlpha = maxAlpha || 1;
  this.nameSprite.alpha = this.alpha = this.maxAlpha;
  this.env = env || {};
}
OtherPlayer.prototype = Object.create(Player.prototype);
OtherPlayer.prototype.constructor = OtherPlayer;

OtherPlayer.prototype.update = function (t, dt) {
  Player.prototype.update.call(this, t, dt);
  if (this.env.computeAlpha) {
    this.nameSprite.alpha = this.alpha = this.maxAlpha * this.env.computeAlpha(this.position);
  }
  this.nameSprite.position.set(this.position.x-this.nameSprite.width/2, this.y+this.height * 0.4);
};

OtherPlayer.prototype.destroy = function () {
  this.nameSprite.parent.removeChild(this.nameSprite);
  this.parent.removeChild(this);
};

Object.defineProperty(OtherPlayer.prototype, "name", {
  set: function (name) {
    this._name = name;
    this.nameSprite.text = name || "";
  },
  get: function () {
    return this._name;
  }
});

module.exports = OtherPlayer;
