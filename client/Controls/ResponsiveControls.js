
var KeyboardControls = require("./KeyboardControls");
var TouchControls = require("./TouchControls");

var useTouch = require("../platform/isMobile");

module.exports = useTouch ? TouchControls : KeyboardControls;
