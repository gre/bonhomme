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
  // FIXME Something is wrong with either my fonts or PIXI
  ready: Q.all([ /*load("./fonts/Monda-Bold.xml")*/ , load("./fonts/Monda.xml") ]).delay(100),
  style: function (size, bold) {
    return /*(bold ? "bold" : "normal")*/"bold" + " " + (size||12) + " Monda";
  }
};
