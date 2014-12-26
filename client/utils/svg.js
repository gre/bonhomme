
module.exports = function svg (svgText) {
  var parser = new window.DOMParser();
  var docElem = parser.parseFromString(svgText, "text/xml").documentElement;
  var node = docElem;
  document.importNode(node, true);
  return node;
};
