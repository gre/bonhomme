var isMobile = require("../isMobile");

module.exports = isMobile ? require("./mobile") : require("./desktop");
