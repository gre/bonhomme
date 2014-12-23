
module.exports = function velUpdate (t, dt) {
  if (this.vel) {
    this.position.x += this.vel[0] * dt;
    this.position.y += this.vel[1] * dt;
  }
};
