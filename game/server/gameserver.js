"use strict"

let wsPort = 11203
let wssPort = 11204
let msgTrace = false

const WebSocket = require('ws')
let WebSocketServer = WebSocket.Server
const https = require('https')
const fs = require('fs')

const http = require('http')
const url = require("url")
const path = require("path")

let ifs = require('os').networkInterfaces()
// console.log(ifs)

let ipAddr = 'localhost'
if (process.argv.length < 3 || process.argv[2] != '-local') {
  ipAddr = Object.keys(ifs).map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0]).filter(x => x)[0].address
}
if (process.argv.length > 2 && process.argv[2] == '-trace') {
  msgTrace = true
}
let ipPort = 8091
// let ipPort = 443

let clients = {}
// track active IP Addresses
let active = {}

let state = {
  games: {
    0: {
      id: 0,
      js: "/client/js/progsp_game.js",
      html: "/client/progsp_game.html",
      name: "Demo Spiel",
      version: 0,
      players: []
    }
  },
  files: {
    "/client/js/progsp_game.js": 0,
    "/client/progsp_game.html": 0
  },
  players: {}
}
let stateFile = './gamestate.json';

loadState();

let options = {
  key: fs.readFileSync('./progsp.hfg-gmuend.de.key'),
  cert: fs.readFileSync('./progsp.hfg-gmuend.de.pem')
}

// let options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/byron.hopto.org/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/byron.hopto.org/fullchain.pem')
// }

let contentTypesByExtension = {
  '.html': "text/html",
  '.css': "text/css",
  '.js': "text/javascript"
}

https.createServer(options, function(request, response) {
  //http.createServer(function(request, response) {

  let pathname = url.parse(request.url).pathname
  let filename
  if (pathname.startsWith('/client')) {
    filename = ".." + pathname
  } else {
    filename = "../client" + pathname
  }
  filename = path.join(process.cwd(), filename)

  //console.log(url.parse(request.url).pathname, filename)

  if (pathname == '/') {
    response.writeHead(200, { "Content-Type": "text/html" })
    response.write(getIndex())
    response.end()
  } else {
    fs.exists(filename, function(exists) {
      if (!exists) {
        response.writeHead(404, {
          "Content-Type": "text/plain"
        })
        response.write("404 Not Found\n")
        response.end()
        return
      }

      if (fs.statSync(filename).isDirectory()) {
        filename += '/index.html'
      }

      fs.readFile(filename, "binary", function(err, file) {
        if (err) {
          response.writeHead(500, {
            "Content-Type": "text/plain"
          })
          response.write(err + "\n")
          response.end()
          return
        }

        let headers = {}
        let contentType = contentTypesByExtension[path.extname(filename)]
        if (contentType) headers["Content-Type"] = contentType
        response.writeHead(200, headers)
        response.write(file, "binary")
        response.end()
      })
    })
  }
}).listen(ipPort, ipAddr)

console.log((new Date()) + ' GameServer available under https://' + ipAddr + ':' + ipPort)

function broadcast(server, message) {
  if (msgTrace) {
    console.log('%s SND <%s> (%d players)', new Date().getTime(), message, (server.clients.length ? server.clients.length : server.clients.size))
  }
  server.clients.forEach(function each(client) {
    try {
      client.send(message)
    } catch (e) {
      console.log(e)
    }
  })
}

function forward(server, message, active) {
  if (msgTrace) {
    console.log('%s FWD <%s> ([%s] %d players)', new Date().getTime(), message, active, active.length)
  }
  active.forEach(function each(id) {
    try {
      if (clients[id]) {
        clients[id].send(message)
      }
    } catch (e) {
      console.log(e)
    }
  })
}

