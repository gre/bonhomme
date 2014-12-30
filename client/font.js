var PIXI = require("pixi.js");
var Q = require("q");

function load (url) {
  var d = Q.defer();
  var font = new PIXI.BitmapFontLoader(url);
  font.on("loaded", d.resolve);
  font.load();
  return d.promise;
}

module.exports = {
  ready: Q.all([ load("./fonts/Monda-Bold.xml"), load("./fonts/Monda.xml") ]),
  style: function (size, bold) {
    return (bold ? "bold" : "normal") + " " + (size||12) + " Monda";
  }
};
