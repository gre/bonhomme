
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
  var list = new Int8Array(split);
  for (j=0; j<split; ++j)
    list[j] = 1;
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
  return _.map(a, function (v) {
    return ~~(v); // This do the job as expected for negative value of a pattern
  });
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

function nSpawner (scale, pos, n, offset, speed, seq, vel, diverge) {
  return {
    scale: scale,
    pos: pos,
    vel: vel,
    rot: (offset + 2*Math.PI) / n,
    speed: speed,
    count: n,
    pattern: seq,
    life: 6000,
    ang: 0,
    randAng: diverge||0,
    randVel: diverge||0
  };
}

function road (random, y, leftToRight, vel, maxFollowing, maxHole, spacing) {
  var length = 6;
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
  var leftToRight = random() < 0.5;
  return roads(roadCount, function (y) {
    var vel = 0.08 + 0.5 * mix(random(), 1-perRoadDifficulty, 0.8) * mix(random(), difficulty, 0.5);
    var maxFollowing = 3 + perRoadDifficulty * random() + 6 * random() * difficulty;
    var maxHole = 9 - 5 * mix(smoothstep(0, 20, difficulty * perRoadDifficulty), random(), 0.5);
    var spacing = 0.2 + 0.2 * (1-difficulty);
    // TODO make roads not anymore alternating
    return road(random, yBase + y, leftToRight = !leftToRight, vel, maxFollowing, maxHole, spacing);
  });
}

function genRepeatPatterns (random) {
  var i = ~~(3 * random());
  switch (i) {
    case 0: return floorPattern(multPattern([ 0.2+0.8*random(), -random(), 0.2+0.8*random(), -1-random() ], 20 + 20 * random()));
    case 1: return floorPattern(multPattern([ 0.5 + 0.5*random(), -0.5-2*random() ], 80));
    case 2: return floorPattern(multPattern([1, -1 ], 30 + 50*random()));
  }
  throw new Error("reached unmatched case "+i);
}


function hellChunk (random, difficulty) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };
  var log = logger(chunk);

  function fireballScale (o) {
    return 0.3 + 0.8 * o.random();
  }

  var j;

  var nb = ~~( 1.6 + 1 * difficulty + 2 * difficulty * random() );
  var totalCols = nb * (1 + 1.2 * random() * random() + 3 * difficulty * random());

  var distribCols = listDistribution(random, nb, totalCols);

  log("distribCols", distribCols);

  var border = mix(30, conf.WIDTH/2-30, random()*random()) | 0;
  var yspace = mix(100, 200, random()) | 0;

  for (j=0; j<nb; ++j) {
    var col = distribCols[j];

    var pos = [ j%2 ? border : WIDTH - border, 80 + yspace * ((j/2)|0) ];
    var offset = (random() < 0.5 ? 1 : -1) * ((0.01+0.01*difficulty) * random() * random());
    var speed = 90 - 40 * random() - 30 * difficulty;
    var holes = _.range(Math.min(col * (0.2 * (1-difficulty) + 0.4 * random() * random()), col-1));
    var repeatPattern = genRepeatPatterns(random);
    var rotatePattern = rotatingHolesPattern(col, holes);
    var pattern = dotPattern(rotatePattern, repeatPattern);
    // log("col", col);
    // log("holes", holes);
    // log("rotatePattern", rotatePattern);
    log("repeatPattern", repeatPattern);
    // log("pattern", pattern);
    var spawner = nSpawner(fireballScale, pos, col, offset, speed, pattern, 0.2);
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

  function snowballScale (o) {
    return 0.2 + 0.2 * o.random();
  }

  var j;

  var moreCols = mix(difficulty, random(), 0.5);
  log("more-cols", moreCols);

  var nb = ~~( 1.8 + 4 * difficulty * difficulty * mix(difficulty, random(), 0.5) );
  var totalCols = nb * 2 + 40 * moreCols;
  var border = mix(50, conf.WIDTH/2-50, 1-random()*random()) | 0;

  var distribCols = listDistribution(random, nb, totalCols);

  for (j=0; j<nb; ++j) {
    var pos = [ j%2 ? border : WIDTH-border, 100 + ~~(j/2) * 60 ];
    var offset = (random() < 0.5 ? 1 : -1) * (0.05 * random() + 0.2 * random() * difficulty);
    var speed = 300 - 280*random() * difficulty * moreCols;
    var col = distribCols[j];
    var holes = _.range(Math.min(col * (0.2 * (1-difficulty) + 0.4 * random() * random()), col-1));
    var pattern = random() < 0.2 ? genRepeatPatterns(random) : rotatingHolesPattern(col, holes);
    chunk.snowballs.push(nSpawner(snowballScale, pos, col, offset, speed, pattern, 0.25, 0.1));
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
      ang: 0,
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

  function fireballScaleMaker (genSize) {
    return function (o) {
      return genSize * (0.8 + 0.4 * o.random());
    };
  }

  function snowballScale (o) {
    return 0.3 + 0.3 * o.random() * o.random();
  }

  var pos, nb, n, offset, j, speed, a;

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
      a = random() * random();
      speed = (1.1 - a)* mix(600, 200, roadDifficulty);
      chunk.snowballs.push(nSpawner(snowballScale, pos, n, offset, speed, random() < a ? genRepeatPatterns(random) : null, 0.22, 0.05));
    }
  }

  // Fireballs
  if (i > 4 && random() < 0.9) {
    nb = 3 * (1-roadDifficulty) * random() * random();
    for (j=0; j<nb; ++j) {
      pos = spawnerSpots.splice(~~(random()*spawnerSpots.length), 1)[0];
      n = 1 + ~~(random() * random() + 5 * random() * random() * random());
      offset = random() * random() * 0.3;
      a = random() * random();
      log("a", a);
      speed = (1.1 - a) * mix(100, 600, roadDifficulty);
      chunk.fireballs.push(nSpawner(fireballScaleMaker(0.4 + 0.3 * difficulty + 2*random()*(1-a)*(1-a)), pos, n, offset, speed, random()*random() > a ? genRepeatPatterns(random) : [~~(10 + 50*random()),-1], 0.25 - 0.2 * random() * a));
    }
  }

  return chunk;
}

