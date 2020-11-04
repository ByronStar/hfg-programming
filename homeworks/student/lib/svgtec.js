var SvgTec = {};
(function() {
  let stars = []
  let line = { elem: null, attrs: { x1: 0, y1: 0, x2: 0, y2: 0 } }
  let starColor = ["#f0ff21", "#d4dd85", "#c5ba00", "#8f9f2d", "#ffe970"]

  this.init = function() {
    SvgTec.initPoint()
    // line.elem = SvgTec.createElement(layer, 'line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: '#FF00FF' })
    // document.addEventListener('mousedown', SvgTec.onFoldMouseDown)
  }

  this.addSpark = function(pt) {
    star = { x: pt.x, y: pt.y, dx: 4 * Math.random() - 2.0, dy: 4 * Math.random() - 2.0, s: Math.random(), e: null }
    star.e = createStar(star.x, star.y, 10, 20, star.s);
    stars.push(star)
  }

  function createStar(x, y, r1, r2, s) {
    let step = 2 * Math.PI / 5;
    let d = 'M'
    for (var a = 0; a < 2 * Math.PI; a += step) {
      d += r1 * Math.sin(a) + ',' + r1 * Math.cos(a) + ' '
      d += r2 * Math.sin(a + step / 2) + ',' + r2 * Math.cos(a + step / 2) + ' '
    }
    let g = SvgTec.createElement(document.getElementById('layer2'), 'g', { transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')' })
    SvgTec.createElement(g, 'path', { d: d, fill: starColor[Math.floor(5 * Math.random())] })
    return g
  }

  this.sparkle = function(decay) {
    decay = decay || 0.01
    stars = stars.filter(star => {
      if (star.s > 0) {
        return true
      }
      star.e.parentNode.removeChild(star.e)
      return false
    })
    stars.forEach((star, i) => {
      star.x += star.dx
      star.y += star.dy
      star.s -= decay
      star.e.setAttribute('transform', 'translate(' + star.x + ' ' + star.y + ') scale(' + star.s + ')')
    });
  }

  this.onFoldMouseDown = function(evt) {
    document.addEventListener('mousemove', SvgTec.onFoldMouseMove);
    document.addEventListener('mouseup', SvgTec.onFoldMouseUp);
    let pt = SvgTec.svgPoint(evt);
    line.attrs.x1 = pt.x
    line.attrs.y1 = pt.y
    line.attrs.x2 = pt.x
    line.attrs.y2 = pt.y
    SvgTec.setAttributes(line.elem, line.attrs)
  }

  this.onFoldMouseMove = function(evt) {
    let pt = SvgTec.svgPoint(evt);
    line.attrs.x2 = pt.x
    line.attrs.y2 = pt.y
    SvgTec.setAttributes(line.elem, line.attrs)
  }

  this.onFoldMouseUp = function(evt) {
    document.removeEventListener('mousemove', SvgTec.onFoldMouseMove);
    document.removeEventListener('mouseup', SvgTec.onFoldMouseUp);
    let pt = SvgTec.svgPoint(evt);
    line.attrs.x2 = pt.x
    line.attrs.y2 = pt.y
    SvgTec.setAttributes(line.elem, line.attrs)
    SvgTec.foldAt(SvgTec.intersectAt(250, line.attrs), SvgTec.intersectAt(-250, line.attrs))
    // game.move({ id: 'TEXT', text: input.children[0].value, round: round + 1 })
  }

  this.foldAt = function(y1, y2) {
    // m = dy/dx = Math.tan(a)
    // a = Math.atan(dy/dx)
    // r = a * Math.PI / 180, a = r * 180 / Math.PI
    let a = Math.atan((y1 - y2) / 500) * 180 / Math.PI;
    let t = -(y1 + y2) / 2

    SvgTec.createElement(layer, 'polygon', { points: '-250,-350 250,-350 250,' + y1 + ' -250,' + y2 + '', fill: '#0000FF', transform: 'translate(0.0 ' + -t + ') rotate(' + a + ') scale(1.0 -1.0) rotate(' + -a + ') translate(0.0 ' + t + ')' })
    // SvgTec.createElement(layer, 'polygon', { points: '-250,-350 250,-350 250,' + y1 + ' -250,' + y2 + '', fill: '#FF0000' })
  }

  this.intersectAt = function(x, pts) {
    let m = (pts.y2 - pts.y1) / (pts.x2 - pts.x1)
    return y = m * (x - pts.x1) + pts.y1
  }

  this.simplifyPath = function(points, tolerance) {
    var Line = function(p1, p2) {
      this.p1 = p1;
      this.p2 = p2;

      this.distanceToPoint = function(point) {
        // slope
        var m = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x),
          // y offset
          b = this.p1.y - (m * this.p1.x),
          d = [];
        // distance to the linear equation
        d.push(Math.abs(point.y - (m * point.x) - b) / Math.sqrt(Math.pow(m, 2) + 1));
        // distance to p1
        d.push(Math.sqrt(Math.pow((point.x - this.p1.x), 2) + Math.pow((point.y - this.p1.y), 2)));
        // distance to p2
        d.push(Math.sqrt(Math.pow((point.x - this.p2.x), 2) + Math.pow((point.y - this.p2.y), 2)));
        // return the smallest distance
        return d.sort(function(a, b) {
          return (a - b); //causes an array to be sorted numerically and ascending
        })[0];
      }
    }

    var douglasPeucker = function(points, tolerance) {
      if (points.length <= 2) {
        return [points[0]];
      }
      var returnPoints = [],
        // make line from start to end
        line = new Line(points[0], points[points.length - 1]),
        // find the largest distance from intermediate poitns to this line
        maxDistance = 0,
        maxDistanceIndex = 0,
        p;
      for (var i = 1; i <= points.length - 2; i++) {
        var distance = line.distanceToPoint(points[i]);
        if (distance > maxDistance) {
          maxDistance = distance;
          maxDistanceIndex = i;
        }
      }
      // check if the max distance is greater than our tollerance allows
      if (maxDistance >= tolerance) {
        p = points[maxDistanceIndex];
        line.distanceToPoint(p, true);
        // include this point in the output
        returnPoints = returnPoints.concat(douglasPeucker(points.slice(0, maxDistanceIndex + 1), tolerance));
        // returnPoints.push( points[maxDistanceIndex] );
        returnPoints = returnPoints.concat(douglasPeucker(points.slice(maxDistanceIndex, points.length), tolerance));
      } else {
        // ditching this point
        p = points[maxDistanceIndex];
        line.distanceToPoint(p, true);
        returnPoints = [points[0]];
      }
      return returnPoints;
    }
    var arr = douglasPeucker(points, tolerance);
    // always have to push the very last point on so it doesn't get left off
    arr.push(points[points.length - 1]);
    return arr;
  }

  this.svg2path = function(svgElem) {
  // get all g nodes of the svg
  var gNodes = svgElem.getElementsByTagName('g');
//	console.log(svgElem.childNodes.length, gNodes.length);
  // number of polygons
  var polyCnt = 0;
  // store all polygons to be animated
  var polys = Array();
  // store all animations
  var animates = Array();
  // stores animation seq
  var seq = Array();
  // process g nodes
  for (var g = 0; g < gNodes.length; g++) {
    // console.log(gNodes[g].nodeName, gNodes[g].namespaceURI);
    // process elements
    for (var e = 0; e < gNodes[g].childNodes.length; e++) {
      var elem = gNodes[g].childNodes[e];
      var pathAttr = "";
      var exclude = {};
      switch (elem.nodeName.toLowerCase()) {
        case 'path':
          pathAttr = elem.getAttribute('d');
          exclude = {'d': 1};
          break;
        case 'circle':
          exclude = {'cx': 1, 'cy': 1, 'r': 1};
          var cx = +elem.getAttribute('cx'), cy = +elem.getAttribute('cy'), r = +elem.getAttribute('r');
          pathAttr = 'M' + (cx - r) + ',' + cy + 'a' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0a' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0z';
          break;
        case 'ellipse':
          exclude = {'cx': 1, 'cy': 1, 'rx': 1, 'ry': 1};
          var cx = +elem.getAttribute('cx'), cy = +elem.getAttribute('cy'), rx = +elem.getAttribute('rx'), ry = +elem.getAttribute('ry');
          pathAttr = 'M' + (cx - rx) + ',' + cy + 'a' + rx + ',' + ry + ' 0 1,0 ' + (rx * 2) + ',0a' + rx + ',' + ry + ' 0 1,0 -' + (rx * 2) + ',0z';
          break;
        case 'rect':
          exclude = {'x': 1, 'y': 1, 'width': 1, 'height': 1, 'rx': 1, 'ry': 1};
          var x = +elem.getAttribute('x'), y = +elem.getAttribute('y'), w = +elem.getAttribute('width'), h = +elem.getAttribute('height'), rx = +elem.getAttribute('rx'), ry = +elem.getAttribute('ry');
          if (!rx && !ry) {
            pathAttr = 'M' + x + ',' + y + 'l' + w + ',0l0,' + h + 'l-' + w + ',0z';
          } else {
            pathAttr = 'M' + (x + rx) + ',' + y + 'l' + (w - rx * 2) + ',0' + 'a' + rx + ',' + ry + ' 0 0,1 ' + rx + ',' + ry + 'l0,' + (h - ry * 2) + 'a' + rx + ',' + ry + ' 0 0,1 -' + rx + ',' + ry + 'l' + (rx * 2 - w) + ',0' + 'a' + rx + ',' + ry + ' 0 0,1 -' + rx + ',-' + ry + 'l0,' + (ry * 2 - h) + 'a' + rx + ',' + ry + ' 0 0,1 ' + rx + ',-' + ry + 'z';
          }
          break;
        case 'polygon':
          exclude = {'points': 1};
          var points = elem.getAttribute('points').split(/\s+|,/);
          var x0 = points.shift(), y0 = points.shift();
          var pathAttr = 'M' + x0 + ',' + y0 + 'L' + points.join(' ');
          pathAttr += 'z';
          break;
        case 'line':
          exclude = {'x1': 1, 'y1': 1, 'x2': 1, 'y2': 1};
          var x1 = +elem.getAttribute('x1'), y1 = +elem.getAttribute('y1'), x2 = +elem.getAttribute('x2'), y2 = +elem.getAttribute('y2');
          pathAttr = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + 'z';
          break;
        default:
//				console.log(gNodes[g].childNodes[e]);
          break;
      }
      if (pathAttr != "") {
        var path = document.createElementNS(elem.namespaceURI, 'path');
        path.setAttribute('d', pathAttr);
        polys[polyCnt] = document.createElementNS(path.namespaceURI, 'polygon');
        animates[polyCnt] = document.createElementNS(path.namespaceURI, 'animate');
        animates[polyCnt].setAttribute('id', 'a' + polyCnt);
        animates[polyCnt].setAttribute('attributeName', 'points');
        animates[polyCnt].setAttribute('dur', '2.0s');
        animates[polyCnt].setAttribute('fill', 'freeze');
        for (var i = 0, attrs = elem.attributes, l = attrs.length; i < l; i++) {
          if (!exclude[attrs[i].name]) {
            polys[polyCnt].setAttribute(attrs[i].name, attrs[i].value);
          }
        }
        polys[polyCnt].setAttribute('points', svgPathToPoints(path, 40));
        gNodes[g].replaceChild(polys[polyCnt], elem);
        seq[polyCnt] = polyCnt;
//				console.log(elem.id, elem.nodeName.toLowerCase());
        polyCnt++;
      }
    }
  }
  shuffle(seq);
//	console.log(seq);
  animates[seq[0]].setAttribute('begin', 'indefinite');
  for (var p = 0; p < polys.length; p++) {
    animates[seq[p]].setAttribute('to', polys[seq[(p + 1) % polys.length]].getAttribute('points'));
    polys[seq[p]].appendChild(animates[seq[p]]);
    animates[seq[(p + 1) % polys.length]].setAttribute('begin', animates[seq[p]].id + ".begin +0.25s");
  }
  animates[seq[0]].setAttribute('begin', 'back.click');
  return animates[seq[0]];
}

//Fisher-Yates
function shuffle(o) {
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function svgPathToPoints(path, num) {
  var len = path.getTotalLength();
  var step = len / num;
  var points = "";
  for (var i = 0; i < num; i++) {
    p = path.getPointAtLength(i * step);
    points += p.x + "," + p.y + " ";
  }
//  var pts = points.split(/\s+/);
//	console.log(path.getTotalLength(), pts.length);
  return points;
}

  this.initPoint = function() {
    let svg = document.getElementById('svg')
    pt = svg.createSVGPoint()
    matrix = svg.getScreenCTM().inverse()
  }

  // Get point in global SVG space
  this.svgPoint = function(evt) {
    pt.x = evt.clientX
    pt.y = evt.clientY
    return pt.matrixTransform(matrix)
  }

  this.cloneElement = function(parent, elem, attrList) {
    let clone = elem.cloneNode(true)
    let place = SvgTec.createElement(null, 'g', attrList)
    place.appendChild(clone)
    let wrap = SvgTec.createElement(parent, 'g', {})
    wrap.appendChild(place)
    return wrap
  }

  this.setAttributes = function(elem, attrList) {
    for (attr in attrList) {
      elem.setAttribute(attr, attrList[attr])
    }
  }

  this.createElement = function(parent, type, attrList) {
    let elem = document.createElementNS(parent.namespaceURI, type)
    SvgTec.setAttributes(elem, attrList)
    if (parent) {
      parent.appendChild(elem)
    }
    return elem
  }
}).apply(SvgTec)
document.addEventListener("DOMContentLoaded", function() {
  SvgTec.init()
})
