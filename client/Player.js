var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var mix = require("./utils/mix");

var Groups = require("./Groups");
var velUpdate = require("./behavior/velUpdate");
var audio = require("./audio");
var conf = require("./conf");

var Footprints = require("./Footprints");

var playerTexture = PIXI.Texture.fromImage("./img/player.png");
var playerWalkTextures = [
  PIXI.Texture.fromImage("./img/player1.png"),
  playerTexture,
  PIXI.Texture.fromImage("./img/player2.png")
];
function Player (name, footprints) {
  this.name = name;
  PIXI.Sprite.call(this, playerTexture);
  this.life = 201;
  this.maxLife = 999;
  this.meltingSpeed = 0.0025;
  this.moveSpeed = conf.playerMoveSpeed;
  this.maxMoveBack = 120;
  this.dead = false;
  this.controls = null; // Set me later
  this.vel = [0,0];

  this.position.x = conf.WIDTH / 2;
  this.position.y = conf.HEIGHT - 50;
  this.maxProgress = conf.HEIGHT - this.maxMoveBack - 25;
  // this.maxSafeProgress = this.maxProgress;

  // this.safe = true;

  this._m = 0;
  this.pivot.set(80, 80);

  if (footprints)
    footprints.addChild(this.footprints = new Footprints());

  this._bound = {
    x:0,y:0,w:0,h:0,
    group: Groups.PLAYER,
    obj: this
  };
}
Player.prototype = Object.create(PIXI.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.die = function () {
  this.dead = true;
};
Player.prototype.isDead = function () {
  return this.dead;
};
/*
Player.prototype.syncMap = function (map) {
  this.safe = !map.isRoad(this.y);
};
*/

Player.prototype.constraintX = function (x) {
  var halfw = this.width / 2;
  return Math.max(halfw, Math.min(x, conf.WIDTH-halfw));
};

Player.prototype.update = function (t, dt) {
  if (this.dead) return;

  if (this.controls.update)
    this.controls.update(t, dt);
  var cx = this.controls.x();
  var cy = this.controls.y();

  var initialX = this.position.x;
  var initialY = this.position.y;

  var startMovingT = this._m;

  // Handle controls
  if (cx || cy) {
    if (!startMovingT) {
      this._m = startMovingT = t;
    }
    var speed = this.moveSpeed * mix(0.5, 1, smoothstep(0, 200, t-startMovingT));

    if (cx && cy) speed /= 1.414; // in diagonal, you move sqrt(2) slower

    this.vel[0] = cx * speed;
    this.vel[1] = -cy * speed;
  }
  else {
    this._m = 0;
    this.setTexture(playerTexture);
    this.vel[0] = 0;
    this.vel[1] = 0;
  }

  velUpdate.call(this, t, dt);

  var x = this.x;
  var y = this.y;

  this.maxProgress = Math.min(this.maxProgress, y);
  if (this.maxProgress < 0) {
    this.life -= dt * this.meltingSpeed;
  }

  /*
  if (this.safe) {
    this.maxSafeProgress = this.maxProgress;
  }
  y = Math.min(y, this.maxSafeProgress + this.maxMoveBack);
  */

  var b = y;
  y = Math.min(y, this.maxProgress + this.maxMoveBack);
  if (b !== y) console.log(b, "->", y, this.name, this.maxProgress, this.maxMoveBack);

  var scale = 0.6 + this.life / 150;
  var w = this.width  = 40 * scale;
  var h = this.height = 40 * scale;

  if (cy < 0) this.rotation = Math.PI;
  else if (cy > 0) this.rotation = 0;
  else if (cx > 0) this.rotation = Math.PI/2;
  else if (cx < 0) this.rotation = -Math.PI/2;

  x = this.constraintX(x);

  if ((cx || cy) && (x !== initialX || y !== initialY)) {
    this.setTexture(playerWalkTextures[~~(t / 150) % playerWalkTextures.length]);
    if (this.footprints && (!this._lastFoot||t-this._lastFoot>30) && Math.random() < 0.7) {
      this.footprints.walk(this.position, this.width / 2);
    }
  }

  this.x = x;
  this.y = y;

  this._bound.x = x - this.pivot.x * this.scale.x + w * 0.25;
  this._bound.y = y - this.pivot.y * this.scale.y + h * 0.2;
  this._bound.w = w * 0.5;
  this._bound.h = h * 0.6;
};
Player.prototype.toQuadTreeObject = function () {
  return this._bound;
};
Player.prototype.knock = function (x, y) {
  this.x = this.constraintX(this.x + x);
  this.y += y;
};
Player.prototype.onProjectile = function (p) {
  var knock = 100 * p.width / this.width;
  this.knock(
    knock * p.vel[0],
    knock * p.vel[1]);
};
Player.prototype.onSnowball = function (ball) {
  this.life = Math.min(this.life+ball.playerLifeValue(), this.maxLife);
  this.onProjectile(ball);
};
Player.prototype.onFireball = function (ball) {
  this.life += ball.playerLifeValue();
  this.onProjectile(ball);
};
Player.prototype.onCarHit = function (car) {
  audio.play("carHit", null, 1.0);
  this.life -= 100;
  var knock = 8000 / this.width;
  this.knock(knock * car.vel[0], 0);
};
Player.prototype.getScore = function () {
 return {
   player: this.name,
   x: ~~this.x,
   score: Player.getPlayerScore(this)
 };
};

Player.getPlayerScore = function (player) {
  return ~~Math.max(0, -player.y);
};

Player.scoreToY = function (score) {
  return -score;
};

module.exports = Player;
