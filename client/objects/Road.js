var PIXI = require("pixi.js");
var Spawner = require("entity-spawner");

var conf = require("../conf");

var Car = require("./Car");

var roadTexture = PIXI.Texture.fromImage("./img/road.png");
var roadInOutTexture = PIXI.Texture.fromImage("./img/roadinout.png");
var roadInTexture = PIXI.Texture.fromImage("./img/roadin.png");
var roadOutTexture = PIXI.Texture.fromImage("./img/roadout.png");
var roadSeparatorTexture = PIXI.Texture.fromImage("./img/roadseparator.png");

function Road(road, addCar, roadsPaint) {
  PIXI.DisplayObjectContainer.call(this);

  var pos = [road.leftToRight ? -100 : conf.WIDTH + 100, road.y];
  var ang = road.leftToRight ? 0 : Math.PI;
  var spawn = function(o) {
    var car = new Car(o.random, [-100, road.y, conf.WIDTH + 100, road.y + 100]);
    car.position.set.apply(car.position, o.position);
    car.vel = o.velocity;
    addCar(car);
  };
  var spawner = new Spawner({
    seed: road.y,
    pos: pos,
    spawn: spawn,
    ang: ang,
    speed: road.speed,
    vel: road.vel,
    pattern: road.seq
  });

  var texture = road.last
    ? road.first ? roadInOutTexture : roadOutTexture
    : road.first ? roadInTexture : roadTexture;
  var roadSprite = new PIXI.Sprite(texture);
  roadSprite.position.set(0, road.y);
  this.addChild(roadSprite);
  if (!road.last) {
    var roadSeparator = new PIXI.Sprite(roadSeparatorTexture);
    roadSeparator.position.set(-~~(100 * Math.random()), road.y - 8);
    roadsPaint.addChild(roadSeparator);
  }

  this.spawner = spawner;
}

Road.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Road.prototype.constructor = Road;

Road.prototype.update = function(t) {
  if (!this._init) {
    this._init = true;
    this.spawner.init(t);
  }
  this.spawner.update(t);
};

module.exports = Road;
