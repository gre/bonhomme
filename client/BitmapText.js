var PIXI = require("pixi.js");

function BitmapText () {
  PIXI.BitmapText.apply(this, arguments);
  this._text = this.text;
}
BitmapText.prototype = Object.create(PIXI.BitmapText.prototype);
BitmapText.prototype.constructor = BitmapText;

Object.defineProperty(BitmapText.prototype, "text", {
  set: function (text) {
    if (this._text !== text) {
      this.setText(this._text = ""+text);
    }
  },
  get: function () {
    return this._text;
  }
});


module.exports = BitmapText;
