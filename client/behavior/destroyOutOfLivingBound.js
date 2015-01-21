
function collideRectangle (b1, b2) {
  return !(b2[0] > b2[2] || b2[2] < b1[0] || b2[1] > b2[3] || b2[3] < b1[1]);
}

module.exports = function () {
  var livingBound = this.livingBound;
  if (livingBound && !collideRectangle(this.box, livingBound)) {
    if (this.parent) this.parent.removeChild(this);
    if (this.destroy) this.destroy();
  }
};
