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
var gameOver = true;
var width = 1920;
var height = 1200;
var info, scores;
var config = [{
  p: 1, c: 'red', k: { l: '1', r: 'q' }, t: { l: '1', r: 'Q' }, s: { l: false, r: false }
}, {
  p: 2, c: 'blue', k: { l: 'ArrowLeft', r: 'ArrowUp' }, t: { l: '◀︎', r: '▲' }, s: { l: false, r: false }
}, {
  p: 3, c: 'green', k: { l: 'y', r: 'x' }, t: { l: 'Y', r: 'X' }, s: { l: false, r: false }
}, {
  p: 4, c: 'yellow', k: { l: 'l', r: 'o' }, t: { l: 'L', r: 'O' }, s: { l: false, r: false }
}];
var keyMap = {};
var verb = ' drücken';
var touchSpace;
var automate = [];
var detectPlayers = true;

function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js');
  }
  base = document.getElementById('base');
  layer = document.getElementById('curves');
  info = document.getElementById('info');

  width = window.innerWidth;
  height = window.innerHeight;
  // width = screen.width;
  // height = screen.height;
  console.log(screen);
  document.getElementById('svg').setAttribute('viewBox', '-' + width / 2 + ' -' + height / 2 + ' ' + width + ' ' + height);

  if (isTouchDevice()) {
    document.getElementById('keyboard').style.display = 'none';
    setupTouch();
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
  } else {
    document.getElementById('touch').style.display = 'none';
    scores = document.getElementById('scores0');
    // setupTouch();
    // document.addEventListener('mousedown', onMouseDown);
    // document.addEventListener('mouseup', onMouseUp);
  }

  if (detectPlayers) {
    config.forEach(function(cfg, i) {
      keyMap[cfg.k.l] = cfg
      keyMap[cfg.k.r] = cfg
    })
  }
  // newGame();
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('keydown', onKeyDown);
}

function setupTouch() {
  scores = document.getElementById('scores1');
  touchSpace = document.getElementById('touchSpace');
  touchSpace.style.display = 'block';

  verb = ' berühren';
  createElement(base, 'rect', { x: -width / 2 + 100, y: -height / 2, width: width / 2 - 200, height: 100, fill: 'rgba(255,0,0,0.3)', stroke: 'white'});
  createElement(base, 'rect', { x: -width / 2, y: -height / 2 + 100, width: 100, height: height / 2 - 200, fill: 'rgba(255,0,0,0.3)', stroke: 'magenta'});
  createElement(base, 'rect', { x: -width / 2 + 100, y: height / 2 - 100, width: width / 2 - 200, height: 100, fill: 'rgba(0,255,0,0.3)', stroke: 'white'});
  createElement(base, 'rect', { x: -width / 2, y: 100, width: 100, height: height / 2 - 200, fill: 'rgba(0,255,0,0.3)', stroke: 'magenta'});
  createElement(base, 'rect', { x: 100, y: height / 2 - 100, width: width / 2 - 200, height: 100, fill: 'rgba(255,255,0,0.3)', stroke: 'white'});
  createElement(base, 'rect', { x: width / 2 - 100, y: 100, width: 100, height: height / 2 - 200, fill: 'rgba(255,255,0,0.3)', stroke: 'magenta'});
  createElement(base, 'rect', { x: 100, y: -height / 2, width: width / 2 - 200, height: 100, fill: 'rgba(0,0,255,0.3)', stroke: 'white'});
  createElement(base, 'rect', { x: width / 2 - 100, y: -height / 2 + 100, width: 100, height: height / 2 - 200, fill: 'rgba(0,0,255,0.3)', stroke: 'magenta'});

  config[0].t.l = '<div class="box" style="background-color: rgba(255,0,0,0.3);border-color: white;"></div>'
  config[0].t.r = '<div class="box" style="background-color: rgba(255,0,0,0.3);border-color: magenta;"></div>'
  config[1].t.l = '<div class="box" style="background-color: rgba(0,0,255,0.3);border-color: white;"></div>'
  config[1].t.r = '<div class="box" style="background-color: rgba(0,0,255,0.3);border-color: magenta;"></div>'
  config[2].t.l = '<div class="box" style="background-color: rgba(0,255,0,0.3);border-color: white;"></div>'
  config[2].t.r = '<div class="box" style="background-color: rgba(0,255,0,0.3);border-color: magenta;"></div>'
  config[3].t.l = '<div class="box" style="background-color: rgba(255,255,0,0.3);border-color: white;"></div>'
  config[3].t.r = '<div class="box" style="background-color: rgba(255,255,0,0.3);border-color: magenta;"></div>'
}

