var pt, matrix;
var mask, image, info;
var max = 0;
var intId = null;
var tId = null;
var centered = false;
var isLocating = false;
var person = 0;
var learn = [];
const LEARN_TIME = 4000;

function init() {
  svg = document.getElementById('svg');
  pt = svg.createSVGPoint();
  matrix = svg.getScreenCTM().inverse();

  mask = document.getElementById('mask');
  image = document.getElementById('ig1');
  info = document.getElementById('info');

  document.addEventListener('keyup', onKeyUp);
  startLearn();
}

function showPerson(p, text) {
  if (centered) {
    image.setAttribute('x', -960 - students[p].loc.x * 2);
    image.setAttribute('y', -600 - students[p].loc.y * 2);
  } else {
    mask.setAttribute('cx', students[p].loc.x * 2);
    mask.setAttribute('cy', students[p].loc.y * 2);
  }
  show(text)
}

function show(text) {
  info.innerHTML = text;
}

function startLearn() {
  students.forEach(function(p) {
    p.cnt = 0;
    p.skip = undefined;
  });
  max = 0;
  learn = students.filter(function(p) {
    return p.loc != undefined;
  });
  if (learn.length > 0) {
    if (intId == null && !isLocating) {
      learnNext();
      intId = setInterval(learnNext, LEARN_TIME);
    }
  } else {
    startLocate();
  }
}

function learnNext() {
  var p;
  do {
    p = Math.floor(Math.random() * learn.length);
  } while (learn[p].cnt > Math.floor(max / learn.length));
  max++;
  learn[p].cnt++;
  showPerson(p, "Wer ist das?");
  tId = setTimeout(show, LEARN_TIME - 1000, learn[p].name);
}

function stopLearn() {
  if (intId != null) {
    clearInterval(intId);
    clearTimeout(tId);
    intId = null;
  }
}

function startLocate() {
  if (!isLocating) {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    isLocating = true;
  }
  locateNext();
}

function locateNext() {
  person = students.findIndex(function(p) {
    return p.loc == undefined && p.skip == undefined;
  });
  console.log("Suche " + person);
  if (person == -1) {
    console.log(JSON.stringify(students));
    document.getElementById('data').innerHTML = JSON.stringify(students).replace(/},{/g, "},<br>{") + ";";
    stopLocate(true);
  } else {
    show("Suche " + students[person].name);
  }
}

function stopLocate(doStart) {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('click', onMouseClick);
  isLocating = false;
  if (doStart) {
    startLearn();
  }
}

function stop() {
  if (isLocating) {
    stopLocate(false);
  } else {
    stopLearn();
  }
}

function onKeyUp(evt) {
  console.log(evt.key);
  switch (evt.key) {
    case 'a':
      stop();
      document.getElementById('data').innerHTML = "";
      image.setAttribute('xlink:href', 'img/ig1a.jpg');
      students = ig1a;
      startLearn();
      break;
    case 'b':
      stop();
      document.getElementById('data').innerHTML = "";
      image.setAttribute('xlink:href', 'img/ig1b.jpg');
      students = ig1b;
      startLearn();
      break;
    case 'c':
      if (!isLocating) {
        stopLearn();
        centered = !centered;
        if (centered) {
          mask.setAttribute('cx', 0);
          mask.setAttribute('cy', 0);
        } else {
          image.setAttribute('x', -960);
          image.setAttribute('y', -600);
        }
        startLearn();
      }
      break;
    case 'm':
      // mark as missing
      if (isLocating) {
        addPosition(person, { x: 0, y: 0 });
      }
      break;
    case 's':
      if (isLocating) {
        students[person].skip = true;
        locateNext();
      }
      break;
    case 'x':
      stopLearn();
      startLocate();
      break;
    case 'y':
      stopLocate(true);
      break;
    case ' ':
      if (!isLocating) {
        if (intId == null) {
          startLearn();
        } else {
          stopLearn();
          show("Pause");
        }
      }
      break;
  }
}

function onMouseMove(evt) {
  var loc = cursorPoint(evt);
  mask.setAttribute('cx', loc.x);
  mask.setAttribute('cy', loc.y);
}

