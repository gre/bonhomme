
var DAY = 24 * 3600 * 1000;
module.exports = function (t) {
  return DAY * ((t / DAY) | 0);
};


