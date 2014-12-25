var jsfxr = require("jsfxr");
var howler = require("howler");

var Howl = howler.Howl;
var Howler = howler.Howler;

function burnGen (f) {
  return jsfxr([3,,0.2597,0.3427,0.3548,0.04+0.03*f,,0.1573,,,,,,,,,0.3027,-0.0823,1,,,,,0.5]);
}

function carGen (p) {
  var freq = 0.1+p*0.2;
  var lowpass = 0.08;
  return jsfxr([3,0.4,1,,0.81,freq,,,,0.04,0.45,,,,,,0.58,,lowpass,,0.05,0.05,,0.8]);
}


var SOUNDS = {
  burn: [burnGen(0),burnGen(0.2),burnGen(0.4),burnGen(0.6),burnGen(0.8),burnGen(1)],
  snowballHit: [jsfxr([3,0.03,0.1,0.14,0.28,0.92,,-0.02,,,,0.0155,0.8768,,,,,,0.35,,,,,0.5])],
  carHit: [
    jsfxr([3,,0.0661,,0.36,0.3901,,-0.5478,,,,-0.0799,0.29,,,,,-0.2199,0.22,-0.26,,,0.02,0.5])
  ],
  car: [
    // jsfxr([3,0.4,1,,0.79,0.2,,,,,,-0.02,,,,,0.62,,0.13,,,,,0.8]),
    // jsfxr([3,0.4,1,,0.79,0.19,,,,,,-0.02,,,,,-0.12,,0.08,,0.33,0.21,,0.8]),
    // jsfxr([3,0.4,1,,0.79,0.24,,,,,,-0.02,,,,,-0.24,0.08,0.13,,,,,0.8]),
    // jsfxr([3,0.4,1,,0.79,0.18,,,,,,-0.02,,,,,-0.2199,,0.07,,,,,0.8]),
    // jsfxr([3,0.4,1,,0.79,0.19,,,,,,-0.02,,,,,0.58,,0.06,,,0.02,,0.8]),
    carGen(0), carGen(0.5), carGen(1)
  ],
  start: [
    jsfxr([ 2,0.44,0.24,,0.55,0.2,,0.02,0.02,0.12,0.34,,0.43,0.66,-0.14,,-0.54,0.56,0.17,,,0.28,,0.6 ])
  ],
  lose: [
    // 1,0.6091,0.8367,0.0758,1,0.65,,-0.38,-0.0759,0.92,0.38,0.08,0.57,0.0242,0.0614,0.71,0.4041,-0.2684,0.12,,,0.69,0.02,0.5
    // 0,0.15,0.57,0.2658,0.95,0.27,,,,0.0538,0.8094,-0.3399,0.16,,0.28,-0.1821,-0.0764,0.9988,0.17,,0.59,0.4248,0.1599,0.5
    // jsfxr([1,0.66,0.85,,0.93,0.47,,-0.06,-0.0999,0.97,0.03,-0.6,0.53,,,0.23,0.36,-0.3399,0.77,-0.06,,0.55,,0.5])
    jsfxr([ 2,0.08,0.63,0.11,0.84,0.24,,,-0.06,0.23,0.77,,0.43,0.66,-0.14,,-0.6,0.56,0.32,-0.06,,,,0.6 ])
  ]
};
var howlsById = {};
for (var id in SOUNDS) {
  var howls = [];
  var SOUND = SOUNDS[id];
  var lgth = SOUND.length;
  for (var i=0; i<lgth; ++i) {
    var howl = new Howl({
      src: [ SOUND[i] ],
      refDistance: 10,
      rolloffFactor: 1
    });
    howls.push(howl);
  }
  howlsById[id] = howls;
}

function loopAudio (src) {
  var howl = new Howl({
    src: [ src ],
    volume: 0,
    loop: true,
    autoplay: true
  });

  return {
    setVolume: function (v) {
      howl.volume(v);
    },
    stop: function () {
      howl.stop();
    }
  };
}

var trackingSprites = [];

function syncSprite (howl, audioId, sprite) {
  howl.pos(sprite.x, sprite.y, 0, audioId);
  if (sprite.vel) howl.velocity(sprite.vel[0], sprite.vel[1], 0, audioId);
}

function play (src, sprite, volume) {
  if (!(src in howlsById)) throw new Error(src+" is unknown");
  volume = volume || 1;
  var arr = howlsById[src];
  var howl = arr.length===1 ? arr[0] : arr[~~(Math.random()*arr.length)];

  var audioId = howl.play();
  howl.volume(volume, audioId);

  if (sprite) {
    var item = [ howl, audioId, sprite ];

    syncSprite.apply(null, item);

    trackingSprites.push(item);
    howl.once("end", function () {
      var i = trackingSprites.indexOf(item);
      if (i !== -1) trackingSprites.splice(i, 1);
    }, audioId);

  }
}

function update (t, dt) {
  for (var i=0, length = trackingSprites.length; i<length; ++i) {
    syncSprite.apply(null, trackingSprites[i]);
  }
}

module.exports = {
  micOn: function (sprite) {
    Howler.pos(sprite.x, sprite.y, 0);
    if (sprite.vel) Howler.velocity(sprite.vel[0], sprite.vel[1], 0);
  },
  play: play,
  loop: loopAudio,
  update: update
};
