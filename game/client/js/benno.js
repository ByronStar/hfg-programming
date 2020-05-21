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

function simplifyPath(points, tolerance) {

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
