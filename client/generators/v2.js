
var _ = require("lodash");
var smoothstep = require("smoothstep");
var mix = require("../utils/mix");
var conf = require("../conf");

var WIDTH = conf.WIDTH;
var CHUNK_SIZE = 500;
var ROAD_DIST = 60;

function logger (chunk) {
  return function log (name, o) {
    chunk.logs.push(name+": "+JSON.stringify(o));
    return o;
  };
}

function listDistribution (random, split, n) {
  var j;
  var list = [];
  for (j=0; j<split; ++j)
    list.push(1);
  var toDistrib = n-split;
  for (j=0; j<toDistrib; ++j)
    list[~~(split*random())]++;
  return list;
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

function floorPattern (a) {
  return _.map(a, Math.floor.bind(Math));
}

function multPattern (a, x) {
  return _.map(a, function (y) { return x * y; });
}

function dotPattern (a, b) {
  var pattern = [];
  for (var j=0; j<b.length; ++j) {
    var n = b[j];
    if (n < 0) {
      pattern.push(n * a.length);
    }
    else {
      // Repeat n times the pattern a
      for (var k = 0; k < n; ++k) {
        for (var i=0; i<a.length; ++i) {
          pattern.push(a[i]);
        }
      }
    }
  }
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

function roadGen (random, yBase, difficulty, maxRoad) {
  var roadCount = ~~Math.min(0.8 + random() + 5 * difficulty * random(), maxRoad);
  if (roadCount <= 0) return [];
  var perRoadDifficulty = 1 - 1 / roadCount;
  return roads(roadCount, function (y, j) {
    var vel = 0.08 + 0.5 * mix(random(), 1-perRoadDifficulty, 0.8) * mix(random(), difficulty, 0.5);
    var maxFollowing = 3 + perRoadDifficulty * random() + 6 * random() * random();
    var maxHole = 8 - 5 * mix(smoothstep(0, 20, difficulty * perRoadDifficulty), random(), 0.5) + random();
    var spacing = 0.2 + 0.2 * random();
    // TODO make roads not anymore alternating
    return road(random, yBase + y, j % 2 === 0, vel, maxFollowing, maxHole, spacing);
  });
}


function hellChunk (random, difficulty) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };
  var log = logger(chunk);

  function fireballScale (i, random) {
    return 0.3 + 0.8 * random();
  }

  var j;

  var nb = ~~( 1.8 + 4 * difficulty * random() );
  var totalCols = nb * (1 + 2 * random() * random() + 4 * difficulty * random());

  var distribCols = listDistribution(random, nb, totalCols);

  log("distribCols", distribCols);

  for (j=0; j<nb; ++j) {
    var col = distribCols[j];

    var coolRepeatPatterns = [
      floorPattern([ 10 + 60 * random(), -20 * random() ]),
      floorPattern(multPattern([ random(), -random(), random(), -random() ], 1 + 20 * random())),
      [ 10, -2, 10, -2, 10, Math.floor(-40 * (1-difficulty)) ],
      [ 57, -78 ],
      multPattern([10, -10 ], col)
    ];

    var pos = [ j%2 ? 80 : WIDTH-80, 80 + ~~(j/2) * 100 ];
    var offset = (random() < 0.5 ? 1 : -1) * ((0.01+0.01*difficulty) * random() * random());
    var speed = 60 - 40 * random() - 10 * difficulty;
    var holes = _.range(Math.min(col * (0.2 * (1-difficulty) + 0.4 * random() * random()), col-1));
    var repeatPattern = coolRepeatPatterns[~~(random() * coolRepeatPatterns.length)];
    log("repeatPattern", repeatPattern);
    var pattern = dotPattern(rotatingHolesPattern(col, holes), repeatPattern);
    var spawner = nSpawner(fireballScale, pos, col, offset, speed, pattern);
    chunk.fireballs.push(spawner);
  }


  return chunk;
}


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

  var moreCols = mix(difficulty, random(), 0.5);
  log("more-cols", moreCols);

  var nb = ~~( 1.8 + 4 * difficulty * difficulty * mix(difficulty, random(), 0.5) );
  var totalCols = 20 + 40 * moreCols;

  var distribCols = listDistribution(random, nb, totalCols);

  for (j=0; j<nb; ++j) {
    var pos = [ j%2 ? 20 : WIDTH-20, 100 + ~~(j/2) * 60 ];
    var offset = (random() < 0.5 ? 1 : -1) * (0.1 * random() + 0.3 * random() * difficulty);
    var speed = 300 - 280*random() * difficulty * moreCols;
    var col = distribCols[j];
    var holes = _.range(Math.min(col * (0.2 * (1-difficulty) + 0.4 * random() * random()), col-1));
    var pattern = rotatingHolesPattern(col, holes);
    chunk.snowballs.push(nSpawner(snowballScale, pos, col, offset, speed, pattern));
  }

  return chunk;
}

