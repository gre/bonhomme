
function TouchControls () {
  window.addEventListener("touchstart", this._onStart.bind(this), false);
  window.addEventListener("touchend", this._onEnd.bind(this), false);
  window.addEventListener("touchmove", this._onMove.bind(this), false);
  window.addEventListener("touchcancel", this._onCancel.bind(this), false);

  this._paused = false;
  this.touchEventId = null;
}

function touchForIdentifier (touches, id) {
  if (id === null) return null;
  var length = touches.length;
  for (var i=0; i<length; ++i)
    if (id === touches[i].identifier)
      return touches[i];
  return null;
}

function posForTouch (touch) {
  return [ touch.screenX, touch.screenY ];
}

TouchControls.prototype = {
  _onStart: function (e) {
    e.preventDefault();
    if (this.touchEventId) return;
    var touch = e.changedTouches[0];
    this.touchEventId = touch.identifier;
    this.startPos = posForTouch(touch);
    this.movePos = this.startPos;
  },
  _onMove: function (e) {
    var touch = touchForIdentifier(e.changedTouches, this.touchEventId);
    if (touch) {
      this.movePos = posForTouch(touch);
    }
  },
  _onEnd: function (e) {
    this.startPos = null;
    this.movePos = null;
  },
  _onCancel: function (e) {
    this.startPos = null;
    this.movePos = null;
  },
  paused: function () {
    return this._paused;
  },
  x: function () {
    if (this._paused) return 0;
    if (!this.startPos || !this.movePos) return 0;
    var dx = this.movePos[0]-this.startPos[0];
    if (Math.abs(dx) < 50) return 0;
    return dx < 0 ? -1 : 1;
  },
  y: function () {
    if (this._paused) return 0;
    if (!this.startPos || !this.movePos) return 0;
    var dy = this.movePos[1]-this.startPos[1];
    if (Math.abs(dy) < 30) return 0;
    return dy < 0 ? 1 : -1;
  }
};

module.exports = TouchControls;
