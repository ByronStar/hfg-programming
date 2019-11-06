var game;
var ball;
var ballPos = { x: 0, y: 0 };
let velocity = { x: 0, y: 0, z: 0 };
let time = 0;

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = 0;
  game.name = "Demo";
  console.log(game);

  ball = document.getElementById("ball");
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onMouseClick);
  if (location.protocol == 'https:') {
    if (window.DeviceOrientationEvent) {
      time = new Date().getTime();
      window.addEventListener('deviceorientation', onOrientation)
    }
    // if (window.DeviceMotionEvent) {
    //   time = new Date().getTime();
    //   window.addEventListener('devicemotion', onMotion);
    // }
  }
}

function onKeyDown(evt) {
  switch (evt.key) {
    case 'ArrowLeft':
        game.move({ id: 'L' });
      break;
    case 'ArrowRight':
        game.move({ id: 'R' });
      break;
    case 'ArrowUp':
        game.move({ id: 'U' });
      break;
    case 'ArrowDown':
        game.move({ id: 'D' });
      break;
    default:
      // console.log(evt.key);
  }
}

function onMouseClick(evt) {
  let pos = svgPoint(evt);
  pos.x -= ballPos.x;
  pos.y -= ballPos.y;
  if (pos.x < 0) {
    game.move({ id: 'L' });
  }
  if (pos.x > 0) {
    game.move({ id: 'R' });
  }
  if (pos.y < 0) {
    game.move({ id: 'U' });
  }
  if (pos.y > 0) {
    game.move({ id: 'D' });
  }
}

function onOrientation(evt) {
  // gear (z/alpha), nick (x/beta), roll(y/gamma)
  let delta = Math.round(new Date().getTime() - time);
  if (delta > 40) {
    time = new Date().getTime();
    document.getElementById("p2").innerHTML = delta + ": " + Math.round(evt.beta) + ", " + Math.round(evt.gamma) + ", " + Math.round(evt.alpha);
    if (evt.beta < -10) {
      game.move({ id: 'L' });
    }
    if (evt.beta > 10) {
      game.move({ id: 'R' });
    }
    if (evt.gamma < -10) {
      game.move({ id: 'D' });
    }
    if (evt.gamma > 10) {
      game.move({ id: 'U' });
    }
  }
}

function onMotion(evt) {
  // velocity.x *= 0.9;
  // velocity.y *= 0.9;
  // velocity.z *= 0.9;
  // if (Math.abs(velocity.x) < 1) {
  //   velocity.x = 0;
  // }
  // if (Math.abs(velocity.y) < 1) {
  //   velocity.y = 0;
  // }
  let delta = (new Date().getTime() - time) / 1000;
  time = new Date().getTime();
  // velocity.x += evt.acceleration.x * delta;
  // velocity.y += evt.acceleration.y * delta;
  // velocity.z += evt.acceleration.z * delta;

  document.getElementById("p2").innerHTML = Math.round(delta * 100) / 100 + ": " + Math.round(evt.acceleration.x * 100) / 100 + ", " + Math.round(evt.acceleration.y * 100) / 100 + ", " + Math.round(evt.acceleration.z * 100) / 100;

  if (evt.acceleration.x < 0) {
    game.move({ id: 'L' });
  }
  if (evt.acceleration.x > 0) {
    game.move({ id: 'R' });
  }
  if (evt.acceleration.y < 0) {
    game.move({ id: 'U' });
  }
  if (evt.acceleration.y > 0) {
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
    case 'BEG':
      ballPos = { x: 0, y: 0 };
      break;
    case 'END':
      ballPos = { x: 0, y: 0 };
      break;
    default:
      console.log(move);
  }
  ball.setAttribute('cx', ballPos.x);
  ball.setAttribute('cy', ballPos.y);
}