function handleMessage(server, message, id, client) {
  let ip = client.upgradeReq.connection.remoteAddress
  if (msgTrace) {
    console.log('%s REC <%s>', new Date().getTime(), message)
  }
  let msg = JSON.parse(message)
  if (!active[ip]) {
    active[ip] = true
    switch (msg.id) {
      case 'JOIN':
        state.players[id] = msg.data.game
        if (!(msg.data.game in state.games)) {
          // not yet published game
          state.games[msg.data.game] = { id: msg.data.game, players: [] }
        }
        let player = {
          id: id,
          name: msg.data.name,
          // game: msg.data.game,
          active: false,
          group: []
        }
        state.games[msg.data.game].players.push(player);
        // saveState();
        forward(server, JSON.stringify({
          id: 'PLAYERS',
          from: 'SERVER',
          data: {
            players: state.games[msg.data.game].players
          }
        }), state.games[msg.data.game].players.map(v => v.id))
        updateGames(server)
        if (!msgTrace) {
          console.log('%s INFO <%s>', new Date().getTime(), message)
        }
        break
      case 'UPDATE':
        msg.id = 'PLAYERS'
        msg.data.players = updatePlayers(msg.data.player)
        forward(server, JSON.stringify(msg), msg.data.players.map(v => v.id))
        break
      case 'PREPARE':
      case 'ACCEPT':
        msg.data.players = updatePlayers(msg.data.player)
        forward(server, JSON.stringify(msg), [msg.from, msg.data.to])
        updateGames(server)
        break
      case 'DECLINE':
        forward(server, message, [msg.data.to])
        updateGames(server)
        break
      case 'MOVE':
        forward(server, message, msg.data.group)
        break
      case 'INFO':
        console.log("INFO: ", msg.data)
        break
      case 'RESTART':
        process.exit(msg.data.rc)
        break
      case 'STATE':
        client.send(JSON.stringify({
          id: 'STATE',
          from: 'SERVER',
          data: state
        }))
        break
      case 'STORE':
        let file = (msg.data.file.startsWith('/client') ? '' : '/client') + msg.data.file
        let part = file.endsWith('.js') ? 'js' : 'html'
        if (msg.data.game in state.games) {
          if (state.games[msg.data.game][part] != undefined && state.games[msg.data.game][part] != file) {
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: {
                rc: -1,
                msg: "Ein Spiel mit der selben ID existiert bereits unter einem anderen Namen: '" + state.games[msg.data.game][part] +
                  "'.\nEventuell im Javascript \ngame.gameId = '" + msg.data.game + "';\n durch \ngame.gameId = '" + guid7() + "';\n ersetzen!"
              }
            }))
            break;
          }
          state.games[msg.data.game].version++
        } else {
          state.games[msg.data.game] = { id: msg.data.game, players: [], version: 0 }
        }
        if (file in state.files) {
          if (state.files[file] != msg.data.game) {
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: {
                rc: -2,
                msg: 'Ein Spiel mit dem selben Namen "' + file + '" existiert bereits unter einer anderen ID: ' + state.files[file] +
                  "'.\nEventuell HTML und Javascript umbenennen."
              }
            }))
            break;
          }
        } else {
          state.files[file] = msg.data.game
        }
        state.games[msg.data.game][part] = file
        state.games[msg.data.game].name = msg.data.name
        saveState()
        let buff = Buffer.from(msg.data.code, 'base64')
        //console.log(msg.data.code, buff, buff.toString(), buff.toString('utf-8'))
        fs.writeFile('..' + file, buff.toString('utf-8'), 'utf8', (err, data) => {
          if (err) {
            console.log(err)
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: { rc: -1, msg: err }
            }))
          } else {
            console.log(file + " saved.")
            forward(server, JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: {
                players: state.games['L-' + msg.data.game].players
              }
            }), state.games['L-' + msg.data.game].players.map(v => v.id))
            // client.send(JSON.stringify({
            //   id: 'STORE',
            //   from: 'SERVER',
            //   data: { rc: 0, msg: '' }
            // }))
          }
        });
        updateGames(server)
        break
      default:
        break
    }
    active[ip] = false
  } else {
    client.send(JSON.stringify({
      id: 'FLOOD',
      from: 'SERVER',
      data: {}
    }))
  }
}

function updateGames(server) {
  if (state.games[-1]) {
    forward(server, JSON.stringify({
      id: 'GAMES',
      from: 'SERVER',
      data: {
        games: state.games
      }
    }), state.games[-1].players.map(v => v.id))
  }
}

function updatePlayers(player) {
  let gameId = state.players[player.id]
  let idx = state.games[gameId].players.findIndex(v => v.id === player.id)
  state.games[gameId].players[idx] = player
  return state.games[gameId].players
}

function handleClose(server, id) {
  delete clients[id]
  let gameId = state.players[id]
  delete state.players[id]
  state.games[gameId].players = state.games[gameId].players.filter(v => v.id !== id)
  let message = JSON.stringify({
    id: 'EXIT',
    from: 'SERVER',
    data: {
      id: id,
      players: state.games[gameId].players
    }
  });
  console.log('%s EXIT <%s> (%d players)', new Date().getTime(), message, (server.clients.length ? server.clients.length : server.clients.size))
  // Forward message to affected players: Client has left
  forward(server, message, state.games[gameId].players.map(v => v.id))
  updateGames(server)
}

let wsServer = new WebSocketServer({
  port: wsPort
})
// console.log((new Date()) + ' listening on ws://' + ipAddr + ':' + wsPort)

