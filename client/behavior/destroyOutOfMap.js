
var conf = require("../conf");

module.exports = function () {
  if (
    this.position.y > 0 ||
    this.position.x < -this.width ||
    this.position.x > conf.WIDTH+this.width
  ) {
    this.parent.removeChild(this);
    if (this.destroy) this.destroy();
  }
};