function passageChunk (random, difficulty) {
  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: [],
    logs: []
  };
  // var log = logger(chunk);
  var n;

  var holesNb = (3*random())|0;
  var div = (holesNb + 2 + 1 * random() + (3 + 3 * random()) * difficulty) | 0;
  var holes = [];
  for (var h=holesNb; h >= 0; --h) {
    var hn = (div * random()) | 0;
    if (!_.contains(holes, hn))
      holes.push(hn);
  }
  var margin = 0;

  function fireballScale (o) {
    return 0.2 * difficulty + 0.4 + 0.3 * o.random() + 0.2 * difficulty * random();
  }

  function snowballScale (o) {
    return 0.3 * difficulty + 0.2 + 0.3 * o.random() * o.random();
  }

  for (var i=1; i < div; ++i) {
    if (_.contains(holes, i)) continue;
    var left = random() < 0.5;
    var snow = random() < 0.5 * (1-difficulty) + 0.2 * random();
    var speed = 40 + 50 * random() + 30 * (1-difficulty);
    var pattern = genRepeatPatterns(random);
    (snow ? chunk.snowballs : chunk.fireballs).push({
      scale: snow ? snowballScale : fireballScale,
      pos: [ left ? margin : WIDTH-margin , Math.floor(i * CHUNK_SIZE / div) ],
      vel: 0.2 + 0.1 * random(),
      ang: left ? 0 : Math.PI,
      speed: speed,
      pattern: pattern,
      life: 6000
    });
  }

  if (random() < difficulty) {
    n = ~~(2 + random() + 2 * random() * difficulty);
    chunk.fireballs.push({
      scale: fireballScale,
      pos: [ random() * WIDTH, random()<0.5 ? 30 : CHUNK_SIZE-30 ],
      vel: 0.2,
      rot: (0.02 * random() + 2*Math.PI)/n,
      count: n,
      speed: 100,
      pattern: genRepeatPatterns(random),
      life: 6000
    });
  }

  if (random() < 0.2) {
    n = ~~(1 + 2 * random() + 4 * random() * random());
    chunk.snowballs.push({
      scale: snowballScale,
      pos: [ random() * WIDTH, random()<0.5 ? 30 : CHUNK_SIZE-30 ],
      vel: 0.2,
      rot: (0.04 * random() + 2*Math.PI)/n,
      count: n,
      speed: 10 + 100 * random(),
      pattern: [100, -200],
      life: 6000
    });
  }

  return chunk;
}


var generators = {
  "hell": hellChunk,
  "blizzard": blizzardChunk,
  "standard": standardChunk,
  "double": doubleRoadChunk,
  "passage": passageChunk
};

function allocChunk (i, time, random) {
  var difficulty =
    0.2 * ((i /  16) % 1) +
    0.5 * ((i / 32) % 1) +
    0.3 * (i / 64) +
    0.8 * random() * random() * random(); // rare hardness

  var g = "standard";
  if ( random() < 0.08 * smoothstep(0, 8, i) )
    g = "blizzard";
  if ( random() < 0.15 * smoothstep(0, 8, i) )
    g = "hell";
  if ( random() < 0.30 * smoothstep(0, 4, i) )
    g = "passage";
  if ( random() < 0.20 * smoothstep(0, 4, i) )
    g = "double";

  /*
  difficulty = random();
  g = "passage";
  */

  var chunk = generators[g](random, difficulty, i);
  chunk.logs = [ g+", "+difficulty.toPrecision(3), "" ].concat(chunk.logs);
  return chunk;
}

module.exports = {
  chunkSize: CHUNK_SIZE,
  generate: allocChunk
};
