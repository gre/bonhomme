
var spriteCollides = require("../utils/spriteCollides");

module.exports = function () {
  if (this.livingBound) {
    var children = this.children;
    for (var i=0; i<children.length; ++i) {
      var child = children[i];
      if (!spriteCollides.call(child, this.livingBound)) {
        if (child.parent) child.parent.removeChild(child);
        if (child.destroy) child.destroy();
      }
    }
  }
};
