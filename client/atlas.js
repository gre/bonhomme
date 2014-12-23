var PIXI = require("pixi.js");
var Q = require("q");

function load () {
  var d = Q.defer();
  /*
  var atlas = new PIXI.AssetLoader("./sprites.json");
  atlas.on("loaded", d.resolve);
  atlas.on("error", d.reject);
  atlas.load();
  */
  d.resolve(); // Well.. just wait AtlasLoader to be fixed...

  return d.promise;
}

module.exports = load;
