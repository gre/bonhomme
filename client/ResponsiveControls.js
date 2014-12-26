
var KeyboardControls = require("./KeyboardControls");
var TouchControls = require("./TouchControls");

var useTouch = window.navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i);

module.exports = useTouch ? TouchControls : KeyboardControls;
