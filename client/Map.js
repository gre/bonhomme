var seedrandom = require("seedrandom");
var PIXI = require("pixi.js");
var SlidingWindow = require("sliding-window");

var conf = require("./conf");

var HomeTile = require("./HomeTile");
var MapTile = require("./MapTile");
var Spawner = require("./Spawner");
var Car = require("./Car");
var Fireball = require("./Fireball");
var Snowball = require("./Snowball");

var generators = require("./generators");

var roadTexture = PIXI.Texture.fromImage("/img/road.png");
var roadInTexture = PIXI.Texture.fromImage("/img/roadin.png");
var roadOutTexture = PIXI.Texture.fromImage("/img/roadout.png");
var roadSeparatorTexture = PIXI.Texture.fromImage("/img/roadseparator.png");

var fireSpawnerTexture = PIXI.Texture.fromImage("/img/firespawner.png");
var snowSpawnerTexture = PIXI.Texture.fromImage("/img/snowspawner.png");

function Map (seed, cars, particles, spawners, genName) {
  PIXI.DisplayObjectContainer.call(this);

  this.random = seedrandom(seed);
  this.cars = cars;
  this.particles = particles;
  this.spawners = spawners;
  this.generator = generators[genName||"v2"];
  if (!this.generator) throw new Error("no such generator "+genName);

  var mapTileSize = 480;

  var mapTiles = new PIXI.DisplayObjectContainer();
  this.addChild(mapTiles);

  this.generateMapTileWindow = new SlidingWindow(function (i) {
    var y = -i * mapTileSize;
    var tile;
    if (i ===0)
      tile = new HomeTile();
    else
      tile = new MapTile(i);
    tile.position.y = y;
    mapTiles.addChild(tile);
    return tile;
  }, function (i, tile) {
    mapTiles.removeChild(tile);
  },
  mapTileSize, 1, 1, 0);

  this.generateLevels = new SlidingWindow(
    this.allocChunk.bind(this),
    this.freeChunk.bind(this),
    this.generator.chunkSize,
    1, 1, 1);
}
Map.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Map.prototype.constructor = Map;

Map.prototype.watchWindow = function (win) {
  this._win = win;
}

Map.prototype.update = function (t, dt) {
  var win = this._win;

  if (win) {
    this.generateMapTileWindow.sync(win, t);
    this.generateLevels.sync(win, t);
  }
};

Map.prototype.freeChunk = function (i, chunk) {
  chunk.destroy();
};

Map.prototype.allocChunk = function (i, t) {
  var chunk = this.generator.generate(i, t, this.random);
  var allSprites = [];

  function track (sprite) {
    allSprites.push(sprite);
    return sprite;
  }

  // Create roads and car spawners

  var roads = track(new PIXI.DisplayObjectContainer());
  var roadsPaint = track(new PIXI.DisplayObjectContainer());
  this.addChild(roads);
  this.addChild(roadsPaint);

  (chunk.roads||[]).forEach(function (road) {
    var pos = [ road.leftToRight ? -100 : conf.WIDTH+100, road.y ];
    var ang = road.leftToRight ? 0 : Math.PI;
    var spawn = function (i, random) { return new Car(random); };
    var spawner = new Spawner({
      seed: road.y,
      pos: pos,
      spawn: spawn,
      ang: ang,
      speed: road.speed,
      vel: road.vel,
      seq: road.seq,
      livingBound: { x: -100, y: road.y, height: 100, width: conf.WIDTH+200 }
    });
    spawner.init(t);
    this.cars.addChild(track(spawner));

    var roadSprite = new PIXI.Sprite(roadTexture);
    roadSprite.position.set(0, road.y);
    roads.addChild(roadSprite);
    if (road.last) {
      roadSprite = new PIXI.Sprite(roadOutTexture);
      roadSprite.position.set(0, road.y - 10);
      roads.addChild(roadSprite);
    }
    if (road.first) {
      roadSprite = new PIXI.Sprite(roadInTexture);
      roadSprite.position.set(0, road.y + 10);
      roads.addChild(roadSprite);
    }
    if (!road.last) {
      var roadSeparator = new PIXI.Sprite(roadSeparatorTexture);
      roadSeparator.position.set(- ~~(100*Math.random()), road.y - 8);
      roadsPaint.addChild(roadSeparator);
    }
  }, this);

  // Create snowballs spawners

  (chunk.snowballs||[]).forEach(function (item) {
    var spawner = new Spawner({
      seed: ""+item.pos,
      spawn: function (i, random) {
        return new Snowball(item.scale(i, random));
      },
      pos: item.pos,
      vel: item.vel,
      rotate: item.rotate,
      speed: item.speed,
      seq: item.seq,
      life: item.life,
      angle: item.angle
    });
    spawner.init(t);
    var sprite = new PIXI.Sprite(snowSpawnerTexture);
    sprite.pivot.set(40, 40);
    sprite.scale.set(0.5, 0.5);
    sprite.position.set.apply(sprite.position, item.pos);
    this.spawners.addChild(sprite);
    this.particles.addChild(spawner);
  }, this);

  // Create fireballs spawners

  (chunk.fireballs||[]).forEach(function (item) {
    var spawner = new Spawner({
      seed: ""+item.pos,
      spawn: function (i, random) {
        return new Fireball(item.scale(i, random));
      },
      pos: item.pos,
      vel: item.vel,
      rotate: item.rotate,
      speed: item.speed,
      seq: item.seq,
      life: item.life,
      angle: item.angle
    });
    spawner.init(t);
    var sprite = new PIXI.Sprite(fireSpawnerTexture);
    sprite.pivot.set(40, 40);
    sprite.scale.set(0.5, 0.5);
    sprite.position.set.apply(sprite.position, item.pos);
    this.spawners.addChild(sprite);
    this.particles.addChild(spawner);
  }, this);

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
