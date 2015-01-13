
function KeyboardControls () {
  this._keys = {};
  document.body.addEventListener("keydown", this._onDown.bind(this), false);
  document.body.addEventListener("keyup", this._onUp.bind(this), false);
  window.addEventListener("focus", this._onFocus.bind(this), false);
  window.addEventListener("blur", this._onBlur.bind(this), false);
}

KeyboardControls.prototype = {
  _onFocus: function () {
    this._paused = 0;
  },
  _onBlur: function () {
    this._paused = 1;
  },
  _onDown: function (e) {
    if ([37,38,39,40].indexOf(e.which) >= 0)
      e.preventDefault();
    this._keys[e.which] = 1;
  },
  _onUp: function (e) {
    this._keys[e.which] = 0;
  },
  paused: function () {
    return this._paused;
  },
  x: function () {
    if (this._paused) return 0;
    var left = !!(this._keys[37] || this._keys[81] || this._keys[65]);
    var right = !!(this._keys[39] || this._keys[68]);
    return -left +right;
  },
  y: function () {
    if (this._paused) return 0;
    var up = !!(this._keys[38] || this._keys[90] || this._keys[87]);
    var down = !!(this._keys[40] || this._keys[83]);
    return +up -down;
  }
};

module.exports = KeyboardControls;
