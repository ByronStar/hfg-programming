var game;
var ball;
var ballPos = {};

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = 0;
  game.name = "Demo";
  console.log(game);

  ball = document.getElementById("ball");
  ballPos.x = +ball.getAttribute('cx');
  ballPos.y = +ball.getAttribute('cy');
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('click', onMouseClick);
}

function onKeyDown(evt) {
  switch (evt.key) {
    case 'ArrowLeft':
      if (game.isPlayer(0)) {
        game.move({ id: 'L' });
      }
      break;
    case 'ArrowRight':
      if (game.isPlayer(0)) {
        game.move({ id: 'R' });
      }
      break;
    case 'ArrowUp':
      if (game.isPlayer(1)) {
        game.move({ id: 'U' });
      }
      break;
    case 'ArrowDown':
      if (game.isPlayer(1)) {
        game.move({ id: 'D' });
      }
      break;
    default:
      // console.log(evt.key);
  }
}

function onMouseClick(evt) {
  let pos = svgPoint(evt);
  pos.x -= ballPos.x;
  pos.y -= ballPos.y;
  if (pos.x < 0 && game.isPlayer(0)) {
    game.move({ id: 'L' });
  }
  if (pos.x > 0 && game.isPlayer(0)) {
    game.move({ id: 'R' });
  }
  if (pos.y < 0 && game.isPlayer(1)) {
    game.move({ id: 'U' });
  }
  if (pos.y > 0 && game.isPlayer(1)) {
    game.move({ id: 'D' });
  }
}

function onMove(move) {
  switch (move.id) {
    case 'L':
      ballPos.x -= 5;
      break;
    case 'R':
      ballPos.x += 5;
      break;
    case 'U':
      ballPos.y -= 5;
      break;
    case 'D':
      ballPos.y += 5;
      break;
    case 'EXIT':
      ballPos.x = 0;
      ballPos.y = 0;
      break;
    default:
      console.log(move);
  }
  ball.setAttribute('cx', ballPos.x);
  ball.setAttribute('cy', ballPos.y);
}
