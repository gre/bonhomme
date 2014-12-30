
var PIXI = require("pixi.js");

function rectIntersect (a, b) {
  var x1 = a.x;
  var x2 = a.x + a.w;
  var y1 = a.y;
  var y2 = a.y + a.h;
  var x3 = b.x;
  var x4 = b.x + b.w;
  var y3 = b.y;
  var y4 = b.y + b.h;
  var x5 = Math.max(x1, x3);
  var y5 = Math.max(y1, y3);
  var x6 = Math.min(x2, x4);
  var y6 = Math.min(y2, y4);
  return {
    from: new PIXI.Point(x5, y5),
    to: new PIXI.Point(x6, y6),
    width: x6-x5,
    height: y6-y5
  };
}

module.exports = function spriteIntersect (a, b) {
  return rectIntersect(a.toQuadTreeObject(), b.toQuadTreeObject());
};
