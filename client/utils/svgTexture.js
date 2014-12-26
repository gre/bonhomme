var PIXI = require("pixi.js");

// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
var DOMURL = window.URL || window.webkitURL || window;

module.exports = function (svg) {
  var data = (new window.XMLSerializer()).serializeToString(svg);
  var blob = new window.Blob([data], {type: 'image/svg+xml;charset=utf-8'});
  var url = DOMURL.createObjectURL(blob);
  return PIXI.Texture.fromImage(url);
};
