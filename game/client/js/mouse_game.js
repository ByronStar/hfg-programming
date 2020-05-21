var game, ball, curve, shape;
var isDown = false;
var points = [];
var curveD = ''
var ballPos = { x: 0, y: 0 }

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = 0;
  game.name = "Mouse Tracker";

  ball = document.getElementById("ball");
  curve = document.getElementById("curve");
  shape = document.getElementById("shape");
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseDown(evt) {
  isDown = true;
  points = [];
  curveD = '';
}

function onMouseUp(evt) {
  findShape();
  isDown = false;
}

function onMouseMove(evt) {
  let pt = game.svgPoint(evt);
  ballPos.x = pt.x;
  ballPos.y = pt.y;
  ball.setAttribute('cx', ballPos.x);
  ball.setAttribute('cy', ballPos.y);

  if (isDown) {
    points.push({ x: ballPos.x, y: ballPos.y });
    curveD += ('' == curveD ? ' M ' : ' L ') + Math.round(ballPos.x) + ',' + Math.round(ballPos.y);
    curve.setAttribute('d', curveD);
  }
}

function onMove(move) {}

// Here the magic happens
function findShape() {
  var shapePts = points; // <= definitiv der falsche Ansatz !!!
  var d = '';
  shapePts.forEach(pt => {
    d += ('' == d ? ' M ' : ' L ') + Math.round(pt.x) + ',' + Math.round(pt.y);
  })
  shape.setAttribute('d', d);
}
