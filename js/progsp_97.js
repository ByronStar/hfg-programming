var amount;
var value = 7;
var cnt = 0;

function setup() {
  createCanvas(windowWidth, windowHeight)
}

function draw() {
  amount = (frameCount % 100) / 100;
  // console.log(amount);
  background(255, 30);
  //background(255);
  drawA(100, 100);
  // drawBackslash(57, 0, 115, 150);
  push();
  stroke(0, 255, 0);
  ellipse(500 + 100 * Math.cos(2*cnt), 400 + 200 * Math.sin(2*cnt), 20, 20);
  pop();
  ellipse(700 + 100 * Math.cos(-cnt), 400 + 200 * Math.sin(-cnt), 20, 20);
  cnt += PI/180;
  // drawA(200, 100);
  //drawA(120, 0);
  drawV(240, 100);
}

function mouseClicked() {
  if (value == 49) {
    value = 7;
  } else {
    value += 7;
  }
}
// -- letters --
function drawV(x, y) {
  push();
  translate(x, y);
  drawForwardslash(57, 150, 115, 0);
  drawBackslash(0, 0, 57, 150);
  pop();
}

function drawA(x, y) {
  push();
  translate(x, y);
  drawDash(29, 75.5, 57);
  drawForwardslash(57, 0, 0, 150);
  drawBackslash(57, 0, 115, 150);
  pop();
}

// -- basic components --
function drawDash(x, y, w) {
  stroke(41, 171, 226);
  strokeWeight(1);
  // line(x, y, x + w, y);
  var newX = lerp(x, x + w, amount);
  ellipse(newX, y, value, value);
}

function drawForwardslash(x1, y1, x2, y2) {
  stroke(140, 198, 63);
  strokeWeight(1);
  // line(x1, y1, x2, y2);
  var newX = lerp(x1, x2, amount);
  var newY = lerp(y1, y2, amount);
  ellipse(newX, newY, value, value);
}

var dir = 1;

function drawBackslash(x1, y1, x2, y2) {
  stroke(252, 0, 33);
  strokeWeight(1);
  //line(x1, y1, x2, y2);
  if (amount == 0) {
    // dir = -dir;
  }
  if (dir == 1) {
    var newX = lerp(x1, x2, amount);
    var newY = lerp(y1, y2, amount);
    ellipse(newX, newY, value, value);
  } else {
    var newX = lerp(x2, x1, amount);
    var newY = lerp(y2, y1, amount);
    ellipse(newX, newY, value, value);
  }
}
