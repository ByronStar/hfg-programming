var hugo1;
var hugo2 = 0;
var myNumber1 = 0;
var myNumber1 = 0.05;
var myText1 = "Hallo";
var myText2 = 'Hallo';
var myBoolean = true;
var myArray = [0, 'Hallo', true, 0.05, false];
var myObject = { name: 'Hugo', alter: 29, programmierer: true };
var myFunction = function() {
  console.log("Hallo");
}

var layer;

function init() {
  layer = document.getElementById('layer1');
  var uri = layer.namespaceURI;
  console.log("Innerhalb von init ist uri=", uri);
  var myElems = createPattern(layer, 20, 20, 5, '#FF00FF', 2);
  myElems[4].setAttribute('fill', 'lime');
  console.log(myElems[4]);
  svg = document.getElementById('svg');
  pt = svg.createSVGPoint();
  matrix = svg.getScreenCTM().inverse();
}

console.log("Fehler!", uri);

function createPattern(parent, width, count, gap, color, mode) {
  var elements = [];
  var newElem;
  var box = width + 2 * gap;
  var offset = -box * count / 2 + gap;
  if (mode == 2) {
    var klecks = document.getElementById('klecks');
    var scale = width * 1.5 / Math.max(klecks.getBBox().width, klecks.getBBox().height);
  }
  for (var col = 0; col < count; col++) {
    for (var row = 0; row < count; row++) {
      if (mode == 0)  {
        newElem = createElement(parent, 'rect', { x: offset + row * box, y: offset + col * box, width: width, height: width, fill: color });
      } else {
        if (mode == 1)  {
          newElem = createElement(parent, 'circle', { cx: offset + row * box + width/2, cy: offset + col * box + width/2, r: width/2, fill: color });
        } else {
          newElem = cloneElement(parent, klecks, { transform: 'translate(' + (offset + row * box + width / 2) + ' ' + (offset + col * box + width / 2) + ') scale(' + scale + ' ' + scale + ')'});
          newElem.setAttribute('fill', color);
        }
      }
      elements.push(newElem);
    }
  }
  return elements;
}

function createElement(parent, type, attrList) {
  var elem = document.createElementNS(parent.namespaceURI, type);
  parent.appendChild(elem);
  for (attr in attrList) {
    elem.setAttribute(attr, attrList[attr]);
  }
  return elem;
}

function cloneElement(parent, elem, attrList) {
  var clone = elem.cloneNode(true);
  var place = createElement(parent, 'g', attrList);
  place.appendChild(clone);
  var wrap = createElement(parent, 'g', {});
  wrap.appendChild(place);
  return wrap;
}

function cursorPoint(evt) {
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(matrix);
}
