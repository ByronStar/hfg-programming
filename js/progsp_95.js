var layer, base;
var info, keyPressed;
var width, height;
var grid = 80;
// var mouse = ['mouseleft', 'mousemiddle', 'mouseright', 'mouse4', 'mouse5']
var mouse = ['mouseleft', 'mouseright', 'mousemiddle', 'mouse4', 'mouse5']

var bindings = [{
    // default
    'w': 'Forward',
    'a': 'Left',
    's': 'Backward',
    'd': 'Right',
    ' ': 'Jump',
    'Shift': 'Sprint',
    '0': 'Auto Run',
    'Control': 'Crouch',
    'MouseLeft': 'Fire',
    'MouseRight': 'Target',
    'r': 'Reload',
    'e': 'Use',
    't': 'Pick',
    '1': 'Weapon 1',
    '2': 'Weapon 2',
    '3': 'Weapon 3',
    '4': 'Weapon 4',
    'F1': 'Wall',
    'F2': 'Floor',
    'F3': 'Ramp',
    'F4': 'Roof',
    'F5': 'Trap',
    'f': 'Repair',
    'g': 'Edit',
    'Escape': 'End',
    'Tab': 'Inventory',
    'i': 'Inventory',
    'l': 'Harvesting',
    'q': 'Toggle',
    'b': 'Emote',
    'm': 'Map',
  },
  {
    // Benno #1
    'w': 'Forward',
    'a': 'Left',
    's': 'Backward',
    'd': 'Right',
    ' ': 'Jump',
    'Shift': 'Sprint',
    '0': 'Auto Run',
    'Control': 'Crouch',
    'MouseLeft': 'Fire',
    'MouseRight': 'Target',
    'Mouse4': 'Forward',
    'Mouse5': 'Use',
    'r': 'Reload',
    'x': 'Use',
    '1': 'Axe',
    '2': 'Weapon 1',
    '3': 'Weapon 2',
    '4': 'Weapon 3',
    '5': 'Weapon 4',
    '6': 'Weapon 5',
    'c': 'Wall',
    'e': 'Floor',
    'q': 'Ramp',
    'v': 'Roof',
    'z': 'Trap',
    'F3': 'Pick',
    'h': 'Repair',
    'g': 'Edit',
    'Escape': 'End',
    'Tab': 'Inventory',
    'i': 'Inventory',
    'f': 'Place?',
    'l': 'Harvesting',
    '<': 'Toggle',
    'y': 'Map',
    'b': 'Emote',
    'm': 'Map'
  }
];

var finger = ['#FF00A0', '#FF8000', '#00A000', '#0080FF', '#FFFF00', '#00A0A0', '#80FF00'];

var keys = [
  { k: 'Escape', r: -1, c: 0.7, f: 0, w: 65 },
  { k: 'F1', r: -1, c: 1.8, f: 1, w: 65 },
  { k: 'F2', r: -1, c: 2.85, f: 2, w: 65 },
  { k: 'F3', r: -1, c: 3.9, f: 3, w: 65 },
  { k: 'F4', r: -1, c: 4.95, f: 5, w: 65 },
  { k: 'F5', r: -1, c: 6.0, f: 5, w: 65 },
  { k: '1', r: 0, c: 1.8, f: 1 },
  { k: '2', r: 0, c: 2.8, f: 2 },
  { k: '3', r: 0, c: 3.8, f: 3 },
  { k: '4', r: 0, c: 4.8, f: 5 },
  { k: '5', r: 0, c: 5.8, f: 5 },
  { k: '6', r: 0, c: 6.8, f: 5 },
  { k: '0', r: 0, c: 10.8, f: 5 },
  { k: 'Tab', r: 1, c: 0.7, f: 0, w: 105 },
  { k: 'q', r: 1, c: 2.3, f: 1 },
  { k: 'w', r: 1, c: 3.3, f: 2 },
  { k: 'e', r: 1, c: 4.3, f: 3 },
  { k: 'r', r: 1, c: 5.3, f: 5 },
  { k: 't', r: 1, c: 6.3, f: 5 },
  { k: 'z', r: 1, c: 7.3, f: 5 },
  { k: 'i', r: 1, c: 9.3, f: 5 },
  { k: 'a', r: 2, c: 2.6, f: 1 },
  { k: 's', r: 2, c: 3.6, f: 2 },
  { k: 'd', r: 2, c: 4.6, f: 3 },
  { k: 'f', r: 2, c: 5.6, f: 5 },
  { k: 'g', r: 2, c: 6.6, f: 5 },
  { k: 'h', r: 2, c: 7.6, f: 5 },
  { k: 'l', r: 2, c: 10.6, f: 5 },
  { k: 'Shift', r: 3, c: 0.7, f: 0, w: 90 },
  { k: '<', r: 3, c: 2.1, f: 1 },
  { k: 'y', r: 3, c: 3.1, f: 2 },
  { k: 'x', r: 3, c: 4.1, f: 4 },
  { k: 'c', r: 3, c: 5.1, f: 4 },
  { k: 'v', r: 3, c: 6.1, f: 4 },
  { k: 'b', r: 3, c: 7.1, f: 5 },
  { k: 'n', r: 3, c: 8.1, f: 5 },
  { k: 'm', r: 3, c: 9.1, f: 5 },
  { k: ',', r: 3, c: 10.1, f: 5 },
  { k: 'Control', r: 4, c: 0.7, f: 0, w: 105 },
  { k: ' ', r: 4, c: 5.1, f: 4, w: 460 },
  { k: 'MouseLeft', r: 4, c: 11.5, f: 6, w: 120 },
  { k: 'MouseMiddle', r: 4, c: 13.3, f: 6, w: 100 },
  { k: 'MouseRight', r: 4, c: 14.85, f: 6, w: 120 },
  { k: 'Mouse5', r: 5, c: 11.8, f: 6, w: 80 },
  { k: 'Mouse4', r: 6, c: 11.8, f: 6, w: 80 }
];

