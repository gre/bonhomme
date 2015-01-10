
var Q = require("q");

// TODO: not using window.prompt anymore
function prompt (text, value) {
  return Q.fcall(function () {
    var res = window.prompt(text, value||"");
    if (res === null) throw new Error("cancelled");
    return res;
  });
}

module.exports = prompt;
