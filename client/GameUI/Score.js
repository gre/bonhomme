var font = require("../font");
var BitmapText = require("../pixi-extend/BitmapText");
var Player = require("../objects/Player");

function Score (game) {
  BitmapText.call(this, "", { font: font.style(20, true) });
  this.game = game;
  this.tint = 0x8888BB;
}
Score.prototype = Object.create(BitmapText.prototype);
Score.prototype.constructor = Score;

Score.prototype.update = function () {
  var game = this.game;
  var player = game.player;
  var s = Player.getPlayerScore(player);
  if (s > 0) {
    // Game has started
    this.text = "" + s;
  }
  else {
    var best = game.getPlayerBestScore(player.name);
    this.text = best ? "" + best.score : "no score";
  }
};

module.exports = Score;

