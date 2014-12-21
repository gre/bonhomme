var PIXI = require("pixi.js");
var Q = require("q");
var requestAnimFrame = require("raf");
var smoothstep = require("smoothstep");
var seedrandom = require("seedrandom");
var io = require("socket.io-client");

require("socket-ntp/client/ntp")
var ntp = window.ntp;

var audio = require("./audio");
var network = require("./network");
var conf = require("./conf");
var atlas = require("./atlas");

var Game = require("./Game");
var Player = require("./Player");
var KeyboardControls = require("./KeyboardControls");

// FIXME remove the spaghettis!


var EMBED = location.hash === "#embed";

var socket = io();

var socketConnectedD = Q.defer();
var socketConnected = socketConnectedD.promise;

socket.on('connect', socketConnectedD.resolve);

ntp.init(socket);

var syncTime = socketConnected.delay(1000);
var latestOffset = 0;

var imagesLoaded = atlas();

var stage, renderer;

createDom();

Q.all([
  imagesLoaded,
  syncTime
]).then(start).done();


// var audio2 = loopAudio("/audio/2.ogg");


function createDom() {

  stage = new PIXI.Stage(0xFFFFFF);
  renderer = PIXI.autoDetectRenderer(conf.WIDTH, conf.HEIGHT, { resolution: window.devicePixelRatio });
  renderer.view.style.width = conf.WIDTH+"px";
  renderer.view.style.height = conf.HEIGHT+"px";

  if (!EMBED)
    renderer.view.style.border = "6px ridge #88B";
  document.body.style.padding = "0";
  document.body.style.margin = "0";
  var wrapper = document.createElement("div");
  wrapper.style.margin = "0 auto";
  wrapper.style.width = conf.WIDTH+"px";
  document.body.appendChild(wrapper);
  wrapper.appendChild(renderer.view);

  if (!EMBED) {
    var link = document.createElement("a");
    link.href = "http://ludumdare.com/compo/ludum-dare-31/?action=preview&uid=18803";
    link.innerHTML = "LudumDare 31 entry";
    wrapper.appendChild(link);
  }

  return stage;
}

setTimeout(Player.getPlayerName, 100);

function getPlayerName () {
  var name = window.localStorage.player || prompt("What's your name? (3 to 10 alphanum characters)");
  if (!name) return null;
  if (! /^[a-zA-Z0-9]{3,10}$/.exec(name)) return getPlayerName();
  return window.localStorage.player = name;
}

function now () {
  var off = ntp.offset();
  if (!isNaN(off))
    latestOffset = off;
  return Date.now() - latestOffset;
}

var currentGame;

function newGame (controls) {
  // This part is ugly...
  var seed = "grewebisawesome" + ~~(now() / (24 * 3600 * 1000));
  console.log("seed = "+seed);
  var game = new Game(seed, controls, getPlayerName());
  game.on("GameOver", function () {
    network.submitScore(game.player)
      .then(function () {
        network.refreshScores();
      })
      .delay(6000)
      .fin(function () {
        stage.removeChild(game);
        game.destroy();
        newGame(controls);
      })
      .done();
  });
  network.scores().then(function (scores) {
    scores.forEach(game.createDeadCarrot, game);
  }).done();
  stage.addChild(game);

  currentGame = game;
}


function start () {

  var controls = new KeyboardControls();
  newGame(controls);

  // move in Game?

  var lastLoopT;
  var lastAbsoluteTime = 0;

  function loop (loopT) {
    requestAnimFrame(loop);

    var t = Math.max(now(), lastAbsoluteTime); // ensure no backwards in synchronized time with current game.
    lastAbsoluteTime = t;

    if (!lastLoopT) lastLoopT = loopT;
    var dt = Math.min(100, loopT - lastLoopT); // The delta time is computed using the more precised loopT
    lastLoopT = loopT;

    currentGame.update(t, dt);

    renderer.render(stage);

  }

  requestAnimFrame(loop);
}

/*
socket.emit("move", player.position, player.width);

var playersByIds = {};

socket.on("playermove", function (move) {
  console.log("move", arguments);
  var p = playersByIds[move.id];
  if (!p) {
    var p = new OtherPlayer();
    p.position.x = -1000;
    playersByIds[move.id] = p;
    players.addChild(p);
  }
  p.height = p.width = move.width;
  p.position.set(move.pos.x, move.pos.y);
});

socket.on("playerquit", function () {
  var p = playersByIds[move.id];
  if (p) {
    players.removeChild(p);
    delete playersByIds[move.id];
  }
});

*/
