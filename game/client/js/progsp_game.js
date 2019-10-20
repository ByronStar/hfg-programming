var game;
var ball;

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  console.log(game);

  ball = document.getElementById("ball");
  window.addEventListener('keydown', onKeyDown);
}

function onKeyDown(evt) {
  switch (evt.key) {
    case 'ArrowLeft':
      gc.move({ id: 'L' });
      evt.preventDefault();
      break;
    case 'ArrowRight':
      gc.move({ id: 'R' });
      evt.preventDefault();
      break;
    case 'ArrowUp':
      gc.move({ id: 'U' });
      evt.preventDefault();
      break;
    case 'ArrowDown':
      gc.move({ id: 'D' });
      evt.preventDefault();
      break;
    default:
      // console.log(evt.key);
  }
}

function onMove(move) {
  switch (move.id) {
    case 'L':
      ball.setAttribute('cx', +ball.getAttribute('cx') - 5)
      break;
    case 'R':
      ball.setAttribute('cx', +ball.getAttribute('cx') + 5)
      break;
    case 'U':
      ball.setAttribute('cy', +ball.getAttribute('cy') - 5)
      break;
    case 'D':
      ball.setAttribute('cy', +ball.getAttribute('cy') + 5)
      break;
    case 'EXIT':
      ball.setAttribute('cx', 0)
      ball.setAttribute('cy', 0)
      break;
    default:
      console.log(move);
  }
}

var svg, pt, matrix;

function initPoint() {
  svg = document.getElementById('svg');
  pt = svg.createSVGPoint();
  matrix = svg.getScreenCTM().inverse();
}

// Get point in global SVG space
function cursorPoint(evt) {
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(matrix);
}
