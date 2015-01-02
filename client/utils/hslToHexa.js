function HUEtoRGB (p, q, t){
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}


window.h = module.exports = function hslToHexa (h, s, l) { // inspired from https://github.com/kamicane/rgb/blob/master/index.js
  var r, b, g;
  h = h / 360;
  s = s / 100;
  l = l / 100;
  if (h > 1 || h < 0 || s > 1 || s < 0 || l > 1 || l < 0) return null;
  if (s === 0) {
    r = b = g = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = HUEtoRGB(p, q, h + 1 / 3);
    g = HUEtoRGB(p, q, h);
    b = HUEtoRGB(p, q, h - 1 / 3);
  }
  return ~~(r * 0xFF) << 16 | ~~(g * 0xFF) << 8 | ~~(b * 0xFF);
};

