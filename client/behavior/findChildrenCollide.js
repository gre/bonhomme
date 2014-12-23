module.exports = function findChildrenCollide (sprite) {
  for (var k=0; k<this.children.length; ++k) {
    var collide = this.children[k].collides(sprite);
    if (collide) return collide;
  }
  return null;
};

