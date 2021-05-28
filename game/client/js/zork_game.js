let game, data, ready

function init() {
  game = wsinit(onMove, document.getElementById('players'), document.getElementById('status'))
  game.gameId = '105a4c73-b16b-4661-ac64-8cf7ac31767d'
  game.name = "Zork"
  game.seats = 1
  game.run = { cmd: "../zork/zork", args: [], options: { cwd: '../zork' } }
  console.log(game)
  data = document.getElementById('data')
  ready = false
}

function sendMove(evt) {
  let text = evt.srcElement.value + '\n'
  console.log(text)
  if (ready) {
    data.innerHTML += text
    game.move({ id: 'INPUT', text: text });
    evt.srcElement.value = ""
    ready = false
  }
}

function onMove(move) {
  switch (move.id) {
    case 'OUTPUT':
      console.log(move)
      data.innerHTML += move.text
      data.scrollTop = data.scrollHeight
      ready = true
      break
    case 'BEG':
      document.getElementById('play').style.display = 'block'
      break
    case 'END':
      break
    default:
      console.log(move)
  }
}
