var layer;
var score;
var myElems;
var idxRow = 4;
var idxCol = 7;
var count = 30;
var aniId;
var dir = { r: 0, c: 0 };
var snake = [];
var gameOver = false;
var foods, goodFood, illFood, killFood, fastFood;
var speed;
var snakeColor;

var sounds = [];
var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
loadSounds();

function loadSounds() {
  audioCtx.onstatechange = () => console.log("CTX", audioCtx.state);
  console.log(audioCtx)
  sounds = []
  loadSound('sound/CyCdh_K3ClHat-01.wav', 0)
  loadSound('sound/CyCdh_K3Kick-01.wav', 1)
  loadSound('sound/CyCdh_K3Crash-05.wav', 2)
  loadSound('sound/CyCdh_K3Snr-02.wav', 3)
  loadSound('sound/CyCdh_K3OpHat-01.wav', 4)
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
      console.log("loaded " + url + " at " + idx)
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

function init() {
  layer = document.getElementById('layer2');
  score = document.getElementById('score');
  score.innerHTML = 'Hallo<br>Du Nase!'

  myElems = createPattern(layer, 25, 5, count, 'blue');
  // console.log(myElems);

  restart();
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onClick);
}

function restart() {
  myElems.forEach(function(elem) {
    elem.setAttribute('fill', 'blue');
  });
  dir = { r: 0, c: 0 };
  snake = [];
  gameOver = false;
  idxRow = 4;
  idxCol = 7;
  snake.push({ r: idxRow, c: idxCol });
  myElems[getSnakeIdx(0)].setAttribute('fill', 'lime');
  goodFood = addFood(3, 'yellow');
  illFood = addFood(2, 'red');
  killFood = addFood(2, 'black');
  fastFood = addFood(2, 'green');
  foods = [goodFood, illFood, killFood, fastFood]
  speed = 500;
  snakeColor = 'lime';
  aniId = setInterval(animate, speed);
}

function getSnakeIdx(s) {
  return snake[s].c * count + snake[s].r
}

function delFood(food, color) {
  var deletedFood = food.pop();
  if (deletedFood) {
    deletedFood.setAttribute('fill', 'blue');
  } else {
    console.log("ADD")
    food = food.concat(addFood(3, color));
  }
  return food;
}

function addFood(cnt, type) {
  var food = [];
  var c, r;
  for (var i = 0; i < cnt; i++) {
    do {
      c = 1 + Math.floor(Math.random() * (count - 1));
      r = 1 + Math.floor(Math.random() * (count - 1));
    } while (myElems[c * count + r].getAttribute('fill') != 'blue')
    myElems[c * count + r].setAttribute('fill', type);
    food.push(myElems[c * count + r]);
  }
  return food;
}