function newGame() {
  layer = clearElement(layer);
  curves = [];
  var players = 2;
  var control = 1;
  config.filter(function(cfg, i) {
    return cfg.s.l && cfg.s.r
  }).forEach(function(cfg, i) {
    cfg.i = i;
    curves.push(createCurve(layer, cfg.c));
    if (i > control - 1) {
      automate.push(curves[i]);
    }
  })
  if (curves.length > 0) {
    info.style.display = 'none';
    if (touchSpace) {
      touchSpace.style.display = 'none'
    }
    base = clearElement(base);
    detectPlayers = false;
    gameOver = false;
    paused = false;
    max = 0;
  }
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
    hit: createElement(layer, 'circle', { cx: 0, cy: 0, r: deltaMove * 2, fill: color}),
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

function onMouseDown(evt) {
  evt.preventDefault();
  if (evt.target == touchSpace) {
    paused = !paused;
    if (gameOver) {
      newGame();
    }
    if (!paused) {
      animate();
    }
  } else {
    processKey(keyFromPoint(cursorPoint(evt.clientX, evt.clientY), true));
  }
}

function onMouseUp(evt) {
  keyPressed[keyFromPoint(cursorPoint(evt.clientX, evt.clientY), false)] = false;
}

function onTouchStart(evt) {
  evt.preventDefault();
  for (var t = 0; t < evt.changedTouches.length; t++) {
    var touch = evt.changedTouches[t];
    if (evt.target == touchSpace) {
      paused = !paused;
      if (gameOver) {
        newGame();
      }
      if (!paused) {
        animate();
      }
    } else {
      processKey(keyFromPoint(cursorPoint(touch.clientX, touch.clientY), true));
    }
  }
}

function onTouchEnd(evt) {
  evt.preventDefault();
  for (var t = 0; t < evt.changedTouches.length; t++) {
    var touch = evt.changedTouches[t];
    if (evt.target != touchSpace) {
      keyPressed[keyFromPoint(cursorPoint(touch.clientX, touch.clientY), false)] = false;
    }
  }
}

var touches = {};

function keyFromPoint(pt, isStart) {
  var d = {x: width / 2 - Math.abs(pt.x), y: height / 2 - Math.abs(pt.y)};
  // info.innerHTML = d.x + ", " + d.y;
  if (d.x < 100 && d.y > 100 && d.y < height / 2 - 100 || d.y < 100 && d.x > 100 && d.x < width / 2 - 100) {
    var p = (pt.x < 0 ? 0 : 1) + (pt.y < 0 ? 0 : 2);
    var key = d.x > d.y ? config[p].k.l : config[p].k.r;
    if (isStart) {
      touches[key] = createElement(base, 'circle', { cx: pt.x, cy: pt.y, r: 25, fill: config[p].c, stroke: d.x > d.y ? 'white' : 'magenta' });
    } else {
      touches[key].parentNode.removeChild(touches[key]);
      delete touches[key];
    }
    return key;
  }
  return null;
}

function processKey(key) {
  if (key) {
    if (detectPlayers) {
      if (keyMap[key]) {
        cfg = keyMap[key];
        if (cfg.k.l == key) {
          cfg.s.l = true;
        } else {
          cfg.s.r = true;
        }
        scores.rows[cfg.p].cells[5].innerHTML = (cfg.s.l ? '' : cfg.t.l) + (cfg.s.l || cfg.s.r ? '' : ' und ') + (cfg.s.r ? '' : cfg.t.r) + (cfg.s.l && cfg.s.r ? 'ok' : verb)
      }
    } else {
      keyPressed[key] = true;
    }
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
    processKey(evt.key);
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

  for (key in keyMap) {
    var cfg = keyMap[key];
    // console.log(key, cfg.k.l)
    if (keyPressed[key] && cfg.s.l && cfg.s.r) {
      if (!curves[cfg.i].gap) {
        curves[cfg.i].tail += ' L ' + Math.round(curves[cfg.i].head.x) + ',' + Math.round(curves[cfg.i].head.y)
      }
      curves[cfg.i].heading += (key == cfg.k.l ? -deltaHeading : deltaHeading);
    }
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
      createElement(layer, 'circle', { cx: curve.head.x - deltaMove, cy: curve.head.y - deltaMove, r: deltaMove * 2, fill: curve.color, stroke: 'white'});
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

  if (!gameOver) {
    if (!paused) {
      requestAnimationFrame(animate);
    }
  } else {
    if (touchSpace) {
      touchSpace.style.display = 'block';
    }
  }
}

function intersect(pts1, color, pts2) {
  return pts1.some(function(p1, i1) {
    return pts2.some(function(p2, i2) {
      if (i2 > 4 && p1 != p2 && Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)) < deltaMove - 1) {
        createElement(layer, 'circle', { cx: p1.x, cy: p1.y, r: deltaMove, fill: color, stroke: 'white'});
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
    createElement(layer, 'circle', { cx: pt.x, cy: pt.y, r: 1, fill: 'white'});
  });
}

function clearElement(elem) {
  var copy = elem.cloneNode(false);
  elem.parentNode.replaceChild(copy, elem);
  return copy;
}

function createElement(parent, type, attrList) {
  var elem = document.createElementNS(parent.namespaceURI, type);
  parent.appendChild(elem);
  for (attr in attrList) {
    elem.setAttribute(attr, attrList[attr]);
  }
  return elem;
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
