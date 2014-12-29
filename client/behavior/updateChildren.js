module.exports = function updateChildren (t, dt) {
  var children = this.children;
  for (var i=0; i<children.length; ++i) {
    var child = children[i];
    if (child.update)
      child.update(t, dt);
  }
};
