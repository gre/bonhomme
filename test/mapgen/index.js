
var requestAnimFrame = require("raf");
var PIXI = require("pixi.js");

var KeyboardControls = require("../../client/KeyboardControls");
var World = require("../../client/World");
var Map = require("../../client/Map");
var SpawnerCollection = require("../../client/SpawnerCollection");

var conf = require("../../client/conf");
var font = require("../../client/font");

var genName = "v2";

var width = conf.WIDTH;
var height = window.innerHeight - 40;

var NB = ~~(window.innerWidth / width);

var currentScore = document.createElement("span");
currentScore.style.fontWeight = "bold";
currentScore.style.fontFamily = "monospace";
currentScore.style.fontSize = "30px";
currentScore.style.width = "200px";
currentScore.style.display = "inline-block";

var renderers = [];
for (var i=0; i<NB; ++i) {
  renderers.push(new PIXI.autoDetectRenderer(width, height));
}

var keyboard = new KeyboardControls();
var scroll = 1000;

function newRun () {
  var stage = new PIXI.Stage(0xFFFFFF);

  var cars = new SpawnerCollection();
  var particules = new SpawnerCollection();
  var spawners = new PIXI.DisplayObjectContainer();
  var map = new Map(Math.random(), cars, particules, spawners, genName);

  var world = new World();
  world.addChild(map);
  world.addChild(spawners);
  world.addChild(particules);
  world.addChild(cars);

  stage.addChild(world);

  return { stage: stage, world: world, map: map };
}

function newRuns () {
  var runs = [];
  for (var i=0; i<NB; ++i) {
    runs[i] = newRun();
  }
  return runs;
}

var runs = newRuns();
function regenerate () {
  runs = newRuns();
}


var last;
var k=0;
function render (t) {
  requestAnimFrame(render);

  var t = Date.now();
  if (!last) last = t;
  var dt = t - last;
  last = t;
  
  scroll += 15 * keyboard.y();

  for (var i=0; i<NB; ++i) {
    var current = runs[i];

    current.map.watchWindow([scroll, height + scroll]);
    current.world.position.y = height + scroll;

    current.world.update(t, dt);

    renderers[i].render(current.stage);
  }

  if ((++k) % 10 == 0 && keyboard.x()) {
    regenerate();
  }

  currentScore.innerText = ""+scroll;
}
requestAnimFrame(render);


var regenBtn = document.createElement("button");
regenBtn.innerText = "Regenerate (or press left/right)";
regenBtn.onclick = regenerate;

document.body.appendChild(currentScore);
document.body.appendChild(regenBtn);
var br = document.createElement("br");
document.body.appendChild(br);
for (var i=0; i<NB; ++i) {
  document.body.appendChild(renderers[i].view);
}

