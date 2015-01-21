var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var _ = require("lodash");
// var QuadTree = require('simple-quadtree');
var boxIntersect = require('box-intersect');

var dist = require("../utils/dist");
var audio = require("../audio");
var UI = require("../GameUI");

var World = require("../objects/World");
var GameMap = require("../objects/Map");
var DeadCarrot = require("../objects/DeadCarrot");
var Player = require("../objects/Player");
var Container = require("../pixi-extend/Container");


/**
 * 2 important things to refactor:
 * - move a lot of code into World
 * - move the UI part into "ui" components
 */
function Game (seed, controls, playername) {
  PIXI.Stage.call(this, 0xFFFFFF);
  PIXI.EventTarget.mixin(this);

  // TODO move containers to World
  var cars = new Container();
  var snowballs = new Container();
  var fireballs = new Container();
  var explosions = new Container();
  var explosionsPlayer = new Container();
  var spawners = new Container();
  var objects = new Container();
  var map = new GameMap(seed, cars, snowballs, fireballs, spawners, objects);
  var deadCarrots = new Container();

  var footprints = new PIXI.DisplayObjectContainer();
  var player = new Player(playername, footprints);
  player.controls = controls;

  var players = new Container();
  var names = new PIXI.DisplayObjectContainer();

  var ui = new UI(this);
  this.ui = ui;

  var world = new World(snowballs, fireballs, explosions, explosionsPlayer);
  world.addChild(map);
  world.addChild(footprints);
  world.addChild(deadCarrots);
  world.addChild(players);
  world.addChild(names);
  world.addChild(player);
  world.addChild(cars);
  world.addChild(snowballs);
  world.addChild(fireballs);
  world.addChild(spawners);
  world.addChild(objects);
  world.addChild(explosions);
  world.addChild(explosionsPlayer);

  this.addChild(world);
  this.addChild(ui);

  this.world = world;
  this.map = map;
  this.cars = cars;
  this.snowballs = snowballs;
  this.fireballs = fireballs;
  this.spawners = spawners;
  this.deadCarrots = deadCarrots;
  this.footprints = footprints;
  this.player = player;
  this.players = players;
  this.names = names;
  this.controls = controls;

  // Game states
  this.audio1 = audio.loop("/audio/1.ogg");

  audio.play("start");
}

Game.prototype = Object.create(PIXI.Stage.prototype);
Game.prototype.constructor = Game;

