var PIXI = require("pixi.js");
var Q = require("q");
var requestAnimFrame = require("raf");
var io = require("socket.io-client");

require("socket-ntp/client/ntp");
var ntp = window.ntp;

var debug = require("./utils/debug");
var conf = require("./conf");
var atlas = require("./atlas");

var Game = require("./Game");
var NetworkGame = require("./NetworkGame");
var ResponsiveControls = require("./ResponsiveControls");

// FIXME remove the spaghettis!


var socket = io();

var socketConnectedD = Q.defer();
var socketConnected = socketConnectedD.promise;

var playerNameP = Q.delay(100).then(function getPlayerName () {
  var name = window.localStorage.player || window.prompt("What's your name? (3 to 10 alphanum characters)");
  if (!name) return null;
  if (! /^[a-zA-Z0-9]{3,10}$/.exec(name)) return getPlayerName();
  return (window.localStorage.player = name);
});

socket.on('connect', socketConnectedD.resolve);

ntp.init(socket);

var syncTime = socketConnected.delay(1000);
var latestOffset = 0;

var imagesLoaded = atlas();

var stage, renderer;

function createDom() {

  stage = new PIXI.Stage(0xFFFFFF);
  renderer = PIXI.autoDetectRenderer(conf.WIDTH, conf.HEIGHT, { resolution: window.devicePixelRatio });
  renderer.view.style.width = conf.WIDTH+"px";
  renderer.view.style.height = conf.HEIGHT+"px";

  document.body.style.background = "#000";
  document.body.style.padding = "0";
  document.body.style.margin = "0";
  var wrapper = document.createElement("div");
  wrapper.style.margin = "0 auto";
  wrapper.style.width = conf.WIDTH+"px";
  document.body.appendChild(wrapper);
  wrapper.appendChild(renderer.view);

  return stage;
}

function now () {
  var off = ntp.offset();
  if (!isNaN(off))
    latestOffset = off;
  return Date.now() - latestOffset;
}

var currentGame;
var currentNetwork;

currentNetwork = new NetworkGame(socket);

function newGame (controls, playerName) {
  // This part is ugly...
  var seed = "grewebisawesome" + ~~(now() / (24 * 3600 * 1000));
  console.log("seed = "+seed);
  var game = new Game(seed, controls, playerName);
  game.on("GameOver", function () {
    Q.delay(6000)
    .fin(function(){
      stage.removeChild(game);
      game.destroy();
      newGame(controls, playerName);
      game = null;
    })
    .done();
  });
  stage.addChild(game);

  currentNetwork.setGame(game);

  currentGame = game;
}


function start (playerName) {

  var controls = new ResponsiveControls();
  newGame(controls, playerName);

  // move in Game?

  var lastLoopT;
  var lastAbsoluteTime = 0;

  var updateGame = debug.profile("game.update", function (t, dt) {
    currentGame.update(t, dt);
  }, 100);

  function loop (loopT) {
    requestAnimFrame(loop);

    var t = Math.max(now(), lastAbsoluteTime); // ensure no backwards in synchronized time with current game.
    lastAbsoluteTime = t;

    if (!lastLoopT) lastLoopT = loopT;
    var dt = Math.min(100, loopT - lastLoopT); // The delta time is computed using the more precised loopT
    lastLoopT = loopT;

    updateGame(t, dt);
    currentNetwork.update(t, dt);

    renderer.render(stage);

  }

  requestAnimFrame(loop);
}

createDom();

Q.all([
  playerNameP,
  imagesLoaded,
  syncTime
]).spread(start).done();
