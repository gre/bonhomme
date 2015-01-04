var seedrandom = require("seedrandom");
var PIXI = require("pixi.js");
var SlidingWindow = require("sliding-window");

var conf = require("./conf");
// var debug = require("./utils/debug");

var HomeTile = require("./HomeTile");
var MapTile = require("./MapTile");
var Spawner = require("./Spawner");
var Car = require("./Car");
var Fireball = require("./Fireball");
var Snowball = require("./Snowball");

var mapGenerator = require("./map-generator");

var roadTexture = PIXI.Texture.fromImage("/img/road.png");
var roadInTexture = PIXI.Texture.fromImage("/img/roadin.png");
var roadOutTexture = PIXI.Texture.fromImage("/img/roadout.png");
var roadSeparatorTexture = PIXI.Texture.fromImage("/img/roadseparator.png");

var fireSpawnerTexture = PIXI.Texture.fromImage("/img/firespawner.png");
var snowSpawnerTexture = PIXI.Texture.fromImage("/img/snowspawner.png");

function Map (seed, cars, particles, spawners) {
  PIXI.DisplayObjectContainer.call(this);

  this.seed = seed;
  this.cars = cars;
  this.particles = particles;
  this.spawners = spawners;

  var mapTileSize = 480;

  var homeTile = this.homeTile = new HomeTile();

  var mapTiles = new PIXI.DisplayObjectContainer();
  this.addChild(mapTiles);

  this.generateMapTileWindow = new SlidingWindow(function (i) {
    var y = -i * mapTileSize;
    var tile;
    if (i ===0) {
      tile = homeTile;
    }
    else
      tile = new MapTile(i);
    tile.position.y = y;
    mapTiles.addChild(tile);
    return tile;
  }, function (i, tile) {
    mapTiles.removeChild(tile);
  }, {
    chunkSize: mapTileSize,
    ahead: 1,
    behind: 1,
    bounds: [0, +Infinity]
  });

  this.generateLevels = new SlidingWindow(
      /*
    debug.profile("allocChunk", this.allocChunk.bind(this)),
    debug.profile("freeChunk", this.freeChunk.bind(this)),
    */
    this.allocChunk.bind(this),
    this.freeChunk.bind(this), {
      chunkSize: mapGenerator.chunkSize,
      ahead: 1,
      behind: 1,
      bounds: [1, +Infinity]
    });
}
Map.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Map.prototype.constructor = Map;

Map.prototype.setScores = function (scores) {
  this.homeTile.setScores(scores);
};

Map.prototype.watchWindow = function (win) {
  this._win = win;
};

Map.prototype.update = function (t) {
  var win = this._win;

  if (win) {
    this.generateMapTileWindow.move(win, t);
    this.generateLevels.move(win, t);
  }
};

/*
Map.prototype.isRoad = function (y) {
  var chunk = this.generateLevels.getChunkForX(this.generateLevels.chunkSize-y);
  if (chunk) {
    var roadAreas = chunk.roadAreas;
    var length = roadAreas.length;
    for (var i=0; i<length; ++i) {
      var area = roadAreas[i];
      if (area[0] <= y && y <= area[1])
        return true;
    }
  }
  return false;
};
*/

Map.prototype.freeChunk = function (i, chunk) {
  chunk.destroy();
};

Map.prototype.allocChunk = function (i, t) {
  var random = seedrandom(this.seed+"-"+i);

  var chunk = mapGenerator.generate(i, t, random);
  var allSprites = [];

  var y = -i * mapGenerator.chunkSize;

  // var roadAreas = [];

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
    var pos = [ road.leftToRight ? -100 : conf.WIDTH+100, y+road.y ];
    var ang = road.leftToRight ? 0 : Math.PI;
    var spawn = function (i, random) { return new Car(random); };
    var spawner = new Spawner({
      seed: y+road.y,
      pos: pos,
      spawn: spawn,
      ang: ang,
      speed: road.speed,
      vel: road.vel,
      seq: road.seq,
      livingBound: { x: -100, y: y+road.y, height: 100, width: conf.WIDTH+200 },
      applyRotation: false // FIXME
    });
    spawner.init(t);
    this.cars.addChild(track(spawner));

    var roadSprite = new PIXI.Sprite(roadTexture);
    roadSprite.position.set(0, y+road.y);
    roads.addChild(roadSprite);
    if (road.last) {
      roadSprite = new PIXI.Sprite(roadOutTexture);
      roadSprite.position.set(0, y+road.y - 20);
      roads.addChild(roadSprite);
    }
    if (road.first) {
      roadSprite = new PIXI.Sprite(roadInTexture);
      roadSprite.position.set(0, y+road.y + 10);
      roads.addChild(roadSprite);
    }
    if (!road.last) {
      var roadSeparator = new PIXI.Sprite(roadSeparatorTexture);
      roadSeparator.position.set(- ~~(100*Math.random()), y+road.y - 8);
      roadsPaint.addChild(roadSeparator);
    }

    // roadAreas.push([ road.y, road.y + 70 ]);
  }, this);

  // Create snowballs spawners

  (chunk.snowballs||[]).forEach(function (item) {
    var pos = [item.pos[0], item.pos[1]+y];
    var scale = item.scale;
    item.seed = "" + pos;
    item.pos = pos;
    item.spawn = function (i, random) {
      return new Snowball(scale(i, random));
    };
    item.front = 10;
    delete item.scale;
    var spawner = new Spawner(item);
    spawner.init(t);
    var sprite = new PIXI.Sprite(snowSpawnerTexture);
    sprite.pivot.set(40, 40);
    sprite.scale.set(0.5, 0.5);
    sprite.position.set.apply(sprite.position, pos);
    this.spawners.addChild(sprite);
    this.particles.addChild(spawner);
  }, this);

  // Create fireballs spawners

  (chunk.fireballs||[]).forEach(function (item) {
    var pos = [item.pos[0], item.pos[1]+y];
    var scale = item.scale;
    item.seed = "" + pos;
    item.pos = pos;
    item.spawn = function (i, random) {
      return new Fireball(scale(i, random));
    };
    item.front = 10;
    delete item.scale;
    var spawner = new Spawner(item);
    spawner.init(t);
    var sprite = new PIXI.Sprite(fireSpawnerTexture);
    sprite.pivot.set(40, 40);
    sprite.scale.set(0.5, 0.5);
    sprite.position.set.apply(sprite.position, pos);
    this.spawners.addChild(sprite);
    this.particles.addChild(spawner);
  }, this);

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
    // roadAreas: roadAreas,
    destroy: function () {
      allSprites.forEach(function (sprite) {
        sprite.parent.removeChild(sprite);
      });
      allSprites = null;
    }
  };
};


module.exports = Map;