function animate() {
  if (Math.random() < 0.1) {
    goodFood = delFood(goodFood, 'yellow');
  }
  if (Math.random() < 0.1) {
    illFood = delFood(illFood, 'red');
  }
  //console.log(dir);
  idxCol = idxCol + dir.c;
  idxRow += dir.r;
  if (idxRow < 0) {
    idxRow += count;
  }
  if (idxRow >= count) {
    idxRow -= count;
  }
  if (idxCol < 0) {
    idxCol += count;
  }
  if (idxCol >= count) {
    idxCol -= count;
  }

  if (dir.c != 0 || dir.r != 0) {
    snake.unshift({ c: idxCol, r: idxRow });

    var color = myElems[idxCol * count + idxRow].getAttribute('fill');
    switch (color) {
      case snakeColor:
      case 'black':
        gameOver = true;
        break;
      case 'yellow':
        playSound(sounds[1]);
        goodFood = goodFood.filter(function(elem) {
          return elem != myElems[idxCol * count + idxRow];
        })
        goodFood = goodFood.concat(addFood(1, 'yellow'));
        break;
      case 'green':
        playSound(sounds[4]);
        myElems[getSnakeIdx(snake.length - 1)].setAttribute('fill', 'blue');
        snake.pop();
        fastFood = fastFood.filter(function(elem) {
          elem != myElems[idxCol * count + idxRow];
        })
        fastFood = fastFood.concat(addFood(1, 'green'));
        if (speed > 100) {
          speed -= 50
          clearInterval(aniId)
          aniId = setInterval(animate, speed);
        }
        snakeColor = 'purple';
        break;
      case 'red':
        playSound(sounds[3]);
        illFood = illFood.filter(function(elem) {
          elem != myElems[idxCol * count + idxRow];
        })
        illFood = illFood.concat(addFood(1, 'red'));
        myElems[getSnakeIdx(snake.length - 1)].setAttribute('fill', 'blue');
        snake.pop();
        myElems[getSnakeIdx(snake.length - 1)].setAttribute('fill', 'blue');
        snake.pop();
        if (snake.length == 0) {
          gameOver = true;
        }
        break;
      default:
        playSound(sounds[0]);
        myElems[getSnakeIdx(snake.length - 1)].setAttribute('fill', 'blue');
        snake.pop();
        break
    }
  }

  snake.forEach(function(seg, s) {
    myElems[getSnakeIdx(s)].setAttribute('fill', snakeColor);
  });

  if (gameOver) {
    clearInterval(aniId);
    playSound(sounds[2]);
    score.innerHTML = 'GameOver!<br>' + snake.length;
  } else {
    score.innerHTML = 'Score:<br>' + snake.length;
  }
}

function onClick(evt) {
  //console.log(evt);
  if (evt.target && evt.target.nodeName == 'circle') {
    evt.target.setAttribute('fill', '#00FFFF');
  }
}

function onKeyDown(evt) {
  // console.log(evt);
  if (audioCtx.state != 'running') {
    playSound(sounds[0]);
  }
  switch (evt.key) {
    case 'ArrowUp':
      evt.preventDefault()
      dir.c = 0;
      dir.r = -1;
      // idxRow--;
      break;
    case 'ArrowDown':
      evt.preventDefault()
      dir.c = 0;
      dir.r = 1;
      // idxRow++;
      break;
    case 'ArrowLeft':
      dir.c = -1;
      dir.r = 0;
      // idxCol--;
      break;
    case 'ArrowRight':
      dir.c = 1;
      dir.r = 0;
      // idxCol++;
      break;
    case ' ':
      if (gameOver) {
        restart();
      }
      break;
    default:
      // console.log(evt.key);
      break;
  }
}

function colorColRow(column, row, count) {
  for (var i = column * count; i < (column + 1) * count; i++) {
    myElems[i].setAttribute("fill", "white");
  }
  for (var w = row; w < (count * count); w += count) {
    myElems[w].setAttribute("fill", "black");
  }
}

function createPattern(parent, box, gap, cnt, color) {
  var elems = [];
  var offset = -cnt * (box + 2 * gap) / 2 + gap;
  for (var col = 0; col < cnt; col++) {
    for (var row = 0; row < cnt; row++) {
      var elem = createCircle(parent, offset + col * (box + 2 * gap), offset + row * (box + 2 * gap), box, color);
      elems.push(elem);
    }
  }
  return elems;
}

function createRectangle(parent, x, y) {
  var rect = document.createElementNS(parent.namespaceURI, 'rect');
  rect.setAttribute('width', 40);
  rect.setAttribute('height', 40);
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  parent.appendChild(rect);
}

function createCircle(parent, x, y, size, color) {
  var circle = document.createElementNS(parent.namespaceURI, 'circle');
  circle.setAttribute('r', size / 2);
  circle.setAttribute('cx', x + size / 2);
  circle.setAttribute('cy', y + size / 2);
  circle.setAttribute('fill', color);
  parent.appendChild(circle);
  return circle;
}
