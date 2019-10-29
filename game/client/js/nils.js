var game;
var character1;
var character2;
var character1Pos = {x: 0, y: 30};
var character2Pos = {x: 0, y: -30};

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'));
  game.gameId = 'beeb1b0d-9b38-4f96-9c40-12aaf457e37b';
  game.name = "Nils Game 2";
  console.log(game);

  character1 = document.getElementById("character1");
  // Benno: das + konvertiert von Text (den getAttribute liefert!) nach Zahl
  character1Pos.x = +character1.getAttribute('cx');
  character1Pos.y = +character1.getAttribute('cy');
  character2 = document.getElementById("character2");
  character2Pos.x = +character2.getAttribute('cx');
  character2Pos.y = +character2.getAttribute('cy');
  document.addEventListener('keydown', onKeyDown);
  //document.getElementById('svg').addEventListener('click', onMouseClick);
}

// Benno: Da sowohl die eigenen als auch fremde Moves ankommen können, brauchen wir jetzt im Move
// die Player ID zur Unterscheidung
function onKeyDown(evt) {
  console.log(evt);
  switch (evt.key) {
    case 'ArrowLeft':
      game.move({ id: 'L', player: game.id });
      break;
    case 'ArrowRight':
      game.move({ id: 'R', player: game.id });
      break;
    case 'ArrowUp':
      game.move({ id: 'U', player: game.id });
      break;
    case 'ArrowDown':
      game.move({ id: 'D', player: game.id });
      break;
    default:
      // console.log(evt.key);
  }
}

// Benno: Hier wrid geprüft, welcher Player den Move gesendet hat und ob er den ersten oder den zweiten Ball bewegen darf:
// Das wird über die Reihenfolge der Spieler entschieden
function onMove(move) {
  switch (move.id) {
    case 'L':
      if (move.player == game.me.group[0]) {
        character1Pos.x -= 5;
      } else {
        character2Pos.x -= 5;
      }
      break;
    case 'R':
      if (move.player == game.me.group[0]) {
        character1Pos.x += 5;
      } else {
        character2Pos.x += 5;
      }
      break;
    case 'U':
      if (move.player == game.me.group[0]) {
        character1Pos.y -= 5;
      } else {
        character2Pos.y -= 5;
      }
      break;
    case 'D':
      if (move.player == game.me.group[0]) {
        character1Pos.y += 5;
      } else {
        character2Pos.y += 5;
      }
      break;
    default:
      console.log(move);
  }
  character1.setAttribute('cx', character1Pos.x);
  character1.setAttribute('cy', character1Pos.y);
  character2.setAttribute('cx', character2Pos.x);
  character2.setAttribute('cy', character2Pos.y);
}