wsServer.on('connection', function connection(client, req) {
  let id
  if (client.upgradeReq) {
    id = client.upgradeReq.headers['sec-websocket-key']
  } else {
    client.upgradeReq = req;
    id = req.headers['sec-websocket-key']
  }
  clients[id] = client

  // Client sent message
  client.on('message', function incoming(message, flags) {
    handleMessage(wsServer, message, id, client)
  })

  // Client terminated connection
  client.on('close', function incoming(code, message) {
    handleClose(wsServer, id)
  })

  // New client gets an ID from the server
  let message = JSON.stringify({
    id: 'ID',
    from: 'SERVER',
    data: {
      id: id,
      ip: ipAddr,
      seq: (wsServer.clients.length ? wsServer.clients.length : wsServer.clients.size) - 1
    }
  })
  client.send(message)
  console.log('%s JOIN <%s> (%d players)', new Date().getTime(), message, (wsServer.clients.length ? wsServer.clients.length : wsServer.clients.size))
})

let httpsServer = https.createServer(options, function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url)
  response.writeHead(404)
  response.end()
})
httpsServer.listen(wssPort, function() {
  // console.log((new Date()) + ' listening on wss://' + ipAddr + ':' + wssPort)
})
let wssServer = new WebSocketServer({
  server: httpsServer
})

wssServer.on('connection', function connection(client, req) {
  let id
  if (client.upgradeReq) {
    id = client.upgradeReq.headers['sec-websocket-key']
  } else {
    client.upgradeReq = req;
    id = req.headers['sec-websocket-key']
  }
  clients[id] = client

  // Client sent message
  client.on('message', function incoming(message, flags) {
    handleMessage(wssServer, message, id, client)
  })

  // Client terminated connection
  client.on('close', function incoming(code, message) {
    handleClose(wssServer, id)
  })

  // New client gets an ID from the server
  let message = JSON.stringify({
    id: 'ID',
    from: 'SERVER',
    data: {
      id: id,
      ip: ipAddr,
      seq: (wssServer.clients.length ? wssServer.clients.length : wssServer.clients.size) - 1
    }
  })
  client.send(message)
  if (msgTrace) {
    console.log('%s SND <%s>', new Date().getTime(), message)
  }
})

function loadState() {
  fs.readFile(stateFile, 'utf-8', (err, data) => {
    if (err) {
      if (err.code == 'ENOENT') {
        saveState();
      } else {
        console.log(err, err.code);
      }
    } else {
      state = JSON.parse(data);
      // console.log("LOAD", state)
      for (let gameId in state.games) {
        if (gameId.startsWith('L-')) {
           delete(state.games[gameId])
        } else {
          state.games[gameId].players = []
        }
      }
      state.players = {}
      saveState();
    }
  });
}

function saveState() {
  fs.writeFile(stateFile, JSON.stringify(state), 'utf8', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      // console.log(stateFile + " updated");
    }
  });
}

let lut = []
for (let i = 0; i < 256; i++) {
  lut[i] = (i < 16 ? '0' : '') + (i).toString(16)
}

function guid7() {
  let d0 = Math.random() * 0xffffffff | 0
  let d1 = Math.random() * 0xffffffff | 0
  let d2 = Math.random() * 0xffffffff | 0
  let d3 = Math.random() * 0xffffffff | 0
  return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
    lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
    lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
    lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff]
}

function getIndex() {
  // let list = ""
  // for (let gameId in state.games) {
  //   if (gameId != -1) {
  //     let free = state.games[gameId].players.reduce((cnt, v) => v.active ? cnt : cnt + 1, 0)
  //     list += '<li><a href="' + state.games[gameId].html + '">' + state.games[gameId].name + ' (' + free + '/' + state.games[gameId].players.length + ' Spieler)</a></li>'
  //   }
  // }
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Multiplayer Game">
  <meta name="author" content="ByronStar">

  <title>Programmiersprachen - Multiplayer</title>
  <script type="text/javascript" src="lib/gameclient.js"></script>
  <link rel="stylesheet" href="client/css/progsp.css">
  <script>
  function init() {
    game = wsinit(onMove, null, document.getElementById('status'));
    game.gameId = -1;
    game.name = "Master";
    console.log(game);
  }
  function onMove(move) {
    switch (move.id) {
      default:
        console.log(move);
    }
  }
  </script>
</head>

<body class="progsp" onload="init()">
  <svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-960 -600 1920 1200">
    <g id="layer0">
      <circle id="status" cx="930" cy="-570" r=10 fill="red"></circle>
    </g>
  </svg>
  <div class="overlay" style="margin: 40px;">
    <h1>Verfügbare Spiele</h1>
    <div>
      <ol id="games">
      </ol>
    </div>
  </div>
</body>

</html>`
}
