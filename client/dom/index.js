var isMobile = require("../isMobile");

// FIXME dom: Rename this dir to "plateform" I think

module.exports = isMobile ? require("./mobile") : require("./desktop");
