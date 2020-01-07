var percent;
var durchmesser = 7;
var dir = 1;

function setup() {
  createCanvas(windowWidth, windowHeight)
}

function draw() {
  // Zahl zwischen 0 und 0.995 
  percent = (frameCount % 200) / 200;
  if (percent == 0) {
    dir = -dir;
  }
  // console.log(percent);
  //background(255);
  background(255, 10);
  rotateSamples();
  // fontSamples();
}

function rotateSamples() {
  push();

  // Nicht rotierte Referenzlinie
  strokeWeight(2);
  stroke(0, 255, 255);
  line(100,100,200,100);

  // Um die Mitte rotierende Linie
  translate(150,100)
  rotate(percent * TWO_PI);
  translate(-150,-100)
  stroke(0, 255, 0);
  line(100,100,200,100);
  pop();

  // Kreis der sich auf einer Kreisbahn bewegt
  ellipse(150 + 100 * Math.cos(percent * TWO_PI), 400 + 100 * Math.sin(percent * TWO_PI), 20, 20);

  // Nicht rotiertes animiertes, interaktives "A"
  drawA(400, 200);

  // Rotierendes animiertes, interaktives "A"
  push();
  translate(400,200)
  rotate(percent * TWO_PI);
  translate(-400,-200)
  drawA(400, 200);
  pop();
}

function fontSamples() {
  // Animiertes, interaktives "A"
  drawA(200, 100);
  // Animiertes, interaktives "V"
  drawV(300, 100);
}

function mouseClicked() {
  // Interaktion für die Buchstaben
  if (durchmesser == 49) {
    durchmesser = 7;
  } else {
    durchmesser += 7;
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
  var newX = lerp(x, x + w, percent);
  ellipse(newX, y, durchmesser, durchmesser);
}

function drawForwardslash(x1, y1, x2, y2) {
  stroke(140, 198, 63);
  strokeWeight(1);
  // line(x1, y1, x2, y2);
  var newX = lerp(x1, x2, percent);
  var newY = lerp(y1, y2, percent);
  ellipse(newX, newY, durchmesser, durchmesser);
}

function drawBackslash(x1, y1, x2, y2) {
  stroke(252, 0, 33);
  strokeWeight(1);
  //line(x1, y1, x2, y2);
  if (dir == 1) {
    var newX = lerp(x1, x2, percent);
    var newY = lerp(y1, y2, percent);
    ellipse(newX, newY, durchmesser, durchmesser);
  } else {
    var newX = lerp(x2, x1, percent);
    var newY = lerp(y2, y1, percent);
    ellipse(newX, newY, durchmesser, durchmesser);
  }
}
