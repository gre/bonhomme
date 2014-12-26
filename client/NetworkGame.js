var PIXI = require("pixi.js");

var updateChildren = require("./behavior/updateChildren");

var OtherPlayer = require("./OtherPlayer");
var NetworkGameScore = require("./NetworkGameScore");
var NetworkPlayer = require("./NetworkPlayer");
var NetworkPlayerPlayback = require("./NetworkPlayerPlayback");

function NetworkGame (socket) {
  this.socket = socket;
  this.score = new NetworkGameScore(socket);
  this.playersByIds = {};
  this.playersData = {};
  this.players = new PIXI.DisplayObjectContainer();
  this.names = new PIXI.DisplayObjectContainer();
  this.players.update = updateChildren;

  socket.on("playerevent", this.onPlayerEvent.bind(this));
  socket.on("playerenter", this.onPlayerEnter.bind(this));
  socket.on("playerleave", this.onPlayerLeave.bind(this));
  socket.on("players", this.onPlayers.bind(this));
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
  },

  onPlayers: function (players) {
    for (var id in players) {
      this.onNewPlayerData(players[id], id);
    }
    console.log("players =", players);
  },

  onPlayerEvent: function (ev, obj, id, time) {
    if (!(id in this.playersData)) return; // I still don't know this guy
    var p = this.playersByIds[id];
    if (p && ev === "newgame") {
      p.destroy();
      delete this.playersByIds[id];
      p = null;
    }
    if (!p) {
      var data = this.playersData[id];
      var playerSprite = new OtherPlayer(data.name, this.names);
      playerSprite.position.x = -1000;
      p = new NetworkPlayerPlayback(playerSprite);
      this.playersByIds[id] = p;
      this.players.addChild(playerSprite);
    }
    p.onMessage(ev, obj, time);
  },

  onPlayerEnter: function (p, id) {
    this.onNewPlayerData(p, id);
    console.log("new player =", p);
  },

  onPlayerLeave: function (id) {
    var p = this.playersByIds[id];
    if (p) {
      p.destroy();
    }
    delete this.playersByIds[id];
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