var binding = bindings[1];
var sequence = [
  ['Forward', 'Fire', 'Ramp'],
  ['Forward', 'Fire', 'Floor'],
  ['Forward', 'Fire', 'Wall']
  // ,['Forward', 'Fire', 'Jump']
];
var seq = 0;
var seqCnt = 0;
var seqTime;
var gapTime = new Date().getTime();

function init() {
  info = document.getElementById('info');
  layer = document.getElementById('layer2');
  keyPressed = {};
  width = window.innerWidth;
  height = window.innerHeight;
  // width = screen.width;
  // height = screen.height;
  document.getElementById('svg').setAttribute('viewBox', '-' + width / 2 + ' -' + height / 2 + ' ' + width + ' ' + height);
  keys.forEach(key => {
    key.e = createElement(layer, 'rect', { x: -width / 2 + 100 + grid * key.c, y: -height / 2 + 200 + grid * key.r, width: key.w ? key.w : 60, height: 60, stroke: '#C0C0C0', rx: '8', ry: '8' });
    var text = createElement(layer, 'text', { x: -width / 2 + 100 + (key.w ? key.w : 60) / 2 + grid * key.c, y: -height / 2 + 220 + grid * key.r });
    text.innerHTML = key.k;
    text = createElement(layer, 'text', { x: -width / 2 + 100 + (key.w ? key.w : 60) / 2 + grid * key.c, y: -height / 2 + 245 + grid * key.r });
    text.innerHTML = binding[key.k] ? binding[key.k] : '-';
    text.setAttribute('style', 'fill: #A00000;font-size: 12px;')
  })
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('mousedown', onMouse);
  document.addEventListener('mouseup', onMouse);
  document.addEventListener('contextmenu', onMouseMenu);
  keys.forEach(key => {
    key.e.setAttribute('fill', finger[key.f])
  });
}

function onKeyUp(evt) {
  keyPressed[evt.key.toLowerCase()] = false;
  show();
}

function onKeyDown(evt) {
  evt.preventDefault();
  if (audioCtx.state != 'running') {
    playSound(sounds[0]);
  }
  if (keyPressed[evt.key.toLowerCase()] != true) {
    keyPressed[evt.key.toLowerCase()] = true;
    show();
  }
}

function onMouseMenu(evt) {
  evt.preventDefault();
}

function onMouse(evt) {
  evt.preventDefault();
  var b = 1;
  mouse.forEach((m, i) => {
    keyPressed[m] = evt.buttons & b;
    b *= 2;
  })
  show();
}

function show() {
  keys.forEach(key => {
    key.e.setAttribute('stroke', keyPressed[key.k.toLowerCase()] ? '#FF0000' : '#C0C0C0')
  });
  //winfo.innerHTML = keys.filter(key => keyPressed[key.k.toLowerCase()]).map(key => binding[key.k]).join(', ');
  var actions = Object.keys(binding).filter(k => keyPressed[k.toLowerCase()]).map(k => binding[k]);
  // console.log(actions);
  if (actions.some(a => sequence[seq].indexOf(a) == -1)) {
    seq = 0;
    seqCnt = 0;
    playSound(sounds[4]);
    gapTime = new Date().getTime();
    info.innerHTML = "😱";
    console.log("WRONG")
  } else {
    if (seq == 0) {
      seqTime = new Date().getTime();
    }
    if (actions.length == sequence[seq].length) {
      seq = (seq + 1) % sequence.length
      playSound(sounds[seq == 0 ? 2 : 0]);
      if (seq == 0) {
        var now = new Date().getTime();
        seqCnt++;
        info.innerHTML = (seqTime - gapTime) + " - " + (now - seqTime) + " - " + seqCnt;
        gapTime = now;
      }
      console.log("RIGHT")
    }
  }
}

function clearElement(elem) {
  var copy = elem.cloneNode(false);
  elem.parentNode.replaceChild(copy, elem);
  return copy;
}

function createElement(parent, type, attrList) {
  var elem = document.createElementNS(parent.namespaceURI, type);
  parent.appendChild(elem);
  for (attr in attrList) {
    elem.setAttribute(attr, attrList[attr]);
  }
  return elem;
}

var sounds = [];
var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
loadSounds();

function loadSounds() {
  audioCtx.onstatechange = () => console.log("CTX", audioCtx.state);
  console.log(audioCtx)
  sounds = []
  loadSound('sound/CyCdh_K3ClHat-01.wav', 0)
  loadSound('sound/CyCdh_K3Crash-05.wav', 1)
  loadSound('sound/CyCdh_K3Kick-01.wav', 2)
  loadSound('sound/CyCdh_K3OpHat-01.wav', 3)
  loadSound('sound/CyCdh_K3Snr-02.wav', 4)
}

function loadSound(url, idx) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  // console.log(url)

  // Decode asynchronously
  request.onload = function() {
    audioCtx.decodeAudioData(request.response, function(buffer) {
      sounds[idx] = buffer
      // console.log("loaded " + url + " at " + idx)
    }, function(err) {
      console.log(idx, err)
    });
  }
  request.send();
}

function playSound(buffer, time) {
  if (buffer) {
    time = time || 0;
    var source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    if (!source.start)
      source.start = source.noteOn;
    source.start(time);
  } else {
    console.log("Not loaded")
  }
}
