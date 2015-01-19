var conf = require("../conf.json");

var PlayerMoveState = module.exports = {
  encodeFromPlayer: function (player, t) {
    return PlayerMoveState.encode(PlayerMoveState.getFromPlayer(player, t));
  },
  decodeToPlayer: function (player, data) {
    return PlayerMoveState.applyToPlayer(PlayerMoveState.decode(data));
  },
  getFromPlayer: function (player, time) {
    return {
      time: Math.floor(time),
      input: [ player.controls.x(), player.controls.y() ],
      pos: [ Math.floor(player.x), Math.floor(player.y) ],
      life: Math.floor(player.life)
    };
  },
  applyToPlayer: function (player, state) {
    player.controls.setState({ x: state.input[0], y: state.input[1] });
    player.position.set(state.pos[0], state.pos[1]);
    player.life = state.life;
    return state.time;
  },

  // likely used by the server side
  encode: function (state) {
    return [state.time].concat(state.input).concat(state.pos).concat([ state.life ]);
  },
  decode: function (data) {
    return {
      time: data[0],
      input: data.slice(1, 3),
      pos: data.slice(3, 5),
      life: data[5]
    };
  },
  validatePos: function (x, y) {
    return !(x<0 || x>conf.WIDTH) && y <= conf.HEIGHT;
  },
  validateEncoded: function (t) {
    return (
      t.length === 6 &&
      t.every(function(value){ return typeof value === "number" && !isNaN(value) && isFinite(value); }) &&
      t[5] < 1000 && // life limit
      this.validatePos.apply(this, t.slice(3, 5)) &&
      (t[1] === -1 || t[1] === 0 || t[1] === 1) &&
      (t[2] === -1 || t[2] === 0 || t[2] === 1)
    );
  }
};

