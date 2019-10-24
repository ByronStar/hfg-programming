var game;
var ball;
var ballPos = {};

let position = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = '1c53299f-f90d-4cc3-a7e4-21bb37749c2f';
  game.name = "Bennos Game";
  console.log(game);

  ball = document.getElementById("ball");
  window.addEventListener('keydown', onKeyDown);

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', onMotion);
    alert("MOTION");
    //setTimeout(stop, 500);
    setInterval(onMotion, 40, move);
  }
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

function onMotion(evt) {
  velocity.x *= 0.9;
  if (Math.abs(velocity.x) < 1) {
    velocity.x = 0;
  }
  velocity.y *= 0.9;
  if (Math.abs(velocity.y) < 1) {
    velocity.y = 0;
  }
  if (Math.abs(evt.acceleration.x) > 1) {
    velocity.x += evt.acceleration.x;
  }
  if (Math.abs(evt.acceleration.y) > 1) {
    velocity.y += evt.acceleration.y;
  }

  position.x += velocity.x;
  position.y += velocity.y;
  center.setAttribute('cx', position.x);
  center.setAttribute('cy', position.y);

  max.x = Math.max(max.x, Math.abs(evt.acceleration.x))
  max.y = Math.max(max.y, Math.abs(evt.acceleration.y))

  // infos[0].innerHTML = evt.acceleration.x;
  // infos[1].innerHTML = evt.acceleration.y;
  // infos[2].innerHTML = max.x;
  // infos[3].innerHTML = max.y;

  // if (evt.interval != 1) {
  //   console.log(position, velocity, evt.acceleration.x, evt.acceleration.y, evt.interval);
  // }
  // evt.acceleration
  // evt.accelerationIncludingGravity
  // evt.rotationRate
  // evt.interval
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
