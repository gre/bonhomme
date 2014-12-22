var NetworkControls = require("./NetworkControls");

var conf = require("./conf");

function NetworkPlayerPlayback (player, delay) {
  var controls = new NetworkControls();
  player.controls = controls;
  this.player = player;
  this.controls = controls;
  this.delay = delay || conf.networkPlaybackDelay;

  this.evts = [];
}

NetworkPlayerPlayback.prototype = {
  destroy: function () {
    this.player.parent.removeChild(this.player);
  },

  handle_move: function (move, time) {
    this.evts.push([ time, move ]);
  },
  
  onMessage: function (typ, o, time) {
    var handler = this["handle_"+typ];
    if (handler) {
      handler.call(this, o, time);
    }
  },

  update: function (t, dt) {
    for (var i=0; i<this.evts.length; ++i) {
      var e = this.evts[i];
      if (e[0] < t-this.delay) {
        var move = e[1];
        console.log(move);
        this.player.life = move.life;
        this.player.position.set(move.pos.x, move.pos.y);
        this.controls.setState(move.controls);

        this.evts.splice(i--, 1); // Remove the element out of the array and continue iterating
      }
    }
  }
};

module.exports = NetworkPlayerPlayback;
