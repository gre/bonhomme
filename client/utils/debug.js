var now = require("performance-now");
module.exports = {
  profile: function (name, f, aggregate) {
    aggregate = aggregate || 1;
    var sum = 0;
    var count = 0;
    return function () {
      var start = now();
      var res = f.apply(this, arguments);
      var end = now();
      sum += (end-start);
      count ++;
      if (count > aggregate) {
        console.log((sum / count).toPrecision(2)+"ms", name);
        sum = 0;
        count = 0;
      }
      return res;
    };
  }
};
