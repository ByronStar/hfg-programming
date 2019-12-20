/*

  Achtung die Kurve!

  Spielidee:
    - mehrere (zwei ;-) Spieler (am selben Computer) steuern mit 2 Tasten die Richtung einer Linie, die sich automatisch verlängert
    - die Richtung ändert sich solange die jeweilige Taste gedrückt bleibt
    - wenn eine Linie den Rand erreicht, oder eine andere Linie trifft, ist das Spiel beendet und der Spieler hat verloren

  Spieldesign:
    - Umsetzung mit Javascript und SVG Graphik

    Grafik:
    - wie male ich eine SVG Linie, die sich automatisch verlängert?
      - wie lege ich die Richtung fest?
      - wie bestimme ich den nächsten Punkt?
      - wann muss ich einen Punkt der Linie hinzufügen?
    => Datenmodell der Linie!

    Input:
    - wie merke ich, daß eine Taste gedrückt ist?
    - wie speichere und ändere ich die Richtung?
    => Datenmodell des User Inputs

    Spielelogik:
    - wie speichere ich die nötigen Informationen (Grafik und Input) zu einer Linie?
    - wie erkenne ich, dass eine Linie den Rand berührt?
    - wie erkenne ich, dass eine Linie auf eine andere trifft?
    => Datenmodell des Spiels

    Offene Punkte:
    - mindestens ein zweiter lokaler Spieler (Kurve, Eingabe keys, ...)
    - Lücken in der Kurve (M x,y anstatt L x,y im path d Attribut)
    - Extras (änderbare Geschwindigkeit, ...)
    - Multiplayer über das Netzwerk
    - ...
*/

var layer, base;
var curves = [];
var keyPressed = {};
var deltaHeading = Math.PI / 40;
var deltaMove = 4;
var paused = true;
var gameOver = false;
var width = 1920;
var height = 1200;
var info;
var config = [{
  l: '1',
  r: 'q',
  c: 'red',
  ok: true
}, {
  l: 'ArrowLeft',
  r: 'ArrowUp',
  c: 'blue',
  ok: false
}, {
  l: 'y',
  r: 'x',
  c: 'green',
  ok: false
}, {
  l: 'l',
  r: 'o',
  c: 'yellow',
  ok: false
}];
var automate = [];
var detectPlayers = true;

function init() {
  console.log(screen);
  base = document.getElementById('layer1');
  layer = document.getElementById('layer2');
  info = document.getElementById('info');

  if (isTouchDevice()) {
    var back = document.getElementById('back');
    width -= 200;
    height -= 200;
    back.setAttribute('width', width);
    back.setAttribute('height', height);
    back.setAttribute('x', -width / 2);
    back.setAttribute('y', -height / 2);
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
  } else {
    document.addEventListener('click', onClick);
  }

  newGame();
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onTouchStart);
}

function newGame() {
  layer = clearElement(layer);
  curves = [];
  var players = 2;
  var control = 1;
  config.filter(function(ctrl, i) {
    return ctrl.ok
  }).forEach(function(ctrl, i) {
    curves.push(createCurve(layer, ctrl.c));
    if (i > control - 1) {
      automate.push(curves[i]);
    }
  })
  gameOver = false;
  paused = true;
  max = 0;
}

function hitsX(curve) {
  var y0 = height / 2;
  if (Math.sin(curve.heading) < 0) {
    y0 = -height / 2;
  }
  var x = (y0 - curve.head.y) / Math.tan(curve.heading) + curve.head.x
  if (x == "Infinity" || Math.abs(x) > width / 2) {
    var x0 = width / 2;
    if (Math.cos(curve.heading) < 0) {
      x0 = -width / 2;
    }
    var y = (x0 - curve.head.x) * Math.tan(curve.heading) + curve.head.y
    curve.hit.setAttribute('cx', x0);
    curve.hit.setAttribute('cy', y);
    return true;
  } else {
    curve.hit.setAttribute('cx', x);
    curve.hit.setAttribute('cy', y0);
    return false;
  }
}

function createCurve(parent, color) {
  var x = Math.floor(Math.random() * (width - 120)) - (width - 120) / 2;
  var y = Math.floor(Math.random() * (height - 120)) - (height - 120) / 2;
  var curve = {
    heading: Math.random() * Math.PI * 2,
    head: { x: x, y: y },
    tail: 'M ' + x + ',' + y,
    path: null,
    gap: false,
    points: [],
    len: 0,
    color: color,
    hit: createCircle(layer, 0, 0, deltaMove * 4, color),
    dist: { x: 0, y: 0 },
    chg: 0
  };
  // var curve = { heading: 0 * Math.PI / 2 + 0.1, head: { x: 0, y: 0 }, tail: 'M ' + 0 + ',' + 0, path: null, gap: false, points: [], len: 0, color: color, dist: { x: 0, y: 0 } };
  // var curve = { heading: Math.PI, head: { x: 0, y: 0 }, tail: 'M ' + 0 + ',' + 0, path: null, gap: false, points: [], len: 0 };
  curve.path = document.createElementNS(parent.namespaceURI, 'path');
  curve.path.setAttribute('stroke', color);
  curve.path.setAttribute('fill', 'none');
  curve.path.setAttribute('stroke-width', '3px');
  // curve.path.setAttribute('filter', 'url(#glow)');
  curve.path.setAttribute('d', curve.tail + ' L ' + curve.head.x + ',' + curve.head.y);
  parent.appendChild(curve.path);
  return curve
}

