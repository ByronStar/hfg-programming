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

let ipAddr = Object.keys(ifs).map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0]).filter(x => x)[0].address
let ipPort = 8091

let clients = {}
let players = []
// track active IP Addresses
let active = {}

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

  let uri = "/../client/" + url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri)

  console.log(filename)

  let contentTypesByExtension = {
    '.html': "text/html",
    '.css': "text/css",
    '.js': "text/javascript"
  }

  fs.exists(filename, function(exists) {
    if (!exists) {
      response.writeHead(404, { "Content-Type": "text/plain" })
      response.write("404 Not Found\n")
      response.end()
      return
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html'

    fs.readFile(filename, "binary", function(err, file) {
      if (err) {
        response.writeHead(500, { "Content-Type": "text/plain" })
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
        players.push({
          id: id,
          name: msg.data.name,
          active: false,
          group: []
        })
        broadcast(server,
          JSON.stringify({
            id: 'PLAYERS',
            from: 'SERVER',
            data: { players: players }
          }))
        break
      case 'UPDATE':
        msg.id = 'PLAYERS'
      case 'PREPARE':
      case 'ACCEPT':
        let idx = players.findIndex(v => v.id === id)
        players[idx] = msg.data.player
        msg.data.players = players
        broadcast(server, JSON.stringify(msg))
        break
      case 'DECLINE':
        broadcast(server, message)
        break
      case 'MOVE':
        forward(server, message, msg.data.group)
        break
      case 'RESTART':
        process.exit(msg.data.rc)
        break
      case 'STORE':
        let buff = new Buffer.from(msg.data.code, 'base64')
        fs.writeFile("../client" + msg.data.name, buff.toString('utf8'), 'utf8', (err, data) => {
          if (err) {
            console.log(err)
          } else {
            console.log("client" + msg.data.name + " updated.")
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

function handleClose(server, id) {
  // console.log(code, message)
  delete clients[id]
  players = players.filter(v => v.id !== id)

  let message = JSON.stringify({
    id: 'EXIT',
    from: 'SERVER',
    data: { id: id, players: players }
  });
  console.log('%s EXIT <%s> (%d clients)', new Date().getTime(), message, server.clients.size)
  // Broadcast: Client has left
  broadcast(server, message)
}

let wsServer = new WebSocketServer({ port: wsPort })
console.log((new Date()) + ' listening on port ws://' + wsPort)

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
  console.log((new Date()) + ' listening on port wss://' + wssPort)
})
let wssServer = new WebSocketServer({ server: httpsServer })

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
      seq: wsServer.clients.size - 1
    }
  })
  client.send(message)
  if (msgTrace) {
    console.log('%s SND <%s>', new Date().getTime(), message)
  }
})
