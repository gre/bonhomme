
var conf = require("../conf");

module.exports = function () {
  var x = this.x;
  var y = this.y;
  var w = this.width;
  if (
    y > 0 ||
    x < -w ||
    x > conf.WIDTH + w
  ) {
    this.parent.removeChild(this);
    if (this.destroy) this.destroy();
  }
};
