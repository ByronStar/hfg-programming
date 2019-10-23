"use strict"

let wsPort = 11203
let wssPort = 11204
let msgTrace = true

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
let ipPort = 8091

let clients = {}
// track active IP Addresses
let active = {}

let stateX = {
  games: {
    0: {
      id: 0,
      js: "/client/js/progsp_game.js",
      html: "/client/progsp_game.html",
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
  key: fs.readFileSync('./privkey.pem'),
  cert: fs.readFileSync('./fullchain.pem')
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

// https.createServer(options, function (request, response) {
http.createServer(function(request, response) {

  let pathname = url.parse(request.url).pathname,
    filename = path.join(process.cwd(), "/../" + pathname)

  console.log(url.parse(request.url).pathname, filename)

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
        filename += 'index.html'
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

console.log((new Date()) + ' listening on http://' + ipAddr + ':' + ipPort)

function broadcast(server, message) {
  if (msgTrace) {
    console.log('%s SND <%s> (%d clients)', new Date().getTime(), message, server.clients.size)
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
    console.log('%s FWD <%s> ([%s] %d clients)', new Date().getTime(), message, active, active.length)
  }
  active.forEach(function each(id) {
    try {
      clients[id].send(message)
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
        stateX.players[id] = msg.data.game
        if (!(msg.data.game in stateX.games)) {
          // not yet published game
          console.log("NEW")
          stateX.games[msg.data.game] = { id: msg.data.game, players: [] }
        }
        let player = {
          id: id,
          name: msg.data.name,
          // game: msg.data.game,
          active: false,
          group: []
        }
        console.log("+>", msg.data.game, stateX.games[msg.data.game].players)
        stateX.games[msg.data.game].players.push(player);
        console.log("+<", stateX.games[msg.data.game].players)
        // saveState();
        forward(server, JSON.stringify({
          id: 'PLAYERS',
          from: 'SERVER',
          data: {
            players: stateX.games[msg.data.game].players
          }
        }), stateX.games[msg.data.game].players.map(v => v.id))
        console.log("+<", stateX.games[msg.data.game].players)
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
        break
      case 'DECLINE':
        forward(server, message, [msg.data.to])
        break
      case 'MOVE':
        forward(server, message, msg.data.group)
        break
      case 'RESTART':
        process.exit(msg.data.rc)
        break
      case 'STATE':
        client.send(JSON.stringify({
          id: 'STATE',
          from: 'SERVER',
          data: stateX
        }))
        break
      case 'STORE':
        let part = msg.data.file.endsWith('.js') ? 'js' : 'html'
        if (msg.data.game in stateX.games) {
          if (stateX.games[msg.data.game][part] != undefined && stateX.games[msg.data.game][part] != msg.data.file) {
            if (part == 'html') { // This is unsave: Split STORE in STORE_CHK and STORE
              client.send(JSON.stringify({
                id: 'STORE',
                from: 'SERVER',
                data: {
                  rc: -1,
                  msg: "Ein Spiel mit der selben ID existiert bereits unter einem anderen Namen: '" + stateX.games[msg.data.game][part] +
                    "'.\nEventuell im Javascript \ngame.gameId = '" + msg.data.game + "';\n durch \ngame.gameId = '" + guid7() + "';\n ersetzen!"
                }
              }))
            }
            break;
          }
        } else {
          stateX.games[msg.data.game] = { id: msg.data.game, players: [] }
        }
        if (msg.data.file in stateX.files) {
          if (stateX.files[msg.data.file] != msg.data.game) {
            if (part == 'html') {
              client.send(JSON.stringify({
                id: 'STORE',
                from: 'SERVER',
                data: {
                  rc: -2,
                  msg: 'Ein Spiel mit dem selben Namen "' + msg.data.file + '" existiert bereits unter einer anderen ID: ' + stateX.files[msg.data.file] +
                    "'.\nEventuell HTML und Javascript umbenennen."
                }
              }))
            }
            break;
          }
        } else {
          stateX.files[msg.data.file] = msg.data.game
        }
        stateX.games[msg.data.game][part] = msg.data.file
        stateX.games[msg.data.game].name = msg.data.name
        saveState();
        let buff = Buffer.from(msg.data.code, 'base64')
        //console.log(msg.data.code, buff, buff.toString(), buff.toString('utf-8'))
        fs.writeFile(".." + msg.data.file, buff.toString('utf-8'), 'utf8', (err, data) => {
          if (err) {
            console.log(err)
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: { rc: -1, msg: err }
            }))
          } else {
            console.log(msg.data.file + " saved.")
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: { rc: 0, msg: '' }
            }))
          }
        });
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

function updatePlayers(player) {
  let gameId = stateX.players[player.id]
  let idx = stateX.games[gameId].players.findIndex(v => v.id === player.id)
  stateX.games[gameId].players[idx] = player
  return stateX.games[gameId].players
}

function handleClose(server, id) {
  delete clients[id]
  let gameId = stateX.players[id]
  console.log("->", gameId, stateX.games[gameId].players)
  delete stateX.players[id]
  stateX.games[gameId].players = stateX.games[gameId].players.filter(v => v.id !== id)
  let message = JSON.stringify({
    id: 'EXIT',
    from: 'SERVER',
    data: {
      id: id,
      players: stateX.games[gameId].players
    }
  });
  console.log("-<", stateX.games[gameId].players)
  console.log('%s EXIT <%s> (%d clients)', new Date().getTime(), message, server.clients.size)
  // Forward message to affected players: Client has left
  forward(server, message, stateX.games[gameId].players.map(v => v.id))
}

let wsServer = new WebSocketServer({
  port: wsPort
})
console.log((new Date()) + ' listening on ws://' + ipAddr + ':' + wsPort)

wsServer.on('connection', function connection(client, req) {
  client.upgradeReq = req;
  let id = req.headers['sec-websocket-key']
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
      seq: wsServer.clients.size - 1
    }
  })
  client.send(message)
  console.log('%s JOIN <%s> (%d clients)', new Date().getTime(), message, wsServer.clients.size)
})

let httpsServer = https.createServer(options, function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url)
  response.writeHead(404)
  response.end()
})
httpsServer.listen(wssPort, function() {
  console.log((new Date()) + ' listening on wss://' + ipAddr + ':' + wssPort)
})
let wssServer = new WebSocketServer({
  server: httpsServer
})

wssServer.on('connection', function connection(client, req) {
  client.upgradeReq = req;
  let id = req.headers['sec-websocket-key']
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
      seq: wsServer.clients.size - 1
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
      console.log(err);
    } else {
      stateX = JSON.parse(data);
      console.log("LOAD", stateX)
      for (let gameId in stateX.games) {
        stateX.games[gameId].players = []
      }
      stateX.players = {}
      saveState();
    }
  });
}

function saveState() {
  fs.writeFile(stateFile, JSON.stringify(stateX), 'utf8', (err, data) => {
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
  let list = ""
  for (let gameId in stateX.games) {
    list += '<li><a href="' + stateX.games[gameId].html + '">' + stateX.games[gameId].name + ' (' + stateX.games[gameId].players.length + ' Spieler)</a></li>'
    stateX.games[gameId].players = []
  }
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
  <link rel="stylesheet" href="client/css/progsp.css">
</head>

<body class="progsp" style="margin: 40px;">
  <h1>Verfügbare Spiele</h1>
  <div>
    <ol id="games">
    ${list}
    </ol>
  </div>
</body>

</html>`
}
