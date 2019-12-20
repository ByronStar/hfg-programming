var game;
var ball;
var ballPos = { x: 0, y: 0 };
let orientation = { x: 0, y: 0, z: 0 };
let acceleration = { x: 0, y: 0, z: 0 };
let velocity = { x: 0, y: 0, z: 0 };
let time = 0;

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = '105a4c73-b16b-4661-ac64-8cf7ac31767d';
  game.name = "Demo";
  console.log(game);

  ball = document.getElementById("ball");
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onMouseClick);
  if (location.protocol == 'https:') {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', onOrientation)
      setInterval(process, 40);
    }
    if (window.DeviceMotionEvent) {
      time = new Date().getTime();
      window.addEventListener('devicemotion', onMotion);
    }
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
  let pos = game.svgPoint(evt);
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

function process(evt) {
  velocity.x *= 0.9;
  velocity.y *= 0.9;
  velocity.z *= 0.9;
  velocity.x += acceleration.x * 0.4;
  velocity.y += acceleration.y * 0.4;
  velocity.z += acceleration.z * 0.4;
  document.getElementById("p2").innerHTML = Math.round(orientation.x) + ", " + Math.round(orientation.y) + ", " + Math.round(orientation.z) + ' - ' + Math.round(acceleration.x * 10) / 10 + ", " + Math.round(acceleration.y * 10) / 10 + ", " + Math.round(acceleration.z * 10) / 10;
  //move(orientation, 10);
  move(velocity, 0.2);
}

function move(data, border) {
  if (data.x < -border) {
    game.move({ id: 'L' });
  }
  if (data.x > border) {
    game.move({ id: 'R' });
  }
  if (data.y < -border) {
    game.move({ id: 'U' });
  }
  if (data.y > border) {
    game.move({ id: 'D' });
  }
}

function onOrientation(evt) {
  // gear (z/alpha), nick (x/beta), roll(y/gamma)
  orientation.x = evt.beta;
  orientation.y = -evt.gamma;
  orientation.z = evt.alpha;
}

function onMotion(evt) {
  acceleration.x = evt.acceleration.x;
  acceleration.y = evt.acceleration.y;
  acceleration.z = evt.acceleration.z;
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