function addPosition(p, loc) {
  students[p].loc = { x: Math.floor(loc.x / 2), y: Math.floor(loc.y / 2) };
  locateNext();
}

function onMouseClick(evt) {
  var loc = cursorPoint(evt);
  mask.setAttribute('cx', loc.x);
  mask.setAttribute('cy', loc.y);
  addPosition(person, loc);
}

// Get point in global SVG space
function cursorPoint(evt) {
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(matrix);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

var ig1a = [{ "name": "Nico Aci", "cnt": 0, "loc": { "x": 279, "y": -126 } },
  { "name": "Yvonne Becker", "cnt": 0, "loc": { "x": -45, "y": -103 } },
  { "name": "Caroline Bunk", "cnt": 0, "loc": { "x": -193, "y": -98 } },
  { "name": "Niklas Buchfink", "cnt": 0, "loc": { "x": -350, "y": -134 } },
  { "name": "Ramona Dombetzki", "cnt": 0, "loc": { "x": 338, "y": -103 } },
  { "name": "Lucas Epple", "cnt": 0, "loc": { "x": -267, "y": -131 } },
  { "name": "Elsa Franzl", "cnt": 0, "loc": { "x": 64, "y": -93 } },
  { "name": "Nils Jacobsen", "cnt": 0, "loc": { "x": -200, "y": -150 } },
  { "name": "Pauline Koch", "cnt": 0, "loc": { "x": 193, "y": -109 } },
  { "name": "Tianming Lu", "cnt": 0, "loc": { "x": 51, "y": -130 } },
  { "name": "Tobias Michaely", "cnt": 0, "loc": { "x": -23, "y": -138 } },
  { "name": "Romy Munder", "cnt": 0, "loc": { "x": 145, "y": -97 } },
  { "name": "Lena Rieb", "cnt": 0, "loc": { "x": 331, "y": -221 } },
  { "name": "Marlen Schwarz", "cnt": 0, "loc": { "x": -121, "y": -99 } },
  { "name": "Sophie Vollmer", "cnt": 0, "loc": { "x": 236, "y": -90 } }
];

var ig1b = [{ "name": "Alina Baumgarten", "cnt": 0, "loc": { "x": -228, "y": -134 } },
  { "name": "Pius Burkhart", "cnt": 0, "loc": { "x": 152, "y": -156 } },
  { "name": "Lara Engelbrecht", "cnt": 0, "loc": { "x": 19, "y": -129 } },
  { "name": "Tobias Ertel", "cnt": 0, "loc": { "x": -166, "y": -150 } },
  { "name": "Luzie Funk", "cnt": 0, "loc": { "x": 76, "y": -133 } },
  { "name": "Felix Haeberle", "cnt": 0, "loc": { "x": 320, "y": 9 } },
  { "name": "Samuel Jaros", "cnt": 0, "loc": { "x": -332, "y": -156 } },
  { "name": "Luke Lips", "cnt": 0, "loc": { "x": -92, "y": -145 } },
  { "name": "Niko Mang", "cnt": 0, "loc": { "x": -45, "y": 13 } },
  { "name": "Niklas Moldan", "cnt": 0, "loc": { "x": 228, "y": 9 } },
  { "name": "Daisy Muntean", "cnt": 0, "loc": { "x": 135, "y": 26 } },
  { "name": "Zacharie Reifegerst", "cnt": 0, "loc": { "x": -35, "y": -145 } },
  { "name": "Alina Remlinger", "cnt": 0, "loc": { "x": 62, "y": 6 } },
  { "name": "Viki Schmidt", "cnt": 0, "loc": { "x": -142, "y": 7 } },
  { "name": "Sarra Sengkhun", "cnt": 0, "loc": { "x": 288, "y": -129 } },
  { "name": "Marla Wagner", "cnt": 0, "loc": { "x": 234, "y": -135 } },
  { "name": "Chantal Pantalon", "cnt": 0, "loc": { "x": -245, "y": 24 } }
];

var students = ig1a;
