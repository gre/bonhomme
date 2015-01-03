var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");

var logoTexture = PIXI.Texture.fromImage("./img/logo.png");
var loadbarTexture = PIXI.Texture.fromImage("./img/loadbar.png");
var conf = require("./conf");

function Loading () {
  PIXI.Stage.call(this, 0x6488c6);
  this.layer = new PIXI.DisplayObjectContainer();
  this.logo = new PIXI.Sprite(logoTexture);
  this.logo.scale.set(0.5, 0.5);
  this.logo.position.set((conf.WIDTH-200)/2, 100);
  this.loadbar = new PIXI.Sprite(loadbarTexture);
  this.loadbar.scale.set(0.5, 0.5);
  this.loadbar.position.set((conf.WIDTH-200)/2, 300);
  this.layer.addChild(this.logo);
  this.layer.addChild(this.loadbar);
  this.addChild(this.layer);
  this.setProgress(0);
}

Loading.prototype = Object.create(PIXI.Stage.prototype);
Loading.prototype.constructor = Loading;

Loading.prototype.setProgress = function (p) {
  this.progress = p;
};

Loading.prototype.update = function (t) {
  this.layer.alpha = smoothstep(0, 1000, t-250);
  var mask = new PIXI.Graphics();
  mask.beginFill();
  mask.drawRect(0, 0, this.progress * conf.WIDTH, conf.HEIGHT);
  this.loadbar.mask = mask;
};

module.exports = Loading;
