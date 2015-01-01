var NetworkControls = require("./NetworkControls");

var conf = require("./conf");

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

  handle_move: function (move, time) {
    this.evts.push([ time, move ]);
  },

  handle_ready: function (name) {
    this.player.name = name;
  },
  
  onMessage: function (typ, o, time) {
    var handler = this["handle_"+typ];
    if (handler) {
      handler.call(this, o, time);
    }
  },

  update: function (t) {
    for (var i=0; i<this.evts.length; ++i) {
      var e = this.evts[i];
      if (e[0] < t-this.delay) {
        this.lastEvts = e[0];
        var move = e[1];
        this.player.life = move.life;
        this.player.position.set(move.pos.x, move.pos.y);
        this.controls.setState(move.controls);

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