function onClick(evt) {
  evt.preventDefault();
  base = clearElement(base);
  var p = cursorPoint(evt.clientX, evt.clientY);
  // if (Math.abs(p.x) > width / 2 + 25 || Math.abs(p.y) > height / 2 + 25) {
  createCircle(base, p.x - 25, p.y - 25, 50, 'red').setAttribute('stroke', 'white');
  // }
}

function onTouchEnd(evt) {
  base = clearElement(base);
}

function onTouchStart(evt) {
  evt.preventDefault();
  // console.log(evt);
  for (var t = 0; t < evt.changedTouches.length; t++) {
    var touch = evt.changedTouches[t];
    // console.log(touch);
    var p = cursorPoint(touch.clientX, touch.clientY);
    // if (Math.abs(p.x) > width / 2 + 25 || Math.abs(p.y) > height / 2 + 25) {
    createCircle(base, p.x - 25, p.y - 25, 50, 'red').setAttribute('stroke', 'white');
    // }
  }
}

function onKeyUp(evt) {
  keyPressed[evt.key] = false;
}

function onKeyDown(evt) {
  if (evt.key == ' ') {
    paused = !paused;
    if (gameOver) {
      newGame();
    }
    if (!paused) {
      animate();
    }
    evt.preventDefault();
  } else {
    keyPressed[evt.key] = true;
  }
}

function resetStep(curve) {
  curve.tail += ' M ' + Math.round(curve.head.x) + ',' + Math.round(curve.head.y)
  curve.gap = false;
}

var beg = 0;

function animate() {
  // info.innerHTML = new Date().getTime() - beg;
  beg = new Date().getTime();
  if (keyPressed['ArrowLeft']) {
    if (!curves[0].gap) {
      curves[0].tail += ' L ' + Math.round(curves[0].head.x) + ',' + Math.round(curves[0].head.y)
    }
    curves[0].heading -= deltaHeading;
  }
  if (keyPressed['ArrowUp']) {
    if (!curves[0].gap) {
      curves[0].tail += ' L ' + Math.round(curves[0].head.x) + ',' + Math.round(curves[0].head.y)
    }
    curves[0].heading += deltaHeading;
  }

  if (keyPressed['1']) {
    if (!curves[1].gap) {
      curves[1].tail += ' L ' + Math.round(curves[1].head.x) + ',' + Math.round(curves[1].head.y)
    }
    curves[1].heading -= deltaHeading;
  }
  if (keyPressed['q']) {
    if (!curves[1].gap) {
      curves[1].tail += ' L ' + Math.round(curves[1].head.x) + ',' + Math.round(curves[1].head.y)
    }
    curves[1].heading += deltaHeading;
  }

  automate.forEach(function(curve) {
    // var chkX = hitsX(curve);
    // if (chkX && width / 2 - Math.abs(curve.head.x) < 100) {
    //   if (Math.sign(Math.sin(curve.heading)) == Math.sign(Math.cos(curve.heading))) {
    //     console.log("X+");
    //     curve.heading += deltaHeading;
    //   } else {
    //     console.log("X-");
    //     curve.heading -= deltaHeading;
    //   }
    // }
    // if (!chkX && height / 2 - Math.abs(curve.head.y) < 100) {
    //   if (Math.sign(Math.sin(curve.heading)) == Math.sign(Math.cos(curve.heading))) {
    //     console.log("Y+");
    //     curve.heading += deltaHeading;
    //   } else {
    //     console.log("Y-");
    //     curve.heading -= deltaHeading;
    //   }
    // }
    // if (!curve.gap) {
    //   curve.tail += ' L ' + Math.round(curve.head.x) + ',' + Math.round(curve.head.y)
    // }

    var chkX = hitsX(curve);
    var dist = { x: width / 2 - Math.abs(curve.head.x), y: height / 2 - Math.abs(curve.head.y) };
    if (dist.x < 100 || dist.y < 100) {
      if (!curve.gap) {
        curve.tail += ' L ' + Math.round(curve.head.x) + ',' + Math.round(curve.head.y)
      }
      if (dist.x < 300 && dist.x < curve.dist.x || dist.y < 300 && dist.y < curve.dist.y) {
        curve.heading += curve.chg;
      } else {
        if (chkX) {
          if (Math.sign(Math.sin(curve.heading)) == Math.sign(Math.cos(curve.heading))) {
            curve.chg = deltaHeading;
          } else {
            curve.chg = -deltaHeading;
          }
        } else {
          if (Math.sign(Math.sin(curve.heading)) == Math.sign(Math.cos(curve.heading))) {
            curve.chg = -deltaHeading;
          } else {
            curve.chg = deltaHeading;
          }
        }
      }
      curve.dist = { x: dist.x, y: dist.y }
    } else {
      curve.dist = { x: 0, y: 0 }
    }
  });

  curves.some(function(curve) {
    if (!curve.gap && Math.random() < 0.02) {
      curve.tail += ' L ' + Math.round(curve.head.x) + ',' + Math.round(curve.head.y)
      curve.gap = true;
      setTimeout(resetStep, 80, curve)
    }
    curve.head.x += deltaMove * Math.cos(curve.heading);
    curve.head.y += deltaMove * Math.sin(curve.heading);
    if (!curve.gap) {
      curve.path.setAttribute('d', curve.tail + ' L ' + Math.round(curve.head.x) + ',' + Math.round(curve.head.y));
      curveToPoints(curve, deltaMove);
    }
    hitsX(curve);
    if (Math.abs(curve.head.x) > width / 2 || Math.abs(curve.head.y) > height / 2) {
      createCircle(layer, curve.head.x - deltaMove * 2, curve.head.y - deltaMove * 2, deltaMove * 4, curve.color).setAttribute('stroke', 'white');
      gameOver = true;
      // showPoints(curve.points);
      return true;
    }
    return false;
  });

  if (!gameOver) {
    curves.some(function(curve1) {
      return curves.some(function(curve2) {
        if (intersect(curve1.points.slice(-1), curve1.color, curve2.points)) {
          // showPoints(curve1.points);
          gameOver = true;
          return true;
        } else {
          return false;
        }
      });
    });
  }

  if (!gameOver && !paused) {
    requestAnimationFrame(animate);
  }
}

