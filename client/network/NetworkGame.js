var PIXI = require("pixi.js");

var OtherPlayer = require("../objects/OtherPlayer");
var NetworkGameScore = require("./NetworkGameScore");
var NetworkPlayer = require("./NetworkPlayer");
var NetworkPlayerPlayback = require("./NetworkPlayerPlayback");
var conf = require("../conf");
var Container = require("../pixi-extend/Container");
var EV = conf.events;

function NetworkGame (socket) {
  this.socket = socket;
  this.score = new NetworkGameScore(socket);
  this.playersByIds = {};
  this.playersData = {};
  this.players = new Container();
  this.names = new PIXI.DisplayObjectContainer();

  socket.on(EV.playermove, this.onPlayerMove.bind(this));
  socket.on(EV.playerdie, this.onPlayerDie.bind(this));
  socket.on(EV.playerenter, this.onPlayerEnter.bind(this));
  socket.on(EV.playerleave, this.onPlayerLeave.bind(this));
  socket.on(EV.players, this.onPlayers.bind(this));
  socket.on(EV.gameinfo, this.onGameInfo.bind(this));

  var self = this;
  this.env = {
    computeAlpha: function (pos) {
      return 1-self.game.positionObfuscation(pos);
    }
  };
  socket.emit(EV.ready, conf);
}

NetworkGame.prototype = {
  setGame: function (game) {
    this.score.setGame(game);
    this.game = game;
    game.players.addChild(this.players);
    game.names.addChild(this.names);
    if (this.player) {
      this.player.destroy();
    }
    this.player = new NetworkPlayer(game.player, this.socket);
    this.socket.emit(EV.newgame);
  },

  onGameInfo: function (info) {
    this.game.setMapName(info.mapname);
  },

  onPlayers: function (players) {
    for (var id in players) {
      this.onNewPlayerData(players[id], id);
    }
  },

  onPlayerDie: function (obj, id, time) {
    if (!(id in this.playersData)) return; // I still don't know this guy
    var p = this.playersByIds[id];
    if (p) {
      p.onDie(obj, time, this.game);
      p.destroy();
      delete this.playersByIds[id];
    }
  },
  
  onPlayerMove: function (obj, id) {
    if (!(id in this.playersData)) return; // I still don't know this guy
    var p = this.playersByIds[id];
    if (!p) {
      var data = this.playersData[id];
      var playerSprite = new OtherPlayer(data.name, this.names, 0.8, this.env);
      playerSprite.position.x = -1000;
      p = new NetworkPlayerPlayback(playerSprite);
      this.playersByIds[id] = p;
      this.players.addChild(playerSprite);
    }
    p.onMove(obj);
  },

  onPlayerEnter: function (p, id) {
    this.onNewPlayerData(p, id);
  },

  onPlayerLeave: function (id) {
    var p = this.playersByIds[id];
    if (p) {
      p.destroy();
      delete this.playersByIds[id];
    }
    delete this.playersData[id];
  },

  onNewPlayerData: function (p, id) {
    this.playersData[id] = p;
  },

  update: function (t, dt) {
    if (!this.game) return;
    this.player.update(t, dt);
    for (var id in this.playersByIds) {
      this.playersByIds[id].update(t, dt);
    }
  }

};

module.exports = NetworkGame;
