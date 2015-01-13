var requestAnimFrame = require("raf");
var PIXI = require("pixi.js");

var Controls = require("../../client/Controls");
var World = require("../../client/objects/World");
var GMap = require("../../client/objects/Map");
var Container = require("../../client/pixi-extend/Container");

var conf = require("../../client/conf");
var font = require("../../client/font");

var width = conf.WIDTH;
var height = window.innerHeight - 50;
var NB = ~~(window.innerWidth / width);

var currentScore = document.createElement("span");
currentScore.style.fontWeight = "bold";
currentScore.style.fontFamily = "monospace";
currentScore.style.fontSize = "30px";
currentScore.style.width = "200px";
currentScore.style.display = "inline-block";

var renderers = [];
for (var i=0; i<NB; ++i) {
  var renderer = new PIXI.autoDetectRenderer(width, height, { resolution: window.devicePixelRatio });
  renderer.view.style.width = width+"px";
  renderer.view.style.height = height+"px";
  renderers.push(renderer);
}

var keyboard = new Controls();
var scroll = 1900;
var seed = 1000;

function newRun (i) {
  var stage = new PIXI.Stage(0x000000);

  var debug = new PIXI.DisplayObjectContainer();
  var cars = new Container();
  var particules = new Container();
  var spawners = new Container();
  var map = new GMap(seed+i, cars, particules, spawners);
  map.debug = debug;

  var world = new World();
  world.addChild(map);
  world.addChild(spawners);
  world.addChild(particules);
  world.addChild(cars);

  world.addChild(debug);

  stage.addChild(world);

  return { stage: stage, world: world, map: map };
}

function newRuns () {
  var runs = [];
  for (var i=0; i<NB; ++i) {
    runs[i] = newRun(i);
  }
  return runs;
}

var runs = [];
function regenerate (dir) {
  seed += NB * dir;
  runs = newRuns();
}


var last;
var lastGen = 0;
function render () {
  requestAnimFrame(render);

  var t = Date.now();
  if (!last) last = t;
  var dt = t - last;
  last = t;
  
  scroll += dt * keyboard.y();

  for (var i=0; i<NB; ++i) {
    var current = runs[i];

    current.map.watchWindow([scroll - conf.HEIGHT, scroll + height]);
    current.world.focusOnY(scroll);

    current.world.update(t, dt);

    renderers[i].render(current.stage);
  }

  if (t-lastGen > 200 && keyboard.x()) {
    lastGen = t;
    regenerate(keyboard.x());
  }

  currentScore.innerText = ""+scroll;
}

font.ready.then(function () {
  regenerate(0);
  requestAnimFrame(render);
}).done();

var regenBtn = document.createElement("button");
regenBtn.innerText = "Regenerate (or press left/right)";
regenBtn.onclick = function () { regenerate(1); };

document.body.appendChild(currentScore);
document.body.appendChild(regenBtn);
var br = document.createElement("br");
document.body.appendChild(br);
for (var i=0; i<NB; ++i) {
  document.body.appendChild(renderers[i].view);
}

