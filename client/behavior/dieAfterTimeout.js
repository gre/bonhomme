
module.exports = function (t) {
  var timeout = this._dieAfterTimeout;
  if (!timeout) timeout = this._dieAfterTimeout = t + (this.dieTimeout||0);
  if (t > timeout) {
    if (this.destroy) this.destroy();
    else if (this.parent) this.parent.removeChild(this);
  }
};
