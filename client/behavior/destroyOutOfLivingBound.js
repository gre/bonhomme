
var spriteCollides = require("../utils/spriteCollides");

module.exports = function () {
  var livingBound = this.livingBound;
  if (livingBound && !spriteCollides.call(this, livingBound)) {
    if (this.parent) this.parent.removeChild(this);
    if (this.destroy) this.destroy();
  }
};
