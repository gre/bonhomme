
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
    if (this.destroy) this.destroy();
    else if (this.parent) this.parent.removeChild(this);
  }
};
