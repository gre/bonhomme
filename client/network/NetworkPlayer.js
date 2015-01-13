var conf = require("../conf");
var EV = conf.events;
var PlayerMoveState = require("./PlayerMoveState");

function NetworkPlayer (player, socket, rate) {
  this.player = player;
  this.socket = socket;
  this.rate = rate || conf.networkSendRate;
  this._lastSubmit = 0;
  
  this.socket.emit(EV.playerready, { name: player.name });
}

NetworkPlayer.prototype = {
  destroy: function () {
    this.player = null;
    this.socket = null;
  },
  update: function (t) {
    if (t-this._lastSubmit < this.rate) return;
    this._lastSubmit = t;
    if (this.player.dead) return;
    if (this.player.controls.paused()) return;
    var state = PlayerMoveState.encodeFromPlayer(this.player, t);
    this.socket.emit(EV.playermove, state);
  }
};

module.exports = NetworkPlayer;
