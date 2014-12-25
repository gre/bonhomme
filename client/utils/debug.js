var now = require("performance-now");
module.exports = {
  profile: function (name, f) {
    return function () {
      var start = now();
      var res = f.apply(this, arguments);
      var end = now();
      console.log((end-start).toPrecision(2)+"ms", name, arguments);
      return res;
    };
  }
};
