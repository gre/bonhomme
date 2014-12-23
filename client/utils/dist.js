module.exports = function dist (a, b) {
  var dx = a.position.x - b.position.x;
  var dy = a.position.y - b.position.y;
  return Math.sqrt(dx * dx + dy * dy);
};
