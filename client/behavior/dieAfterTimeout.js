
module.exports = function (t, dt) {
  var timeout = this._dieAfterTimeout;
  if (!timeout) timeout = this._dieAfterTimeout = t + (this.dieTimeout||0);
  if (t > timeout && this.parent) this.parent.removeChild(this);
};
