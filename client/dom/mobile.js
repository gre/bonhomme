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
  getPlayerName: function () {
    return Q.delay(100).then(function getPlayerName () {
      var name = window.localStorage.player || window.prompt("What's your name? (3 to 10 alphanum characters)");
      if (!name) return null;
      if (! /^[a-zA-Z0-9]{3,10}$/.exec(name)) return getPlayerName();
      return (window.localStorage.player = name);
    });
  },

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
