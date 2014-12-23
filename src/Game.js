var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");

var dist = require("./utils/dist");
var mix = require("./utils/mix");

var audio = require("./audio");
var conf = require("./conf");
var font = require("./font");

var World = require("./World");
var Map = require("./Map");
var DeadCarrot = require("./DeadCarrot");
var Player = require("./Player");
var KeyboardControls = require("./KeyboardControls");
var SpawnerCollection = require("./SpawnerCollection");

var findChildrenCollide = require("./behavior/findChildrenCollide");
var updateChildren = require("./behavior/updateChildren");
var velUpdate = require("./behavior/velUpdate");

function Game (seed, controls, playername) {
  PIXI.Stage.call(this);
  PIXI.EventTarget.mixin(this);

  var world = new World();
  var cars = new SpawnerCollection();
  var particles = new SpawnerCollection();
  var spawners = new PIXI.DisplayObjectContainer();
  var map = new Map(seed, cars, particles, spawners);
  var deadCarrots = new PIXI.DisplayObjectContainer();
  var footprints = new PIXI.DisplayObjectContainer();
  var player = new Player(playername, footprints);
  player.controls = controls;
  var players = new PIXI.DisplayObjectContainer();
  var names = new PIXI.DisplayObjectContainer();
  var ui = new PIXI.DisplayObjectContainer();
  var score = new PIXI.Text("", { font: 'bold 20px '+font.name, fill: '#88B' });
  score.position.x = 10;
  score.position.y = 10;
  var life = new PIXI.Text("", {
    font: 'normal 20px '+font.name
  });
  life.position.x = conf.WIDTH - 60;
  life.position.y = 10;

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
  this.score = score;
  this.life = life;
  this.controls = controls;

  // Game states
  this.audio1 = audio.loop("/audio/1.ogg");
};

Game.prototype = Object.create(PIXI.Stage.prototype);
Game.prototype.constructor = Game;

Game.prototype.destroy = function () {
  this.audio1.stop();
};

Game.prototype.update = function (t, dt) {
  var world = this.world;
  var player = this.player;
  var cars = this.cars;
  var particles = this.particles;
  var controls = this.controls;
  var map = this.map;

  var moving = controls.x() || controls.y();

  // general vars for this loop time
  var danger = 0;

  // Handle cars and collision with particles
  var carNearby = 0;
  cars.children.forEach(function (spawner) {
    spawner.children.forEach(function (car) {
      var particle = particles.collides(car);
      if (particle) {
        particle.explodeInWorld(world);
        particle.parent.removeChild(particle);
      }
      var d = dist(car, player);
      danger += Math.pow(smoothstep(300, 50, d), 2);
      if (!car.neverSaw && d < 220) {
        car.neverSaw = 1;
        carNearby ++;
      }
    });
  });
  if (carNearby) {
    audio.play("car");
  }

  var angry = 0;

  if (!player.dead) {
    var car = cars.collides(player);
    if (car) {
      world.carHitPlayerExplode(car, player);
      player.onCarHit(car);
    }
    var particle = particles.collides(player);
    if (particle) {
      particle.explodeInWorld(world);
      particle.hitPlayer(player);
      particle.parent.removeChild(particle);
      angry ++;
    }
  }

  angry = Math.max(0, angry - dt * 0.001);

  if (player.dead) {
    this.audio1.setVolume(0);
  }
  else {
    this.audio1.setVolume( moving ? 0.2 + Math.min(0.8, angry + danger / 4) : 0 );
  }

  var s = Player.getPlayerScore(player);
  if (s > 0) {
    this.score.setText("" + s);
    if (player.life > 0) {
      this.life.setText("" + ~~(player.life) + "%");
      this.life.style.fill = player.life < 20 ? '#F00' : (player.life < 50 ? '#F90' : (player.life < 100 ? '#999' : '#6C6'));
    }
    else {
      this.life.setText("");
    }
  }

  if (!player.dead && player.life <= 0) {
    player.dead = 1;
    world.playerDied(player);
    world.removeChild(player);
    this.emit("GameOver");
  }

  world.focusOn(player);
  audio.micOn(player);

  var win = world.getWindow();
  this.footprints.children.forEach(function (footprints) {
    footprints.watchWindow(win);
  });
  map.watchWindow(win);

  world.update(t, dt);
};

Game.prototype.createDeadCarrot = function (score) {
  if (score.opacity > 0) {
    var deadCarrot = new DeadCarrot(score, false, score.player === this.player.name);
    this.deadCarrots.addChild(deadCarrot);
  }
}

module.exports = Game;
