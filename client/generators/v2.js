
var _ = require("lodash");
var smoothstep = require("smoothstep");
var mix = require("../utils/mix");
var conf = require("../conf");

var WIDTH = conf.WIDTH;
var CHUNK_SIZE = 480;
var ROAD_DIST = 60;

function logger (chunk) {
  return function log (name, o) {
    chunk.logs.push(name+": "+JSON.stringify(o));
  };
}


function rotatingHolesPattern (n, holesIndex) {
  var pattern = [];
  var plus = 0;
  var minus = 0;
  for (var i=0; i<n; ++i) {
    var p = !_.contains(holesIndex, i);
    if (p && minus) {
      pattern.push(minus);
      minus = 0;
    }
    if (!p && plus) {
      pattern.push(plus);
      plus = 0;
    }
    if (p) plus ++;
    else minus --;
  }
  if (plus) pattern.push(plus);
  if (minus) pattern.push(minus);
  return pattern;
}

function rotatingSpawner (scale, pos, rotate, vel, speed, seq) {
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

function nSpawner (scale, pos, n, offset, speed, seq) {
  return rotatingSpawner(scale, pos, (offset + 2*Math.PI) / n, 0.25, speed / n, seq);
}

function road (random, y, leftToRight, vel, maxFollowing, maxHole, spacing) {
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

function roads (nb, createRoad) {
  return _.map(_.range(0, nb), function (j) {
    var road = createRoad(j * ROAD_DIST, j);
    road.first = j === nb-1;
    road.last = j === 0;
    return road;
  });
}

/**
 * - make roads direction not anymore %2
 */

function blizzardChunk (random, difficulty) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };
  var log = logger(chunk);

  function snowballScale (i, random) {
    return 0.4 + 0.4 * random();
  }

  var j;

  var moreCols = random();
  log("more-cols", moreCols);

  var nb = 2;
  var totalCols = nb * (10 + 30 * mix(moreCols, random(), 0.5) * difficulty);

  var distribCols = [];
  for (j=0; j<nb; ++j)
    distribCols.push(0);
  for (j=0; j<totalCols; ++j) {
    distribCols[~~(nb*random())]++;
  }

  for (j=0; j<nb; ++j) {
    var pos = [ j%2 ? 20 : WIDTH-20, 100 + ~~(j/2) * 100 ];
    var offset = 0.1 * random() * random();
    var speed = 300 - 280*random() * difficulty * moreCols;
    var col = distribCols[j];
    var holes = _.union(_.range(0, (nb/2) * random()), _.range(nb/2, nb/2 + (nb/2) * random() * random()));
    var pattern = rotatingHolesPattern(col, holes);
    chunk.snowballs.push(nSpawner(snowballScale, pos, col, offset, speed, pattern));
  }

  return chunk;
}

/*
function doubleRoadChunk () {

}
*/

function standardChunk (i, time, random) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };

  var log = logger(chunk);

  function fireballScale (i, random) {
    return 0.5 + 0.3 * random();
  }

  function snowballScale (i, random) {
    return 0.5 + 0.6 * random() * random();
  }

  var pos, nb, n, offset, j, speed, vel;
  var maxFollowing, maxHole, spacing;

  var maxRoad = 5;

  var roadCount = ~~Math.min(maxRoad, 3*random()*random() + random() * mix(i / 7, 1, random()*random()) + 0.7);
  var roadHeight = ROAD_DIST * roadCount;

  // Roads
  var maxRoadVel = 0;
  if (i > 0) {
    chunk.roads = roads(roadCount, function (y, j) {
      vel = 0.05 + 0.05 * random() + 0.004 * (i + 10 * random() + 50 * random() * random());
      maxRoadVel = Math.max(maxRoadVel, vel);
      maxFollowing = 3 + (i / 20) * random() + 6 * random() * random();
      maxHole = 8 - 5 * mix(smoothstep(0, 20, i * random()), random(), 0.5) + random() / (i / 5);
      spacing = 0.2 + 0.3 * random();
      return road(random, y, j % 2 === 0, vel, maxFollowing, maxHole, spacing);
    });
  }
  var roadDifficulty = Math.max(0, Math.min(Math.pow(roadCount / maxRoad, 2) + 2*(maxRoadVel-0.05), 1));
  
  log("road-difficulty", roadDifficulty);

  var gridx = 6;
  var gridy = 5;


  var spawnyfrom = roadHeight;
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

function allocChunk (i, time, random) {
  var difficulty = random();
  var chunk;
  if (i === 5)
    chunk = blizzardChunk(random, difficulty);
  else {
    chunk = standardChunk(i, time, random);
  }
  logger(chunk)("difficulty", difficulty);
  return chunk;
}

module.exports = {
  chunkSize: CHUNK_SIZE,
  generate: allocChunk
};
