
var smoothstep = require("smoothstep");
var mix = require("../utils/mix");
var conf = require("../conf");

var WIDTH = conf.WIDTH;

var CHUNK_SIZE = 480;

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


function addRotatingParticleSpawner (pos, rotate, vel, speed, seq) {
  return {
    scale: function (i, random) {
      return 0.3 + 0.2 * random() + 0.3 * random() * random();
    },
    pos: pos,
    vel: vel,
    rotate: rotate,
    speed: speed,
    seq: seq,
    life: 6000,
    angle: 0
  };
}

var roadDist = 60;

function nSpawner (pos, n, offset, speed) {
  return addRotatingParticleSpawner(pos, offset + 2*Math.PI / n, 0.25, speed / n);
}

function allocChunk (i, time, random) {
  var y = -CHUNK_SIZE * i;
  var pos, nb, n, off, j, speed, vel;
  var maxFollowing, maxHole, spacing;

  var chunk = {
    roads: [],
    snowballs: [],
    fireballs: []
  };

  if (i > 0) {
    nb = ~~Math.min(6, 2*random()*random() + random() * (i / 8) + 1);
    for (j=0; j<nb; ++j) {
      vel = 0.05 + 0.05 * random() + 0.004 * (i + 10 * random() + 50 * random() * random());
      maxFollowing = 3 + (i / 20) * random() + 6 * random() * random();
      maxHole = 8 - 5 * mix(smoothstep(0, 20, i * random()), random(), 0.5) + random() / (i / 5);
      spacing = 0.2 + 0.3 * random();
      var road = addCarPath(random, y - 100 - j*roadDist, j % 2 === 0, vel, maxFollowing, maxHole, spacing);
      road.first = j === 0;
      road.last = j === nb-1;
      chunk.roads.push(road);
    }
  }

  if (i > 1 && random() < 0.9) {
    nb = 3 * random() * random() + 2 * random() * (10-i%10)/10 + 1;
    for (j=0; j<nb; ++j) {
      var posd = 50*random() + 50;
      pos = [random()<0.5 ? posd : WIDTH-posd, y-200*random()-280];
      n = 1 + ~~(random() * (3 * random() + i / 8));
      offset = random() * (random() * 0.3 + 0.1 * (i % 24) / 24);
      speed = (1-(i%40)/50) * 1000 * (1.1 - random()*random());
      chunk.snowballs.push(nSpawner(pos, n, offset, speed));
    }
  }

  if (i > 4 && random() < 0.9) {
    nb = 2 * random() * random() + random() * (i/8) + i / 30 + 0.5;
    for (j=0; j<nb; ++j) {
      var posd = 50*random() + 50;
      pos = [random()<0.5 ? posd : WIDTH-posd, y-200*random()-280];
      n = 1 + ~~(random() * (random() + i / 10));
      offset = random() * (random() * 0.3 + 0.1 * ((i+10) % 24) / 24);
      speed = (1-(i%50)/50) * 1000 * (1 - random()*random());
      chunk.fireballs.push(nSpawner(pos, n, offset, speed));
    }
  }

  return chunk;
}


module.exports = {
  chunkSize: CHUNK_SIZE,
  generate: allocChunk
};
