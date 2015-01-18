var Q = require("q");
var seedrandom = require("seedrandom");
var PIXI = require("pixi.js");
var SlidingWindow = require("sliding-window");

var conf = require("../conf");

var HomeTile = require("./HomeTile");
var MapTile = require("./MapTile");
var TownSign = require("./TownSign");
var FireSpawner = require("./FireSpawner");
var SnowSpawner = require("./SnowSpawner");
var Container = require("../pixi-extend/Container");
var updateChildren = require("../behavior/updateChildren");
var Road = require("./Road");
var mapGenerator = require("../map-generator");

function Map (seed, cars, particles, spawners, objects) {
  PIXI.DisplayObjectContainer.call(this);

  this.seed = seed;
  this.cars = cars;
  this.particles = particles;
  this.spawners = spawners;
  this.objects = objects;

  var mapTileSize = 400;

  var homeTile = this.homeTile = new HomeTile();

  var mapTiles = new PIXI.DisplayObjectContainer();
  this.addChild(mapTiles);

  var tile1D = Q.defer();
  this.tile1 = tile1D.promise;

  this.generateMapTileWindow = new SlidingWindow(function (i) {
    var y = -i * mapTileSize;
    var tile;
    if (i === 0) {
      tile = homeTile;
    }
    else {
      tile = new MapTile(seedrandom(seed+"tile"+i));
    }
    tile.position.y = y;
    tile.i = i;
    mapTiles.addChildAt(tile, 0);
    if (i === 1) tile1D.resolve(tile);
    return tile;
  }, function (i, tile) {
    mapTiles.removeChild(tile);
  }, {
    chunkSize: mapTileSize,
    right: 2,
    left: 1,
    bounds: [0, +Infinity]
  });

  this.generateLevels = new SlidingWindow(
    this.allocChunk.bind(this),
    this.freeChunk.bind(this), {
      chunkSize: mapGenerator.chunkSize,
      right: 1,
      left: 1,
      bounds: [1, +Infinity]
    });
}
Map.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Map.prototype.constructor = Map;

Map.prototype.setName = function (name) {
  console.log("Welcome to " + name);
  var objs = this.objects;
  this.tile1.then(function (tile) {
    var townSign = new TownSign(name);
    townSign.position.set(tile.x+100, tile.y+200);
    objs.addChild(townSign);
  }).done();
};

Map.prototype.setScores = function (scores) {
  this.homeTile.setScores(scores);
};

Map.prototype.watchWindow = function (win) {
  this._win = win;
};

Map.prototype.update = function (t, dt) {
  var win = this._win;
  updateChildren.call(this, t, dt);
  if (win) {
    this.generateMapTileWindow.move(win, t);
    this.generateLevels.move(win, t);
  }
};

Map.prototype.freeChunk = function (i, chunk) {
  chunk.destroy();
};

Map.prototype.allocChunk = function (i, t) {
  var random = seedrandom(this.seed+"-"+i);
  var chunk = mapGenerator.generate(i, t, random);
  var y = -i * mapGenerator.chunkSize;

  var allSprites = [];
  function track (sprite) {
    allSprites.push(sprite);
    return sprite;
  }

  var cars = track(new Container());
  var roads = track(new Container());
  var roadsPaint = track(new PIXI.DisplayObjectContainer());
  var particles = track(new Container());
  var spawners = track(new Container());

  this.cars.addChild(cars);
  this.addChild(roads);
  this.addChild(roadsPaint);
  this.particles.addChild(particles);
  this.spawners.addChild(spawners);

  // Create roads and car spawners

  (chunk.roads||[]).forEach(function (roadParams) {
    roadParams.y += y;
    var road = new Road(roadParams, cars, roadsPaint);
    roads.addChild(road);
  });

  // Create snowballs spawners

  (chunk.snowballs||[]).forEach(function (item) {
    item.pos[1] += y;
    var spawner = new SnowSpawner(item, particles);
    spawners.addChild(spawner);
  });

  // Create fireballs spawners

  (chunk.fireballs||[]).forEach(function (item) {
    item.pos[1] += y;
    var spawner = new FireSpawner(item, particles);
    spawners.addChild(spawner);
  });
  

  if (this.debug) {
    var debug = track(new PIXI.DisplayObjectContainer());
    var h = mapGenerator.chunkSize;
    debug.position.set(0, y);
    this.debug.addChild(debug);
    var line = new PIXI.Graphics();
    line.beginFill(0xFF0000);
    line.drawRect(0, h-2, conf.WIDTH, 2);
    line.endFill();
    var text = new PIXI.Text("chunk "+i, { fill: "#F00", font: "bold 32px monospace" });
    text.scale.set(0.5, 0.5);
    text.position.set(conf.WIDTH-text.width-4, h-4-text.height);
    var ty = h-4;
    (chunk.logs||[]).forEach(function (log) {
      var text = new PIXI.Text(log, { fill: "#F00", font: "normal 16px monospace" });
      text.scale.set(0.5, 0.5);
      ty -= text.height;
      text.position.set(4, ty);
      text.alpha = 0.7;
      debug.addChild(text);
    });
    debug.addChild(line);
    debug.addChild(text);
  }

  chunk = null;

  return {
    destroy: function () {
      allSprites.forEach(function (sprite) {
        sprite.parent.removeChild(sprite);
      });
      allSprites = null;
    }
  };
};


module.exports = Map;
