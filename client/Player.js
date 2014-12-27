var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var mix = require("./utils/mix");

var spriteCollides = require("./utils/spriteCollides");
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
  this.life = 100;
  this.maxLife = 1000;
  this.meltingSpeed = 0.0025;
  this.moveSpeed = 0.25;
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
}
Player.prototype = Object.create(PIXI.Sprite.prototype);
Player.prototype.constructor = Player;
Player.prototype.getState = function () {
  return {
    life: this.life,
    pos: this.position
  };
};
/*
Player.prototype.syncMap = function (map) {
  this.safe = !map.isRoad(this.y);
};
*/
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

  var x = this.position.x;
  var y = this.position.y;

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

  y = Math.min(y, this.maxProgress + this.maxMoveBack);

  var scale = 0.6 + this.life / 150;
  this.width  = 40 * scale;
  this.height = 40 * scale;

  if (cy < 0) this.rotation = Math.PI;
  else if (cy > 0) this.rotation = 0;
  else if (cx > 0) this.rotation = Math.PI/2;
  else if (cx < 0) this.rotation = -Math.PI/2;

  var halfw = this.width / 2;
  x = Math.max(halfw, Math.min(x, conf.WIDTH-halfw));

  if ((cx || cy) && (x !== initialX || y !== initialY)) {
    this.setTexture(playerWalkTextures[~~(t / 150) % playerWalkTextures.length]);
    if (this.footprints && (!this._lastFoot||t-this._lastFoot>30) && Math.random() < 0.7) {
      this.footprints.walk(this.position, this.width / 2);
    }
  }

  this.position.x = x;
  this.position.y = y;
};
Player.prototype.hitBox = function () {
  return {
    x: this.x - this.pivot.x * this.scale.x + this.width * 0.25,
    y: this.y - this.pivot.y * this.scale.y + this.height * 0.2,
    width: this.width * 0.5,
    height: this.height * 0.6
  };
};
Player.prototype.onProjectile = function (p) {
  var knock = 100 * p.width / this.width;
  this.position.x += knock * p.vel[0];
  this.position.y += knock * p.vel[1];
};
Player.prototype.onSnowball = function (ball) {
  this.life = Math.min(this.life+ball.playerLifeValue(), this.maxLife);
  this.onProjectile(ball);
};
Player.prototype.onFireball = function (ball) {
  this.life += ball.playerLifeValue();
  this.onProjectile(ball);
};
Player.prototype.onCarHit = function () {
  this.life -= 100;
  // this.life = 0;
  audio.play("carHit", null, 1.0);
};
Player.prototype.collides = spriteCollides;
Player.prototype.getScore = function () {
 return {
   player: this.name,
   x: ~~this.position.x,
   score: Player.getPlayerScore(this)
 };
};

Player.getPlayerScore = function (player) {
  return ~~Math.max(0, -player.position.y);
};

Player.scoreToY = function (score) {
  return -score;
};

module.exports = Player;
