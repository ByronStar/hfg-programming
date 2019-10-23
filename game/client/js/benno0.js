var game;
var ball;

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = '1c53299f-f90d-4cc3-a7e4-21bb37749c2f';
  game.name = "Bennos Game X";
  console.log(game);

  ball = document.getElementById("ball");
  window.addEventListener('keydown', onKeyDown);
}

function onKeyDown(evt) {
  switch (evt.key) {
    case 'ArrowLeft':
      game.move({ id: 'L' });
      evt.preventDefault();
      break;
    case 'ArrowRight':
      game.move({ id: 'R' });
      evt.preventDefault();
      break;
    case 'ArrowUp':
      game.move({ id: 'U' });
      evt.preventDefault();
      break;
    case 'ArrowDown':
      game.move({ id: 'D' });
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
