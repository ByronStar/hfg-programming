'strict'
let layer
let xPos = [320, 1020, 1745]

function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight);
  layer = document.getElementById('layer0');
  console.log(layer);
  box = 1;
  let elem
  // elem = createElement(layer, 'line', { x1: 700, y1: 0, x2: 700, y2: 2900 })
  // elem = createElement(layer, 'line', { x1: 1400, y1: 0, x2: 1400, y2: 2900 })
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 3; c++) {
      // let elem = createElement(layer, 'line', { x1: 0, y1: -20 + r * 387, x2: 2100, y2: -20 + r * 387 })
      elem = createElement(layer, 'text', { x: xPos[c], y: 100 + r * 387, width: 700 })
      elem.innerHTML = 'Benno'
      elem = createElement(layer, 'text', { x: xPos[c], y: 220 + r * 387 })
      if (box < 10) {
        elem.innerHTML = '0' + box
      } else {
        elem.innerHTML = box
      }
      if ((r * 3 + c) % 2 == 1) {
        box++
      }
    }
  }
}

function clearElement(elem) {
  let copy = elem.cloneNode(false);
  elem.parentNode.replaceChild(copy, elem);
  return copy;
}

function createElement(parent, type, attrList) {
  let elem = document.createElementNS(parent.namespaceURI, type);
  parent.appendChild(elem);
  for (attr in attrList) {
    elem.setAttribute(attr, attrList[attr]);
  }
  return elem;
}
