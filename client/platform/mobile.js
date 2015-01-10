var PIXI = require("pixi.js");
var Q = require("q");
var conf = require("../conf");
var prefix = require('vendor-prefix');
var transformKey = prefix('transform');
var prompt = require("./prompt");

function setLocalName (name) {
  window.localStorage.player = name;
}
function getLocalName () {
  return window.localStorage.player;
}

function Mobile () {
  this.lockPromise = Q.fcall(function(){
    return window.screen.orientation.lock("portrait");
  });
}

Mobile.prototype = {
  getPlayerName: function () {
    return Q(getLocalName()) || this.askName();
  },

  askName: function (again) {
    var self = this;
    return prompt(!again ?
        "What's your name? (3 to 10 alphanum characters)"
      : "please give a name between 3 to 10 alphanum characters")
      .then(function (name) {
        if (! /^[a-zA-Z0-9]{3,10}$/.exec(name)) return self.askName(true);
        setLocalName(name);
        return name;
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

module.exports = Mobile;
