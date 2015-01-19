var Q = require("q");
var today = require("../../common/today");
var now = require("./now");
var logger = require("./logger");

module.exports = function lazyDaily (f) {
  var data, dataDay;
  return function () {
    var day = today(now());
    if (day === dataDay) return data;
    data = f(day);
    dataDay = day;
    Q(data).fail(function (e) {
      data = null;
      dataDay = null;
      logger.error("lazy daily failed: "+e);
    });
    return data;
  };
};
