
module.exports = function velUpdate (t, dt) {
  var vel = this.vel;
  if (vel) {
    var pos = this.position;
    this.position.set(
      pos.x + vel[0] * dt,
      pos.y + vel[1] * dt
    );
  }
};
