var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var _ = require("lodash");
var QuadTree = require('simple-quadtree');
var Groups = require("./Groups");

var dist = require("./utils/dist");

var audio = require("./audio");
var conf = require("./conf");
var font = require("./font");
var BitmapText = require("./BitmapText");

var World = require("./World");
var GameMap = require("./Map");
var DeadCarrot = require("./DeadCarrot");
var Player = require("./Player");
var SpawnerCollection = require("./SpawnerCollection");

var updateChildren = require("./behavior/updateChildren");

var GENERATOR = "v2";

function Game (seed, controls, playername) {
  PIXI.Stage.call(this, 0xFFFFFF);
  PIXI.EventTarget.mixin(this);

  // TODO move containers to World
  var cars = new SpawnerCollection();
  var particles = new SpawnerCollection();
  var spawners = new PIXI.DisplayObjectContainer();
  var map = new GameMap(seed, cars, particles, spawners, GENERATOR);
  var deadCarrots = new PIXI.DisplayObjectContainer();
  deadCarrots.update = updateChildren;
  var footprints = new PIXI.DisplayObjectContainer();
  var player = new Player(playername, footprints);
  player.controls = controls;
  var players = new PIXI.DisplayObjectContainer();
  var names = new PIXI.DisplayObjectContainer();
  var ui = new PIXI.DisplayObjectContainer();
  var score = new BitmapText("", { font: font.style(20, true) });
  score.tint = 0x8888BB;
  score.position.x = 10;
  score.position.y = 10;
  var rank = new BitmapText("", { font: font.style(20, true) });
  rank.tint = 0xBB8888;
  rank.position.x = 10;
  rank.position.y = 40;
  var life = new BitmapText("", { font: font.style(20) });
  life.position.x = conf.WIDTH - 60;
  life.position.y = 10;

  var world = new World(particles);
  world.addChild(map);
  world.addChild(deadCarrots);
  world.addChild(footprints);
  world.addChild(spawners);
  world.addChild(players);
  world.addChild(names);
  world.addChild(player);
  world.addChild(cars);
  world.addChild(particles);

  ui.addChild(score);
  ui.addChild(rank);
  ui.addChild(life);

  this.addChild(world);
  this.addChild(ui);

  this.world = world;
  this.map = map;
  this.cars = cars;
  this.particles = particles;
  this.spawners = spawners;
  this.deadCarrots = deadCarrots;
  this.footprints = footprints;
  this.player = player;
  this.players = players;
  this.names = names;
  this.players.update = updateChildren;
  this.ui = ui;
  this.rank = rank;
  this.score = score;
  this.life = life;
  this.controls = controls;

  // Game states
  this.audio1 = audio.loop("/audio/1.ogg");

  this.playerGhost = true;

  audio.play("start");
}

Game.prototype = Object.create(PIXI.Stage.prototype);
Game.prototype.constructor = Game;

Game.prototype.destroy = function () {
  this.audio1.stop();
  for (var k in this) {
    this[k] = null;
  }
};

Game.prototype.handleCarCollides = function (data) {
  if (data.group & Groups.PARTICLE)
    data.obj.explodeInWorld(this.world);
};

Game.prototype.update = function (t, dt) {
  var i, j, spawner;
  var world = this.world;
  var player = this.player;
  var controls = this.controls;
  var map = this.map;

  var moving = controls.x() || controls.y();

  // general vars for this loop time
  var danger = 0;

  var quadtree = QuadTree(0, 0, conf.WIDTH, 100); // TODO ask map what is the current allocation window
  for (i=0; i<this.particles.children.length; ++i) {
    spawner = this.particles.children[i];
    for (j=0; j<spawner.children.length; ++j) {
      var particle = spawner.children[j];
      quadtree.put(particle.toQuadTreeObject());
    }
  }

  function handleCarCollides (data) {
    if (data.group & Groups.PARTICLE)
      data.obj.explodeInWorld(world);
  }

  // Handle cars and collision with particles
  for (i=0; i<this.cars.children.length; ++i) {
    spawner = this.cars.children[i];
    for (j=0; j<spawner.children.length; ++j) {
      var car = spawner.children[j];
      var carQuad = car.toQuadTreeObject();
      quadtree.get(carQuad, handleCarCollides);
      quadtree.put(carQuad);
      var d = dist(car, player);
      danger += Math.pow(smoothstep(300, 50, d), 2);
      if (!car.neverSaw && d < 300) {
        car.neverSaw = 1;
        audio.play("car", car);
      }
    }
  }

  var angry = 0;

  var playerGhost = this.playerGhost;

  function playerUpdate (player, isMyself) {
    if (!player.isDead()) {
      if (isMyself || !playerGhost) {
        var playerQuad = player.toQuadTreeObject();
        quadtree.get(playerQuad, function (data) {
          if (data.group & Groups.CAR) {
            var car = data.obj;
            player.onCarHit(car);
            world.carHitPlayerExplode(car, player);
          }
          else if (data.group & Groups.PARTICLE) {
            var particle = data.obj;
            particle.explodeInWorld(world);
            particle.hitPlayer(player);
            if (isMyself)
              angry ++;
          }
        });
      }
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

  var players = this.players.children[0].children;
  for (i=0; i<players.length; ++i) {
    playerUpdate.call(this, players[i], false);
  }
  playerUpdate.call(this, player, true);

  angry = Math.max(0, angry - dt * 0.001);

  if (player.dead) {
    this.audio1.setVolume(0);
  }
  else {
    this.audio1.setVolume( moving ? 0.2 + Math.min(0.8, angry + danger / 4) : 0 );
  }

  var s = Player.getPlayerScore(player);
  if (s > 0) {
    if (this.scores) {
      var rank = 0;
      for (var length = this.scores.length; rank < length && s < this.scores[rank].score; ++rank);
      ++ rank;
      this.rank.text = "#" + rank;
    }
    else {
      this.rank.text = "";
    }
    this.score.text = "" + s;
    if (player.life > 0) {
      this.life.tint = player.life < 20 ? 0xFF0000 : (player.life < 50 ? 0xFF9900 : (player.life < 100 ? 0x999999 : 0x66CC66 ));
      this.life.text = "" + ~~(player.life) + "%";
    }
    else {
      this.life.text = "";
    }
  }

  world.focusOn(player);
  audio.micOn(player);

  var win = world.getWindow();
  var footprints = this.footprints.children;
  for (i=0; i<footprints.length; ++i) {
    footprints[i].watchWindow(win);
  }
  map.watchWindow(win);

  world.update(t, dt);
  audio.update(t, dt);
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

Game.prototype.setScores = function (scores, animated) {
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
  news.forEach(function (score) {
    this.createDeadCarrot(score, animated);
  }.bind(this));

  this.scores = scores;

  var name = this.player.name;
  var bestScoreIndex = _.findIndex(scores, function (s) {
    return s.player === name;
  });
  var bestScore = scores[bestScoreIndex];

  if (bestScore) {
    this.score.text = ("" + bestScore.score);
    this.rank.text = ("#"+(bestScoreIndex+1));
  }
  else {
    this.score.text = ("no score");
    this.rank.text = ("no rank");
  }
};

module.exports = Game;
