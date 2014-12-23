module.exports = function updateChildren (t, dt) {
  this.children.forEach(function (child) {
    if (child.update)
      child.update(t, dt);
  });
};
