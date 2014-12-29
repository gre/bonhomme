
module.exports = function velUpdate (t, dt) {
  var vel = this.vel;
  if (vel) {
    this.position.x += vel[0] * dt;
    this.position.y += vel[1] * dt;
  }
};
