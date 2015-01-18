
var Qstart = require("qstart");
var Q = require("q");
var Qajax = require("qajax");
var requestAnimFrame = require("raf");
var io = require("socket.io-client");
var today = require("../common/today");

require("socket-ntp/client/ntp");
var ntp = window.ntp;

var atlas = require("./atlas");
var font = require("./font");
var Platform = require("./platform");
var Game = require("./screens/Game");
var Loading = require("./screens/Loading");
var NetworkGame = require("./network/NetworkGame");
var Controls = require("./Controls");

// FIXME remove the spaghettis!


// TODO modularize the network part
var socket = io("/", { reconnection: false });
var socketConnectedD = Q.defer();
var socketConnected = socketConnectedD.promise;
socket.on('connect', socketConnectedD.resolve);
socket.on('connect_error', socketConnectedD.reject);

// TODO modularize NTP
ntp.init(socket);
var syncTime = socketConnected.delay(2000);
var latestOffset = 0;
function now () {
  var off = ntp.offset();
  if (!isNaN(off))
    latestOffset = off;
  return Date.now() - latestOffset;
}

// FIXME there should be no global state...
var renderer,
    game,
    network,
    platform,
    controls;

socketConnected.then(function () {
  network = new NetworkGame(socket);
  if (game) network.setGame(game);
});

function newGame (playerName) {
  // This part is ugly...
  var seed = "grewebisawesome" + today(now());
  var instance = new Game(seed, controls, playerName);
  instance.on("GameOver", function () {
    Q.delay(6000)
    .fin(function(){
      instance.destroy();
      newGame(playerName);
      instance = null;
    })
    .done();
  });

  game = instance;
  if (network) network.setGame(game);
  platform.setGame(game);
}


function start (playerName) {

  newGame(playerName);

  var lastLoopT;
  var lastAbsoluteTime = 0;

  function loop (loopT) {
    requestAnimFrame(loop);
    // if (controls.paused()) return; // FIXME do something about pause?

    var t = Math.max(now(), lastAbsoluteTime); // ensure no backwards in synchronized time with current game.
    lastAbsoluteTime = t;

    if (!lastLoopT) lastLoopT = loopT;
    var dt = Math.min(100, loopT - lastLoopT); // The delta time is computed using the more precised loopT
    lastLoopT = loopT;

    game.update(t, dt);

    if (network)
      network.update(t, dt);

    renderer.render(game);

    platform.update(t, dt);
  }

  requestAnimFrame(loop);
}

Qstart.then(function () {
  platform = new Platform();
  controls = new Controls();
  renderer = platform.createRenderer();

  var imagesLoaded = atlas(); // FIXME

  var load = Q.all([
    platform.getPlayerName().fail(function(){ return null; }),
    imagesLoaded,
    syncTime,
    font.ready
  ]);
  var loading = new Loading();
  var loadStart;
  (function loadingloop (t) {
    if (!loadStart) loadStart = t;
    if (!load.isPending()) return;
    requestAnimFrame(loadingloop);
    loading.setProgress((t-loadStart) / 2200); // FIXME this has to be smarter
    loading.update(t - loadStart);
    renderer.render(loading);
  }());

  return load
    .spread(start);

}).done();


/// Error management

window.onerror = function (e) {
  var webgl = ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )();

  Qajax("/report/error", {
    method: "POST",
    data: {
      userAgent: window.navigator.userAgent,
      e: ""+e,
      message: e.message,
      stack: e.stack,
      supports: {
        webgl: webgl
      }
    }
  });
};
