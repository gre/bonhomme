var PIXI = require("pixi.js");
var Q = require("q");
var conf = require("../conf");
var prefix = require('vendor-prefix');
var transformKey = prefix('transform');

function DOM () {
  this.lockPromise = Q.fcall(function(){
    return window.screen.orientation.lock("portrait");
  });
}

DOM.prototype = {
  createRenderer: function () {
    var renderer = PIXI.autoDetectRenderer(conf.WIDTH, conf.HEIGHT, { resolution: window.devicePixelRatio });
    var canvas = renderer.view;
    canvas.style.width = conf.WIDTH+"px";
    canvas.style.height = conf.HEIGHT+"px";
    canvas.style[transformKey] = "translate3D(0,0,0)";
    this.canvas = canvas;
    document.body.appendChild(canvas);
    document.body.style.background = "#000";
    return renderer;
  },
  setGame: function () {},
  update: function () {}
};

module.exports = DOM;
