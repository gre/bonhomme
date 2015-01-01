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

  onDie: function () {
  },

  /* // FIXME
  handle_ready: function (name) {
    this.player.name = name;
  },
  */
  
  update: function (t) {
    for (var i=0; i<this.evts.length; ++i) {
      var e = this.evts[i];
      if (e.time < t-this.delay) {
        this.lastEvts = e.time;
        PlayerMoveState.applyToPlayer(this.player, e);
        this.evts.splice(i--, 1); // Remove the element out of the array and continue iterating
      }
    }
    if (t > this.lastEvts + this.timeout) {
      // Workaround. Figure something else ...
      this.controls.setState({
        x: 0,
        y: 0
      });
    }
  }
};

module.exports = NetworkPlayerPlayback;