// FIXME: most of the logic should be moved into World
Game.prototype.update = function (t, dt) {
  var i;
  var world = this.world;
  var player = this.player;
  var controls = this.controls;
  var map = this.map;
  var fireballs = this.fireballs.children;
  var snowballs = this.snowballs.children;
  var cars = this.cars.children;
  var footprints = this.footprints.children;

  var moving = controls.x() || controls.y();

  // States resulting of collision system.
  var carHitParticules = [];
  var playerCarsHit = [];
  var playerParticlesHit = [];

  // Collision checks

  var fireballsBoxes = [];
  var snowballsBoxes = [];
  var carsBoxes = [];
  for (i=0; i<fireballs.length; ++i) {
    fireballsBoxes.push(fireballs[i].box);
  }
  for (i=0; i<snowballs.length; ++i) {
    snowballsBoxes.push(snowballs[i].box);
  }
  for (i=0; i<cars.length; ++i) {
    carsBoxes.push(cars[i].box);
  }
  boxIntersect(carsBoxes, snowballsBoxes, function (i, j) {
    carHitParticules.push(snowballs[j]);
  });
  boxIntersect(carsBoxes, fireballsBoxes, function (i, j) {
    carHitParticules.push(fireballs[j]);
  });

  if (!player.isDead()) {
    var playerBox = [ player.box ];
    boxIntersect(carsBoxes, playerBox, function (i) {
      playerCarsHit.push(cars[i]);
    });
    boxIntersect(snowballsBoxes, playerBox, function (i) {
      playerParticlesHit.push(snowballs[i]);
    });
    boxIntersect(fireballsBoxes, playerBox, function (i) {
      playerParticlesHit.push(fireballs[i]);
    });
  }


  // Now handle the collisions

  var angry = 0;

  for (i = 0; i<carHitParticules.length; ++i) {
    carHitParticules[i].explodeInWorld(world);
  }
  for (i = 0; i<playerCarsHit.length; ++i) {
    var carHit = playerCarsHit[i];
    player.onCarHit(carHit);
    world.carHitPlayerExplode(carHit, player);
  }
  for (i = 0; i<playerParticlesHit.length; ++i) {
    var particle = playerParticlesHit[i];
    particle.explodeInWorld(world);
    particle.hitPlayer(player);
    angry ++;
  }


  // Camera on player

  world.focusOn(player);
  var win = world.getWindow();
  for (i=0; i<footprints.length; ++i) {
    footprints[i].watchWindow(win);
  }
  map.watchWindow(win);

  // Audio System

  angry = Math.max(0, angry - dt * 0.001);
  var danger = 0;
  for (i=0; i<cars.length; ++i) {
    var car = cars[i];
    var d = dist(car, player);
    danger += Math.pow(smoothstep(300, 50, d), 2);
    if (!car.neverSaw && d < 300) {
      car.neverSaw = 1;
      audio.play("car", car);
    }
  }
  if (player.dead) {
    this.audio1.setVolume(0);
  }
  else {
    this.audio1.setVolume( moving ? 0.2 + Math.min(0.8, angry + danger / 4) : 0 );
  }
  audio.micOn(player);
  audio.update(t, dt);


  // Run player life related game updates on all players

  function playerUpdate (player, isMyself) {
    if (!player.isDead()) {
      if (player.life <= 0) {
        player.die();
        world.playerDied(player, isMyself);
        if (isMyself) {
          world.removeChild(player);
          this.emit("GameOver", player.getScore());
        }
      }
    }
  }
  if (this.players.children.length) {
    var players = this.players.children[0].children;
    for (i=0; i<players.length; ++i) {
      playerUpdate.call(this, players[i], false);
    }
  }
  playerUpdate.call(this, player, true);

  // Delegate all the game update
  
  world.update(t, dt);
  this.ui.update(t, dt);
};

Game.prototype.destroy = function () {
  try {
    this.audio1.stop();
  }
  catch (e) {
    // Investigate later why this breaks on Mobile Safari
    console.error(e);
  }
  for (var k in this) {
    this[k] = null;
  }
};

Game.prototype.setMapName = function (name) {
  this.map.setName(name);
};

Game.prototype.positionObfuscation = function (pos) {
  var w = this.player.width;
  return 0.9 * smoothstep(40+w, w/2, dist(this.player.position, pos));
};

Game.prototype.createDeadCarrot = function (score, animated) {
  if (score.opacity > 0) {
    var deadCarrot = new DeadCarrot(score, animated, score.player === this.player.name);
    this.deadCarrots.addChild(deadCarrot);
  }
};

Game.prototype.getCurrentRank = function (s) {
  if (!this.scores) return 0;
  var rank = 0;
  for (var length = this.scores.length; rank < length && s < this.scores[rank].score; ++rank);
  return rank + 1;
};

Game.prototype.getPlayerBestScore = function (name) {
  if (!this.scores) return null;
  return this.bestScorePerPlayer[name] || null;
};

Game.prototype.setScores = function (scores, animated) {
  var i;
  var previous = this.scores||[];
  var news = _.filter(scores, function (a) {
    return !_.any(previous, function (b) {
      return a.player === b.player && a.x === b.x && a.score === b.score;
    });
  });

  scores = [].concat(scores);
  scores.sort(function (a, b) {
    return b.score - a.score;
  });
  this.map.setScores(scores);
  for (i=0; i<news.length; ++i) {
    this.createDeadCarrot(news[i], animated);
  }
  
  var bestScorePerPlayer = {};
  for (i=0; i<scores.length; ++i) {
    var score = scores[i];
    if (!(score.player in bestScorePerPlayer)) {
      bestScorePerPlayer[score.player] = {
        rank: i+1,
        score: score.score
      };
    }
  }

  this.scores = scores;
  this.bestScorePerPlayer = bestScorePerPlayer;
};

module.exports = Game;
