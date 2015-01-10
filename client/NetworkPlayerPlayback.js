var NetworkControls = require("./NetworkControls");

var conf = require("./conf");
var PlayerMoveState = require("./PlayerMoveState");

function NetworkPlayerPlayback (player, delay) {
  var controls = new NetworkControls();
  player.controls = controls;
  this.player = player;
  this.controls = controls;
  this.delay = delay || conf.networkPlaybackDelay;
  this.timeout = this.delay + 100;
  this.evts = [];
  this.maxProgress = player.maxProgress;
}

NetworkPlayerPlayback.prototype = {
  destroy: function () {
    this.player.destroy();
    this.player = null;
    this.evts = null;
  },

  onMove: function (move) {
    var m = PlayerMoveState.decode(move);
    this.evts.push(m);
  },

  onDie: function (obj, time, game) {
    game.world.playerDied(this.player, false);
  },

  update: function (t) {
    for (var i=0; i<this.evts.length; ++i) {
      var e = this.evts[i];
      if (e.time < t-this.delay) {
        this.lastEvts = e.time;
        PlayerMoveState.applyToPlayer(this.player, e);

        // maxProgress should be reset because the interpolation might have polluted it.
        this.maxProgress = Math.min(this.player.y, this.maxProgress);
        this.player.maxProgress = this.maxProgress;

        this.evts.splice(i--, 1); // Remove the element out of the array and continue iterating
      }
    }
  }
};

module.exports = NetworkPlayerPlayback;
