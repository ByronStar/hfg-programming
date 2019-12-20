var hLen = 80
var vLen = 120
var wLen = 20

var Engine = Matter.Engine
var World = Matter.World
var Bodies = Matter.Bodies
var Body = Matter.Body
var Constraint = Matter.Constraint
var Composites = Matter.Composites
var Vertices = Matter.Vertices
var Render = Matter.Render

var engine

var renderer

var ground

var bodies = []
var constraints = []

function setup() {
  createCanvas(800, 600)

  // create an engine
  engine = Engine.create()

  // create a default renderer

  renderer = Render.create({
    //element: document.body,
    canvas: document.getElementById('matter'),
    engine: engine,
    options: {
      width: 800,
      height: 600,
      wireframes: false,
      showAngleIndicator: false,
      showVelocity: true,
      showBounds: false,
      showAxes: false,
      showCollisions: false,
      showPositions: false,
      background: '#000000'
    }
  })

  ground = Bodies.rectangle(400, 500, 700, 10, {
    isStatic: true
  })

  A(100, 100)
  A0(500, 100)

  bodies.push(Bodies.rectangle(150, 450, 10, 10, {isStatic: true}))
  bodies.push(Bodies.rectangle(520, 400, 10, 10, {isStatic: true}))

  World.add(engine.world, [ground])
  // add all of the bodies to the world
  World.add(engine.world, bodies)
  // add all of the constraints to the world
  World.add(engine.world, constraints)

  // var cradle = Composites.newtonsCradle(200, 15, 5, 20, 250);
  // Body.translate(cradle.bodies[0], { x: -100, y: -100 });
  // World.add(engine.world, cradle)

  // run the engine
  Engine.run(engine)

  // run the renderer
  Render.run(renderer)
}

// P5 Renderer
function draw() {
  background(0)

  fill(255)
  for (var b = 0; b < bodies.length; b++) {
    if (bodies[b].parts && bodies[b].parts.length > 1) {
      for (var p = 1; p < bodies[b].parts.length; p++) {
        drawVertices(bodies[b].parts[p].vertices)
      }
    } else {
      drawVertices(bodies[b].vertices)
    }
  }

  fill(128)
  drawVertices(ground.vertices)
}

function drawVertices(vertices) {
  beginShape()
  for (var i = 0; i < vertices.length; i++) {
    vertex(vertices[i].x, vertices[i].y)
  }
  endShape(CLOSE)
}

// ein A aus aneinandergeklebten Balken
function A(x, y) {
  // oberer balken
  bodies.push(drawPartH(x + (hLen + wLen) / 2, y - vLen / 2 + wLen / 2))
  // mittlerer balken
  bodies.push(drawPartH(x + (hLen + wLen) / 2, y))
  // linke seite
  bodies.push(drawPartV(x, y))
  // rechte seite
  bodies.push(drawPartV(x + hLen + wLen, y))

  // oberer balken an linke seite
  constraints.push(Constraint.create({bodyA: bodies[0], pointA: {x: -hLen / 2 + wLen / 2, y: 0}, bodyB: bodies[2], pointB: {x: 0, y: -vLen / 2 + wLen / 2}, length: wLen}))
  // mittlerer balken an linke seite
  constraints.push(Constraint.create({bodyA: bodies[1], pointA: {x: -hLen / 2 + wLen / 2, y: 0}, bodyB: bodies[2], pointB: {x: 0, y: 0}, length: wLen}))
  // oberer balken an rechte seite
  constraints.push(Constraint.create({bodyA: bodies[0], pointA: {x: +hLen / 2 - wLen / 2, y: 0}, bodyB: bodies[3], pointB: {x: 0, y: -vLen / 2 + wLen / 2}, length: wLen}))
  // mittlerer balken an linke seite
  constraints.push(Constraint.create({bodyA: bodies[1], pointA: {x: +hLen / 2 - wLen / 2, y: 0}, bodyB: bodies[3], pointB: {x: 0, y: 0}, length: wLen}))
}

// ein A aus Teilen zusammengesetzt
function A0(x, y) {
  var parts = [];
  // oberer balken
  parts.push(drawPartH(x + (hLen + wLen) / 2, y - vLen / 2 + wLen / 2))
  // mittlerer balken
  parts.push(drawPartH(x + (hLen + wLen) / 2, y))
  // linke seite
  parts.push(drawPartV(x, y))
  // rechte seite
  parts.push(drawPartV(x + hLen + wLen, y))
  var body = Matter.Body.create({parts: parts});
  bodies.push(body);
}

function drawPartV(x, y) {
  return Bodies.rectangle(x, y, wLen, vLen, {isStatic: false})
}

function drawPartH(x, y) {
  return Bodies.rectangle(x, y, hLen, wLen, {isStatic: false})
}

// ein A aus Eckpunkten (funktioniert nur mit lib/decomp.min.js Libraray - siehe .html)
/*
function A1(x, y) {
  var v = [
    {x: x, y: y},
    {x: x + hLen, y: y},
    {x: x + hLen, y: y + vLen},
    {x: x + hLen - wLen, y: y + vLen},
    {x: x + hLen - wLen, y: y + vLen / 2},
    {x: x + wLen, y: y + vLen / 2},
    {x: x + wLen, y: y + vLen},
    {x: x, y: y + vLen}
  ]
  bodies.push(createPart(v, x, y, {isStatic: false}))
}

function createPart(vertices, x, y, options) {
  var shape = Vertices.create(vertices, Body.create({}));
  var body = Bodies.fromVertices(0, 0, shape, options);
  Body.setPosition(body, {x: x, y: y});
  return body;
}
*/
