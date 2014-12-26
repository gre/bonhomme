var conf = require("./conf");

function NetworkPlayer (player, socket, rate) {
  this.player = player;
  this.socket = socket;
  this.rate = rate || conf.networkSendRate;
  this._lastSubmit = 0;
  
  this.socket.emit("ready", { name: player.name });

  this.socket.emit("player", "newgame");
}

NetworkPlayer.prototype = {
  destroy: function () {
    this.player = null;
    this.socket = null;
  },
  update: function (t) {
    if (t-this._lastSubmit < this.rate) return;
    this._lastSubmit = t;
    
    var state = this.player.getState();
    state.controls = {
      x: this.player.controls.x(),
      y: this.player.controls.y()
    };
    this.socket.emit("player", "move", state);
  }
};

module.exports = NetworkPlayer;
