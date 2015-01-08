var font = require("../font");
var BitmapText = require("../BitmapText");
var Player = require("../Player");

function Rank (game) {
  BitmapText.call(this, "", { font: font.style(20, true) });
  this.game = game;
  this.tint = 0xCC4400;
}
Rank.prototype = Object.create(BitmapText.prototype);
Rank.prototype.constructor = Rank;

Rank.prototype.update = function (t) {
  var game = this.game;
  var player = game.player;
  var playerLife = player.life;
  var s = Player.getPlayerScore(player);
  if (s > 0) {
    // Game has started
    var rank = game.getCurrentRank(s);
    if (rank) {
      this.alpha = playerLife <= 0 ? 1 : (Math.cos(t / 80) < 0 ? 1 : 0.2);
      this.text = "#" + rank;
    }
    else {
      this.alpha = 0;
    }
  }
  else {
    var best = game.getPlayerBestScore(player.name);
    this.text = best ? "#" + best.rank : "no rank";
  }
};

module.exports = Rank;
