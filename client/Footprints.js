var PIXI = require("pixi.js");
var SlidingWindow = require("sliding-window");

var conf = require("./conf");

var Foot = require("./Foot");

function Footprints () {
  PIXI.DisplayObjectContainer.call(this);

  this.containers = new SlidingWindow(
    this.alloc.bind(this),
    this.free.bind(this),
    100, 1, 2, 0);
}

Footprints.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Footprints.prototype.constructor = Footprints;

Footprints.prototype.alloc = function () {
  var container = new PIXI.DisplayObjectContainer();
  this.addChild(container);
  return container;
};
Footprints.prototype.free = function (i, container) {
  this.removeChild(container);
};
Footprints.prototype.watchWindow = function (win) {
  this.containers.sync(win);
};
Footprints.prototype.walk = function (position, size) {
  var foot = new Foot(size);
  foot.position.x = position.x;
  foot.position.y = position.y;
  var chunk = this.containers.getChunkForX(conf.HEIGHT-position.y);
  if (chunk) {
    chunk.addChild(foot);
  }
};

module.exports = Footprints;
