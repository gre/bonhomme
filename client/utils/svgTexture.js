var PIXI = require("pixi.js");

// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
var DOMURL = window.URL || window.webkitURL || window;
var Blob = window.Blob;
var XMLSerializer = window.XMLSerializer;

var canUseBlobSvg = false; // doesn't work on current Safari
(function(){ // Test if blob & svg works correctly
  var svg = new Blob(
    ["<svg xmlns='http://www.w3.org/2000/svg'></svg>"],
    {type: "image/svg+xml;charset=utf-8"}
  );
  var img = new window.Image();
  img.onload = function() { canUseBlobSvg = true; };
  img.onerror = function() { canUseBlobSvg = false; };
  img.src = DOMURL.createObjectURL(svg);
}());

module.exports = function (svg) {
  var data = (new XMLSerializer()).serializeToString(svg);
  var url;
  if (canUseBlobSvg) {
    var blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    url = DOMURL.createObjectURL(blob);
  }
  else {
    // Fallback likely for Safari.
    url = 'data:image/svg+xml;base64,'+ window.btoa(data);
  }
  return PIXI.Texture.fromImage(url);
};
