var jsfxr = require("jsfxr");
var howler = require("howler");

console.log("TODO", howler);

var micSprite = null;
var smoothstep = require("smoothstep");

function burnGen (f) {
  return jsfxr([3,,0.2597,0.3427,0.3548,0.04+0.03*f,,0.1573,,,,,,,,,0.3027,-0.0823,1,,,,,0.5]);
}

var SOUNDS = {
  burn: [burnGen(0),burnGen(0.2),burnGen(0.4),burnGen(0.6),burnGen(0.8),burnGen(1)],
  snowballHit: jsfxr([3,0.03,0.1,0.14,0.28,0.92,,-0.02,,,,0.0155,0.8768,,,,,,0.35,,,,,0.5]),
  carHit: jsfxr([0,,0.11,,0.1997,0.29,,-0.3599,-0.04,,,,,0.1609,,,,,1,,,,,0.5]),
  car: [
    jsfxr([3,0.3,0.7,,0.82,0.23,,-0.0999,,,,-0.02,,,,,0.62,,0.09,,,0.55,,0.5]),
    jsfxr([3,0.4,0.7,,0.82,0.13,,0.08,,,,-0.02,,,,,0.62,,0.09,,,0.55,,0.5]),
    jsfxr([2,0.29,0.6,,0.66,0.12,,-0.04,,,,-0.02,,,,,0.62,,0.08,,,0.33,-0.02,0.5])
  ]
};

function loopAudio (src) {
  var volume = 0;
  var current;
  var stopped = false;

  function step () {
    var audio = new Audio();
    audio.addEventListener('ended', function () {
      if (!stopped)
        step();
    });
    audio.src = src;
    audio.volume = volume;
    audio.play();
    current = audio;
  }

  step();

  return {
    setVolume: function (v) {
      current.volume = volume = v;
    },
    stop: function () {
      stopped = true;
      current.pause();
      current.src = null;
    }
  };
}

function play (src, obj, volume) {
  if (!micSprite) return;
  if (typeof src === "string" && src in SOUNDS) src = SOUNDS[src];
  if (typeof src === "object" && src.length) {
    return play(src[~~(Math.random()*src.length)], obj, volume);
  }
  var volume = volume || 1;
  if (obj) {
    var dx = obj.x - micSprite.x;
    var dy = obj.y - micSprite.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    volume *= Math.pow(smoothstep(350, 40, dist), 3);
  }
  if (!volume) return;
  var audio = new Audio();
  audio.src = src;
  audio.volume = volume;
  audio.play();
}

module.exports = {
  micOn: function (sprite) {
    micSprite = sprite;
  },
  play: play,
  loop: loopAudio
};
