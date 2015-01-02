
var KeyboardControls = require("./KeyboardControls");
var TouchControls = require("./TouchControls");

var useTouch = require("./isMobile");

module.exports = useTouch ? TouchControls : KeyboardControls;
