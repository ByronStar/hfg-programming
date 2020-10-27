const fs = require('fs')
let stateFile = './homeworks.json'
let studentsFile = './studentWS2021.txt'

let state
let mapId = {}
loadState()

function repair() {
  fs.readFile(studentsFile, 'utf-8', (err, data) => {
    let lines = data.split(/\r?\n/)
    lines.forEach(l => {
      if (l.length > 0 && !l.startsWith('#')) {
        let p = l.split(/;/)
        id = mapId[p[13] + " " + p[12]]
        if (state.students[id].group != p[9]) {
          console.log(p[13], p[12], p[9], state.students[id].group)
          state.students[id].group = p[9]
        }
      }
    })
    saveState()
  })
}

function loadState() {
  fs.readFile(stateFile, 'utf-8', (err, data) => {
    if (err) {
        console.log(err, err.code)
    } else {
      state = JSON.parse(data)
      for (id in state.students) {
        mapId[state.students[id].name] = id
        // console.log(id + " " + state.students[id].name + " " + state.students[id].group)
      }
      repair()
    }
  })
}

function saveState() {
  fs.writeFileSync(stateFile, JSON.stringify(state), { encoding: 'utf8', flag: 'w' })
}
