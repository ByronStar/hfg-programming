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
let ipPort = 8091

let clients = {}
let games = {}
let players = []
// track active IP Addresses
let active = {}

let state = { games: {}, names: {} }
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

// https.createServer(options, function (request, response) {
http.createServer(function(request, response) {

  let uri = "/../" + url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri)

  console.log(filename)

  let contentTypesByExtension = {
    '.html': "text/html",
    '.css': "text/css",
    '.js': "text/javascript"
  }

  fs.exists(filename, function(exists) {
    if (!exists) {
      response.writeHead(404, {
        "Content-Type": "text/plain"
      })
      response.write("404 Not Found\n")
      response.end()
      return
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html'

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
}).listen(ipPort, ipAddr)

console.log((new Date()) + ' listening on http://' + ipAddr + ':' + ipPort + "/progsp_game.html")

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
    console.log('%s FWD <%s> (%d clients)', new Date().getTime(), message, active.length)
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
        if (!(msg.data.game in games)) {
          games[msg.data.game] = {
            players: []
          }
        }
        games[msg.data.game].players.push({
          id: id,
          name: msg.data.name,
          game: msg.data.game,
          active: false,
          group: []
        });
        players.push({
          id: id,
          name: msg.data.name,
          game: msg.data.game,
          active: false,
          group: []
        })
        broadcast(server,
          JSON.stringify({
            id: 'PLAYERS',
            from: 'SERVER',
            data: {
              players: players
            }
          }))
        break
      case 'UPDATE':
        msg.id = 'PLAYERS'
        msg.data.players = updatePlayers(msg.data.player)
        broadcast(server, JSON.stringify(msg))
        break
      case 'PREPARE':
      case 'ACCEPT':
        msg.data.players = updatePlayers(msg.data.player)
        forward(server, JSON.stringify(msg), [msg.data.to])
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
      case 'STORE':
        let part = msg.data.name.endsWith('.js') ? 'js' : 'html'
        if (msg.data.game in state.games) {
          if (state.games[msg.data.game][part] != undefined && state.games[msg.data.game][part] != msg.data.name) {
            if (part == 'html') { // This is unsave: Split STORE in STORE_CHK and STORE
              client.send(JSON.stringify({
                id: 'STORE',
                from: 'SERVER',
                data: {
                  rc: -1,
                  msg: "Ein Spiel mit der selben ID existiert bereits unter einem anderen Namen: '" + state.games[msg.data.game][part] +
                    "'.\nEventuell im Javascript \ngame.gameId = '" + msg.data.game + "';\n durch \ngame.gameId = '" + guid7() + "';\n ersetzen!"
                }
              }))
            }
            break;
          }
        } else {
          state.games[msg.data.game] = { id: msg.data.game }
        }
        if (msg.data.name in state.names) {
          if (state.names[msg.data.name] != msg.data.game) {
            if (part == 'html') {
              client.send(JSON.stringify({
                id: 'STORE',
                from: 'SERVER',
                data: {
                  rc: -2,
                  msg: 'Ein Spiel mit dem selben Namen "' + msg.data.name + '" existiert bereits unter einer anderen ID: ' + state.names[msg.data.name] +
                    "'.\nEventuell HTML und Javascript umbenennen."
                }
              }))
            }
            break;
          }
        } else {
          state.names[msg.data.name] = msg.data.game
        }
        state.games[msg.data.game][part] = msg.data.name
        saveState();
        let buff = Buffer.from(msg.data.code, 'base64')
        //console.log(msg.data.code, buff, buff.toString(), buff.toString('utf-8'))
        fs.writeFile(".." + msg.data.name, buff.toString('utf-8'), 'utf8', (err, data) => {
          if (err) {
            console.log(err)
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: { rc: -1, msg: err }
            }))
          } else {
            console.log(msg.data.name + " saved.")
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
  let idx = players.findIndex(v => v.id === player.id)
  players[idx] = player
  return players
}

function handleClose(server, id) {
  // console.log(code, message)
  delete clients[id]
  players = players.filter(v => v.id !== id)

  let message = JSON.stringify({
    id: 'EXIT',
    from: 'SERVER',
    data: {
      id: id,
      players: players
    }
  });
  console.log('%s EXIT <%s> (%d clients)', new Date().getTime(), message, server.clients.size)
  // Broadcast: Client has left
  broadcast(server, message)
}

let wsServer = new WebSocketServer({
  port: wsPort
})
console.log((new Date()) + ' listening on port ws://' + ipAddr + ':' + wsPort)

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
  console.log((new Date()) + ' listening on port wss://' + ipAddr + ':' + wssPort)
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
      state = JSON.parse(data);
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
