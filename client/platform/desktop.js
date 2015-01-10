var PIXI = require("pixi.js");
var conf = require("../conf");
var prefix = require('vendor-prefix');
var transformKey = prefix('transform');
var Q = require("q");

function setLocalName (name) {
  window.localStorage.player = name;
}
function getLocalName () {
  return window.localStorage.player;
}

function Desktop () {
  
  var gridwrap = document.createElement("div");
  gridwrap.style.overflow = "hidden";
  gridwrap.style.position = "absolute";
  gridwrap.style.zIndex = 0;
  gridwrap.style.top = "0";
  gridwrap.style.left = "0";
  gridwrap.style.width = "100%";
  gridwrap.style.height = conf.HEIGHT+"px";
  this.gridwrap = gridwrap;

  var grid = document.createElement("div");
  grid.style.position = "absolute";
  grid.style.top = "0";
  grid.style.left = "0";
  grid.style.width = "100%";
  grid.style.height = "2000px";
  grid.style[transformKey] = "translate3D(0,-9999px,0)";
  grid.style.background = "url(./img/grid.png) repeat";
  this.grid = grid;

  var interaction = document.createElement("div");
  interaction.style.position = "absolute";
  interaction.style.color = "#fff";
  interaction.style.width = conf.WIDTH+"px";
  interaction.style.height = "40px";
  interaction.style.lineHeight = "40px";
  interaction.style.font = "normal 20px sans-serif";
  this.interaction = interaction;
  this.syncInteraction();

  gridwrap.appendChild(grid);
  document.body.appendChild(gridwrap);
  document.body.appendChild(interaction);

  this.name = Q.defer();

  var cur = getLocalName();
  if (cur) {
    this.name.resolve(cur);
  }
}

Desktop.prototype = {
  syncInteraction: function () {
    var node = this.interaction;
    node.innerHTML = "";
    var name = getLocalName();
    var title = document.createElement("span"), a = document.createElement("a");
    if (name) {
      var span = document.createElement("span");
      span.textContent = "Welcome ";
      title.appendChild(span);
      a.textContent = name;
      a.style.color = "#fff";
      a.href = "#";
      a.addEventListener("click", this._reaskName.bind(this), false);
    }
    else {
      a.textContent = "Hi! can I get your name?";
      a.style.color = "#fff";
      a.href = "#";
      a.addEventListener("click", this._setName.bind(this), false);
    }
    title.appendChild(a);
    node.appendChild(title);
  },
  _setName: function (e, again) {
    e.preventDefault();
    var name = window.prompt(again===true ?
        "What's your name? (3 to 10 alphanum characters)"
      : "please give a name between 3 to 10 alphanum characters");
    if (! /^[a-zA-Z0-9]{3,10}$/.exec(name)) return this._setName(e, true);
    setLocalName(name);
    this.syncInteraction();
    this.name.resolve(name);
  },
  _reaskName: function (e) {
    e.preventDefault();
    var name = window.prompt("Change your name:", getLocalName());
    if (name) {
      setLocalName(name);
      window.location.reload();
    }
  },
  getPlayerName: function () {
    return this.name.promise;
  },

  setViewportPos: function (x, y) {
    this.gridwrap.style[transformKey] = "translate3D(0,"+y+"px,0)";
    this.canvas.style[transformKey] = "translate3D("+x+"px,"+y+"px,0)";
    this.interaction.style[transformKey] = "translate3D("+x+"px,"+(y-40)+"px,0)";
  },
  setGridY: function (y) {
    y = Math.round(y) % 1000 - 1000 - (y < 1000 ? 1000 : 0);
    if (this._lastGridY !== y) {
      this._lastGridY = y;
      this.grid.style[transformKey] = "translate3D(0,"+y+"px,0)";
    }
  },
  setGame: function (game) {
    if (!this.game) {
      this.canvas.style.boxShadow = "0px 0px 10px #fff";
    }
    this.game = game;
  },
  createRenderer: function () {
    var renderer = PIXI.autoDetectRenderer(conf.WIDTH, conf.HEIGHT, { resolution: window.devicePixelRatio });
    var canvas = renderer.view;
    canvas.style.width = conf.WIDTH+"px";
    canvas.style.height = conf.HEIGHT+"px";
    canvas.style.zIndex = 10;
    canvas.style[transformKey] = "translate3D(0,0,0)";
    this.canvas = canvas;
    document.body.appendChild(canvas);

    window.addEventListener("resize", this.onResize.bind(this), false);
    this.onResize();
    return renderer;
  },
  onResize: function () {
    var x = Math.max(0, Math.round((window.innerWidth - conf.WIDTH) / 2));
    var y = Math.max(0, Math.round((window.innerHeight - conf.HEIGHT) / 2));
    if (x !== this._lastresizex || y !== this._lastresizey) {
      this._lastresizex = x;
      this._lastresizey = y;
      this.setViewportPos(x, y);
    }
  },
  update: function () {
    if (this.game) {
      this.setGridY(this.game.world.y);
    }
  }
};

module.exports = Desktop;
