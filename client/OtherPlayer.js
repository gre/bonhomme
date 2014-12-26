var PIXI = require("pixi.js");

var font = require("./font");
var Player = require("./Player");

function OtherPlayer (name, namesContainer, maxAlpha, env) {
  this.nameSprite = new PIXI.Text("", { font: "normal 12px "+font.name, fill: "#C40" });
  Player.call(this, name);
  namesContainer.addChild(this.nameSprite);

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
  this.nameSprite.position.set(this.position.x-this.nameSprite.width/2, this.position.y+this.height * 0.4);
};

OtherPlayer.prototype.destroy = function () {
  this.nameSprite.parent.removeChild(this.nameSprite);
  this.parent.removeChild(this);
};

Object.defineProperty(OtherPlayer.prototype, "name", {
  set: function (name) {
    this._name = name;
    if (name) {
      this.nameSprite.setText(name);
    }
    else {
      this.nameSprite.setText("");
    }
  },
  get: function () {
    return this._name;
  }
});

module.exports = OtherPlayer;
