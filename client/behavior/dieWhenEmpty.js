
module.exports = function () {
  if (this.children.length === 0) {
    this.parent.removeChild(this);
    if (this.destroy) this.destroy();
  }
};
