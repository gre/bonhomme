
var _ = require("lodash");
var smoothstep = require("smoothstep");
var mix = require("../utils/mix");
var conf = require("../conf");

var WIDTH = conf.WIDTH;

var CHUNK_SIZE = 480;

var ROAD_DIST = 60;

function addCarPath (random, y, leftToRight, vel, maxFollowing, maxHole, spacing) {
  var length = 10;
  var seq = [];
  for (var i=0; i<length; ++i) {
    var n = (i%2 ? -1 : 1) * ~~(1 + ( (i%2 ? maxHole : maxFollowing) - 1) * random());
    seq.push(n);
  }
  return {
    y: y,
    leftToRight: leftToRight,
    vel: vel,
    speed: (80 * (1+(spacing||0))) / vel,
    seq: seq
  };
}


function addRotatingParticleSpawner (scale, pos, rotate, vel, speed, seq) {
  return {
    scale: scale,
    pos: pos,
    vel: vel,
    rotate: rotate,
    speed: speed,
    seq: seq,
    life: 6000,
    angle: 0
  };
}

function nSpawner (scale, pos, n, offset, speed) {
  return addRotatingParticleSpawner(scale, pos, (offset + 2*Math.PI) / n, 0.25, speed / n);
}

/**
 * - make roads direction not anymore %2
 */


function blizzardChunk () {

}

function doubleRoadChunk () {

}

function allocChunk (i, time, random) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };

  function log (name, o) {
    chunk.logs.push(name+": "+JSON.stringify(o));
  }

  function fireballScale (i, random) {
    return 0.5 + 0.1 * random();
  }

  function snowballScale (i, random) {
    return 0.4 + 0.6 * random() * random();
  }

  var y = -CHUNK_SIZE * i;
  var pos, nb, n, off, j, speed, vel;
  var maxFollowing, maxHole, spacing;

  var maxRoad = 5;

  var roadCount = ~~Math.min(maxRoad, 3*random()*random() + random() * mix(i / 7, 1, random()*random()) + 0.7);
  var roadHeight = ROAD_DIST * roadCount;

  // Roads
  var maxRoadVel = 0;
  if (i > 0) {
    nb = roadCount;
    for (j=0; j<nb; ++j) {
      vel = 0.05 + 0.05 * random() + 0.004 * (i + 10 * random() + 50 * random() * random());
      maxRoadVel = Math.max(maxRoadVel, vel);
      maxFollowing = 3 + (i / 20) * random() + 6 * random() * random();
      maxHole = 8 - 5 * mix(smoothstep(0, 20, i * random()), random(), 0.5) + random() / (i / 5);
      spacing = 0.2 + 0.3 * random();
      var road = addCarPath(random, y + j*ROAD_DIST, j % 2 === 0, vel, maxFollowing, maxHole, spacing);
      road.first = j === nb-1;
      road.last = j === 0;
      chunk.roads.push(road);
    }
  }
  var roadDifficulty = Math.max(0, Math.min(Math.pow(nb / maxRoad, 2) + 2*(maxRoadVel-0.05), 1));
  
  log("road-difficulty", roadDifficulty);

  var gridx = 6;
  var gridy = 5;


  var spawnyfrom = y + roadHeight;
  var spawnheight = CHUNK_SIZE - roadHeight;

  var xRange = _.range(1, gridx).map(function (i) {
    return Math.floor(i * WIDTH / gridx);
  });
  var yRange = _.range(1, gridy).map(function (j) {
    return Math.floor(spawnyfrom + j * spawnheight / gridy);
  });
  var spawnerSpots = [];
  xRange.forEach(function (px) {
    yRange.forEach(function (py) {
       spawnerSpots.push([ px, py ]);
    });
  });

  // Snowballs
  if (i > 1 && random() < 0.9) {
    nb = 2 * random() * random();
    for (j=0; j<nb; ++j) {
      pos = spawnerSpots.splice(~~(random()*spawnerSpots.length), 1)[0];
      n = 1 + ~~(random() * random() + 5 * random() * random() * random());
      offset = random() * (random() * 0.3 + 0.1 * (i % 24) / 24);
      speed = (1.1 - random()*random())* mix(600, 200, roadDifficulty);
      chunk.snowballs.push(nSpawner(snowballScale, pos, n, offset, speed));
    }
  }

  // Fireballs
  if (i > 4 && random() < 0.9) {
    nb = 3 * (1-roadDifficulty) * random() * random();
    for (j=0; j<nb; ++j) {
      pos = spawnerSpots.splice(~~(random()*spawnerSpots.length), 1)[0];
      n = 1 + ~~(random() * random() + 5 * random() * random() * random());
      offset = random() * random() * 0.3;
      speed = (1.1 - random()*random())* mix(100, 600, roadDifficulty);
      chunk.fireballs.push(nSpawner(fireballScale, pos, n, offset, speed));
    }
  }

  return chunk;
}


module.exports = {
  chunkSize: CHUNK_SIZE,
  generate: allocChunk
};