function intersect(pts1, color, pts2) {
  return pts1.some(function(p1, i1) {
    return pts2.some(function(p2, i2) {
    if (i2 > 4 && p1 != p2 && Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)) < deltaMove - 1) {
      createCircle(layer, p1.x - deltaMove, p1.y - deltaMove, deltaMove * 2, color).setAttribute('stroke', 'white');
      return true;
    } else {
      return false;
    }
    })
  })
}

// Berechnet Punkte auf einem Pfad nur für die zusätzliche Länge: Schneller
function curveToPoints(curve, step) {
  var len = curve.path.getTotalLength();
  var num = Math.floor(len / step);
  // info.innerHTML = (num - curve.points.length);
  for (var i = curve.points.length; i <= num; i++) {
    curve.points.push(curve.path.getPointAtLength(curve.len + i * step));
  }
  return curve.points;
}

// Berechnet Punkte auf einem Pfad
function svgPathToPoints(path, step) {
  var len = path.getTotalLength();
  var num = len / step;
  var points = [];
  for (var i = 0; i <= num; i++) {
    points.push(path.getPointAtLength(i * step));
  }
  return points;
}

function showPoints(points) {
  points.forEach(function(pt) {
    createCircle(layer, pt.x - 1, pt.y - 1, 2, 'white');
  });
}

function clearElement(elem) {
  var copy = elem.cloneNode(false);
  elem.parentNode.replaceChild(copy, elem);
  return copy;
}

function createCircle(parent, x, y, size, color) {
  var circle = document.createElementNS(parent.namespaceURI, 'circle');
  circle.setAttribute('r', size / 2);
  circle.setAttribute('cx', x + size / 2);
  circle.setAttribute('cy', y + size / 2);
  circle.setAttribute('fill', color);
  parent.appendChild(circle);
  return circle;
}

function rad2Deg(rad) {
  return rad * (180 / Math.PI);
}

function deg2Rad(deg) {
  return deg * (Math.PI / 180);
}

var pt, matrix;

function initMatrix() {
  var svg = document.getElementById('svg');
  pt = svg.createSVGPoint();
  matrix = svg.getScreenCTM().inverse();
}

function cursorPoint(x, y) {
  if (!pt) {
    initMatrix();
  }
  pt.x = x;
  pt.y = y;
  return pt.matrixTransform(matrix);
}

function isTouchDevice() {
  var prefixes = '-webkit- -moz- -o- -ms-'.split(' ');
  var mq = function(query) {
    return window.matchMedia(query).matches;
  }

  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    return true;
  }

  // include the 'heartz' as a way to have a non matching MQ to help terminate the join
  var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
  // return true;
  return mq(query);
}

console.log(isTouchDevice());
