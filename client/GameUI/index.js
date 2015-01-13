var conf = require("../conf");
var Container = require("../pixi-extend/Container");

var Score = require("./Score");
var Rank = require("./Rank");
var Life = require("./Life");

function GameUI (game) {
  Container.call(this);

  this.game = game;

  this.life = new Life(game);
  this.life.position.set(conf.WIDTH-80, 10);
  this.addChild(this.life);

  this.rank = new Rank(game);
  this.rank.position.set(10, 40);
  this.addChild(this.rank);

  this.score = new Score(game);
  this.score.position.set(10, 10);
  this.addChild(this.score);
}

GameUI.prototype = Object.create(Container.prototype);
GameUI.prototype.constructor = GameUI;

module.exports = GameUI;
