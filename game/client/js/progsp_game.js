var game;
var ball;

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = 0;
  game.name = "Demo";
  console.log(game);

  ball = document.getElementById("ball");
  window.addEventListener('keydown', onKeyDown);
}

function onKeyDown(evt) {
  switch (evt.key) {
    case 'ArrowLeft':
      if (game.ready && game.id == game.me.group[0]) {
        game.move({ id: 'L' });
      }
      evt.preventDefault();
      break;
    case 'ArrowRight':
      if (game.ready && game.id == game.me.group[0]) {
        game.move({ id: 'R' });
      }
      evt.preventDefault();
      break;
    case 'ArrowUp':
      if (game.ready && game.id == game.me.group[1]) {
        game.move({ id: 'U' });
      }
      evt.preventDefault();
      break;
    case 'ArrowDown':
      if (game.ready && game.id == game.me.group[1]) {
        game.move({ id: 'D' });
      }
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
