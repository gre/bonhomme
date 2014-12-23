var PIXI = require("pixi.js");
var smoothstep = require("smoothstep");
var mix = require("./utils/mix");

var spriteCollides = require("./utils/spriteCollides");
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
  this.maxLife = 500;
  this.meltingSpeed = 0.0025;
  this.moveSpeed = 0.25;
  this.dead = false;
  this.controls = null; // Set me later
  this.maxProgress = 9999;

  this.position.x = conf.WIDTH / 2;
  this.position.y = conf.HEIGHT - 30;
  this.maxProgress = conf.HEIGHT - 120;

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
Player.prototype.update = function (t, dt) {
  if (this.dead) return;
  if (this.controls.update) {
    this.controls.update(t, dt);
  }
  var x = this.controls.x();
  var y = this.controls.y();
  var startMovingT = this._m;
  var speed = 0;

  if (x || y) {
    if (!startMovingT) {
      this._m = startMovingT = t;
    }
    speed = this.moveSpeed * mix(0.5, 1, smoothstep(0, 200, t-startMovingT));

    if (x && y) speed /= 1.414; // in diagonal, you move sqrt(2) slower

    this.setTexture(playerWalkTextures[~~(t / 150) % playerWalkTextures.length]);

    if (this.footprints && (!this._lastFoot||t-this._lastFoot>30) && Math.random() < 0.7) {
      this.footprints.walk(this.position, this.width / 2);
    }
  }
  else {
    this._m = 0;
    this.setTexture(playerTexture);
  }

  this.position.x += x * dt * speed;
  this.position.y -= y * dt * speed;

  this.maxProgress = Math.min(this.maxProgress, this.position.y);
  if (this.maxProgress < 0) {
    this.life -= dt * this.meltingSpeed;
  }
  this.position.x = Math.max(0, Math.min(this.position.x, conf.WIDTH));
  this.position.y = Math.min(this.position.y, this.maxProgress+120);

  var scale = 0.6 + this.life / 150;
  this.width  = 40 * scale;
  this.height = 40 * scale;

  if (y < 0) this.rotation = Math.PI;
  else if (y > 0) this.rotation = 0;
  else if (x > 0) this.rotation = Math.PI/2;
  else if (x < 0) this.rotation = -Math.PI/2;
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
  var knock = 2 * p.width;
  this.position.x += knock * p.vel[0];
  this.position.y += knock * p.vel[1];
};
Player.prototype.onSnowball = function (ball) {
  this.life = Math.min(this.life+10, this.maxLife);
  this.onProjectile(ball);
};
Player.prototype.onFireball = function (ball) {
  this.life -= 10;
  this.onProjectile(ball);
};
Player.prototype.onCarHit = function () {
  // this.life -= 100; // FIXME new gameplay to consider later
  this.life = 0;
  audio.play("carHit", null, 1.0);
};
Player.prototype.collidesCar = function (car) {
  return collideRectangle(this, car);
};
Player.prototype.collidesParticle = function (p) {
  return collideRectangle(this, p);
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