function doubleRoadChunk (random, difficulty) {
  var diffs = random() < 0.5 ? [ difficulty / 2, difficulty ] : [ difficulty, difficulty / 2 ];
  var roads1 = roadGen(random, 0, diffs[0], 5);
  var dist = 160 - 80 * random()  - 60 * difficulty * random();
  var ystart = roads1.length * ROAD_DIST;
  var yend = roads1.length * ROAD_DIST + dist;
  var remaining = ~~((CHUNK_SIZE - yend) / ROAD_DIST);
  var roads2 = roadGen(random, yend, diffs[1], remaining);

  var snowballs = [];
  if (random() > mix(random(), difficulty, 0.8)) {
    snowballs.push({
      scale: function(){ return 0.5; },
      pos: [ 5, ystart + dist * 0.5 ],
      vel: 0.1 + 0.1 * random(),
      angle: 0,
      randAngle: 0.8 * random(),
      speed: 500 + 1000 * random(),
      life: 6000
    });
  }

  return {
    roads: roads1.concat(roads2),
    snowballs: snowballs,
    fireballs: [],
    logs: []
  };
}

function standardChunk (random, difficulty, i) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };

  var log = logger(chunk);

  function fireballScale (i, random) {
    return 0.4 + 0.4 * random();
  }

  function snowballScale (i, random) {
    return 0.5 + 0.6 * random() * random();
  }

  var pos, nb, n, offset, j, speed;

  var maxRoad = 6;

  // Roads
  if (i > 0) {
    chunk.roads = roadGen(random, 0, difficulty, maxRoad);
  }
  var roadCount = chunk.roads.length;
  var roadHeight = ROAD_DIST * roadCount;

  var maxRoadVel = _.max(_.pluck(chunk.roads, "vel"));
  var roadDifficulty = !roadCount ? 0 : Math.max(0, Math.min(Math.pow(roadCount / maxRoad, 2) + 2*(maxRoadVel-0.05), 1));
  
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

var generators = {
  "hell": hellChunk,
  "blizzard": blizzardChunk,
  "standard": standardChunk,
  "double": doubleRoadChunk
};

function allocChunk (i, time, random) {
  var difficulty =
    0.2 * ((i /  16) % 1) +
    0.5 * ((i / 32) % 1) +
    0.3 * (i / 64) +
    0.8 * random() * random() * random(); // rare hardness

  var g = "standard";
  if ( random() < 0.1 * smoothstep(0, 8, i) )
    g = "blizzard";
  if ( random() < 0.15 * smoothstep(0, 8, i) )
    g = "hell";
  if ( random() < 0.2 * smoothstep(0, 4, i) )
    g = "double";

  var chunk = generators[g](random, difficulty, i);
  chunk.logs = [ "gen: "+g+", diff: "+difficulty.toPrecision(3), "" ].concat(chunk.logs);
  return chunk;
}

module.exports = {
  chunkSize: CHUNK_SIZE,
  generate: allocChunk
};
