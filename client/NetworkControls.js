

function NetworkControls () {
  this._x = 0;
  this._y = 0;
}

NetworkControls.prototype = {
  setState: function (state) {
    this._x = state.x;
    this._y = state.y;
  },
  x: function () {
    return this._x;
  },
  y: function () {
    return this._y;
  }
};

module.exports = NetworkControls;
