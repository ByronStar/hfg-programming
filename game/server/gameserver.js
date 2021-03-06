"use strict"
let lib = 'MultiplayerGame'
let httpPort = 8090
let httpsPort = 8091
let stateFile = './gamestate.json'
let studentsFile = './students.txt'
let subscriber = [];

let actVersion = 'v1.0.1'
let msgTrace = false

const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server
const https = require('https')
const fs = require('fs')
const forge = require('node-forge')
const bcrypt = require('bcryptjs');
const spawn = require('child_process').spawn

const http = require('http')
const url = require("url")
const path = require("path")

let httpServer, httpsServer

let hostname = require('os').hostname()
let ifs = require('os').networkInterfaces()
// console.log(ifs)

let options = {}
let ipAddr = '127.0.0.1'
if (process.argv.length < 3 || process.argv[2] != '-local') {
  let ipAddrs = Object.keys(ifs).map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0]).filter(x => x)
  // console.log(ipAddrs)
  if (ipAddrs.length == 0) {
    console.log("Keine IP Adresse vorhanden: Mit dem Netz verbinden oder Server mit der Option '-local' starten.")
    process.exit(-1)
  }
  ipAddr = ipAddrs[0].address
}
if (process.argv.length > 2 && process.argv[2] == '-trace' || process.argv.length > 3 && process.argv[3] == '-trace') {
  msgTrace = true
}

let clients = {}
// track active IP Addresses
let active = {}

let contentTypesByExtension = {
  '.html': "text/html",
  '.css': "text/css",
  '.js': "text/javascript",
  '.json': "application/json",
  '.pem': "application/x-x509-ca-cert"
}

let state
loadState()

function setupServers() {
  let firstTime = ipAddr != state.ipAddr
  if (fs.existsSync('/etc/letsencrypt/live/' + state.domain + '/privkey.pem')) {
    options = {
      key: fs.readFileSync('/etc/letsencrypt/live/' + state.domain + '/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/' + state.domain + '/fullchain.pem')
    }
    if (state.domain) {
      ipAddr = state.domain
    }
  } else {
    if (!fs.existsSync('progsp.hfg-gmuend.de.key') || (ipAddr != '127.0.0.1' && ipAddr != state.ipAddr)) {
      //createCA('hfg.hopto.org', ipAddr)
      // generate a key pair
      let keys = forge.pki.rsa.generateKeyPair(2048)
      fs.writeFileSync('progsp.hfg-gmuend.de.key', forge.pki.privateKeyToPem(keys.privateKey), 'utf8')

      // create a certification request (CSR)
      let csr = forge.pki.createCertificationRequest()
      csr.publicKey = keys.publicKey
      csr.setSubject(getSubject(ipAddr))
      csr.setAttributes(getAttrs(false, ipAddr))
      csr.sign(keys.privateKey)

      // let caCert = forge.pki.certificateFromPem(fs.readFileSync('rootCA.pem', 'utf8'))
      let caCert = forge.pki.certificateFromPem(rootCA())
      let issuer = caCert.subject.attributes

      //let caPrivateKey = forge.pki.privateKeyFromPem(fs.readFileSync('rootCA.key', 'utf8'))
      let caPrivateKey = forge.pki.privateKeyFromPem(rootKeys())
      let cert = createCert(csr.publicKey, caPrivateKey, csr.subject.attributes, issuer, csr.getAttribute({
        name: 'extensionRequest'
      }).extensions, 1)
      fs.writeFileSync('progsp.hfg-gmuend.de.pem', forge.pki.certificateToPem(cert))
      state.ipAddr = ipAddr
      saveState()
    }

    options = {
      key: fs.readFileSync('./progsp.hfg-gmuend.de.key'),
      cert: fs.readFileSync('./progsp.hfg-gmuend.de.pem')
    }
  }

  // Self signed root certificate only
  // ig1:$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC
  httpServer = http.createServer(function(request, response) {
    var userpass = Buffer.from((request.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
    if (!bcrypt.compareSync(userpass, '$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC')) {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="HfG ' + lib + '"' });
      response.end('HTTP Error 401 Unauthorized: Access is denied');
    } else {
      let pathname = url.parse(decodeURIComponent(request.url)).pathname
      if (pathname == '/' || pathname == '/rootCA') {
        response.writeHead(200, {
          "Content-Type": "application/x-x509-ca-cert"
        })
        response.write(rootCA())
        response.end()
      } else {
        response.writeHead(404, {
          "Content-Type": "text/plain"
        })
        response.write("404 Not Found\n")
        response.end()
      }
    }
  })
  httpServer.listen(httpPort)
  console.log((new Date()) + ' ' + lib + ' Server erreichbar unter http://' + ipAddr + ':' + httpPort)

  // Byron:$2a$08$5IZmi9StV.mBmOSmZQ.hfeENTxsGzBa647uJFzbIpRUgSEwdS1L32
  // Bene:$2a$10$yJv.PbSvcZpc3THj8iPukeEGR7cM/9GoUgKcAnEs4TA90GvPr4eFi
  // ig1:$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC
  httpsServer = https.createServer(options, function(request, response) {
    // console.log(decodeURIComponent(request.url))
    var userpass = Buffer.from((request.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
    if (bcrypt.compareSync(userpass, '$2a$08$5IZmi9StV.mBmOSmZQ.hfeENTxsGzBa647uJFzbIpRUgSEwdS1L32') ||
      bcrypt.compareSync(userpass, '$2a$10$yJv.PbSvcZpc3THj8iPukeEGR7cM/9GoUgKcAnEs4TA90GvPr4eFi') ||
      bcrypt.compareSync(userpass, '$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC')) {
      let actUrl = url.parse(decodeURIComponent(request.url), true)
      let pathname = actUrl.pathname
      switch (pathname) {
        case '/':
        case '/index.html':
          response.writeHead(200, {
            "Content-Type": "text/html"
          })
          response.write(getIndex())
          response.end()
          break
        case '/student.id':
          response.writeHead(200, {
            "Content-Type": "application/octet-stream"
          })
          // for (let key in actUrl.query) {
          //   console.log(key, actUrl.query[key])
          // }
          response.write(actUrl.query.id)
          response.end()
          break
        case '/studentIds.html':
          response.writeHead(200, {
            "Content-Type": "text/html"
          })
          response.write(getIds())
          response.end()
          break
        case '/gameserver.js':
          sendResponse(response, 'lib/gameserver.js', "application/octet-stream")
          break
        case '/state.json':
          response.writeHead(200, {
            "Content-Type": contentTypesByExtension['.json']
          })
          response.write(JSON.stringify(state))
          response.end()
          break
        default:
          let filename
          if (pathname.startsWith('/client')) {
            filename = ".." + pathname
          } else {
            filename = "../client" + pathname
          }
          filename = path.join(process.cwd(), filename)
          // console.log(pathname, filename)
          sendResponse(response, filename)
          break
      }
    } else {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="HfG ' + lib + '"' });
      response.end('HTTP Error 401 Unauthorized: Access is denied');
    }
  })
  httpsServer.listen(httpsPort)
  console.log((new Date()) + ' ' + lib + ' Server erreichbar unter https://' + ipAddr + ':' + httpsPort)

  let wsServer = new WebSocketServer({
    server: httpServer
  })

  wsServer.on('connection', function connection(client, req) {
    client.isAlive = true
    let id
    // console.log(req.headers)
    if (client.upgradeReq) {
      id = client.upgradeReq.headers['sec-websocket-key']
    } else {
      client.upgradeReq = req
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

    // Client did sent a hearbeat
    client.on('pong', () => {
      // console.log("PONG", id)
      client.isAlive = true
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
    console.log('%s JOIN <%s> (%d clients)', new Date().getTime(), message, (wsServer.clients.length ? wsServer.clients.length : wsServer.clients.size))
  })

  let wssServer = new WebSocketServer({
    server: httpsServer
  })

  wssServer.on('connection', function connection(client, req) {
    client.isAlive = true
    let id
    // console.log(req.headers)
    if (client.upgradeReq) {
      id = client.upgradeReq.headers['sec-websocket-key']
    } else {
      client.upgradeReq = req
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

    // Client did sent a hearbeat
    client.on('pong', () => {
      // console.log(new Date().getTime(), "PONG", id)
      client.isAlive = true
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

  function noop() {}

  // Send hearbeat pings and keep track of pong responsed / terminate unresponsive clients
  // As a sideeffect nginx proxy_read_timeout does not need to be increased
  setInterval(function ping() {
    wsServer.clients.forEach(function each(client) {
      if (client.isAlive === false) {
        console.log(new Date().getTime(), "TERM", client.upgradeReq.headers['sec-websocket-key'])
        return client.terminate();
      }
      client.isAlive = false;
      // console.log(new Date().getTime(), "PING", client.upgradeReq.headers['sec-websocket-key'])
      client.ping(noop);
    })
    wssServer.clients.forEach(function each(client) {
      if (client.isAlive === false) {
        console.log(new Date().getTime(), "TERM", client.upgradeReq.headers['sec-websocket-key'])
        return client.terminate();
      }
      client.isAlive = false;
      // console.log(new Date().getTime(), "PING", client.upgradeReq.headers['sec-websocket-key'])
      client.ping(noop);
    })
  }, 30000)

  if (actVersion != state.version) {
    announce("Es gibt eine neue Version der " + lib + " Library. Bitte von https://" + state.domain + ":" + httpsPort + "/gameserver.js herunterladen und in euren 'student/lib' Ordner kopieren.", "#2020ss-ig1-programmiersprachen-1")
    //announce("Es gibt eine neue Version der " + lib + " Library. Bitte von https://" + state.domain + ":" + httpsPort + "/gameserver.js herunterladen und in euren 'student/lib' Ordner kopieren.", "@benno.staebler")
    state.version = actVersion
    saveState()
  }
  // if (firstTime && ipAddr != '127.0.0.1') {
  //   if (state.domain) {
  //     announce("Neuer externer " + lib + " Server `https://" + state.domain + ":" + httpsPort + "`", "#99_benno")
  //   } else {
  //     announce("Neuer lokaler " + lib + " Server " + ipAddr + " - <https://" + ipAddr + ":" + httpsPort + "|Ausprobieren> (wenn Du im gleichen Netz bist)", "#99_benno")
  //   }
  // }
}

function sendResponse(response, filename, contentType) {
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
      contentType = contentType || contentTypesByExtension[path.extname(filename)]
      if (contentType) {
        headers["Content-Type"] = contentType
      }
      response.writeHead(200, headers)
      response.write(file, "binary")
      response.end()
    })
  })
}

function broadcast(server, message) {
  if (msgTrace) {
    console.log('%s SND <%s> (%d clients)', new Date().getTime(), message, (server.clients.length ? server.clients.length : server.clients.size))
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
      if (clients[id]) {
        clients[id].send(message)
      }
    } catch (e) {
      console.log(e)
    }
  })
}

function spawnGame(id, run) {
  let child = spawn(run.cmd, run.args, run.options)
  let name = state.games[state.players[id]].name
  child.stdout.setEncoding('utf8')

  /*
  let text
    child.stdout.on('data', (data) => {
      console.log(`${name} data:\n${data}`)
      if (data.startsWith("Your score")) {
        clients[id].send(JSON.stringify({
          id: 'MOVE',
          data: { id: 'OUTPUT', text: text, score: data }
        }))
      } else {
        text = data
        child.stdin.write("score\n")
      }
    })
  */
  child.stdout.on('data', (data) => {
    // console.log(`${name} data:\n${data}`)
    clients[id].send(JSON.stringify({
      id: 'MOVE',
      data: { id: 'OUTPUT', text: data }
    }))
  })

  child.stderr.on('data', (data) => {
    console.log(`${name} error: ${data}`)
    clients[id].send(JSON.stringify({
      id: 'MOVE',
      data: { id: 'ERROR', text: data }
    }))
  })

  child.on('close', (code) => {
    console.log(`${name} exit(${code})`)
    if (clients[id]) {
      clients[id].send(JSON.stringify({
        id: 'MOVE',
        data: { id: 'END' }
      }))
    }
  })

  clients[id].send(JSON.stringify({
    id: 'MOVE',
    data: { id: 'BEG' }
  }))
  return child
}

function handleMessage(server, message, id, client) {
  let ip = client.upgradeReq.connection.remoteAddress
  if (msgTrace) {
    console.log('%s REC <%s>', new Date().getTime(), message.replace(/"code":"[^"]+"/, '"code":"..."'))
  }
  let msg = JSON.parse(message)
  if (!active[ip]) {
    active[ip] = true
    switch (msg.id) {
      case 'JOIN':
        state.players[id] = msg.data.game
        if (!(msg.data.game in state.games)) {
          // not yet published game
          state.games[msg.data.game] = {
            id: msg.data.game,
            name: msg.data.gameName,
            players: []
          }
        }
        let player = {
          id: id,
          name: msg.data.name,
          // game: msg.data.game,
          active: false,
          group: []
        }
        state.games[msg.data.game].players.push(player)
        // saveState()
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
      case 'START':
        msg.data.players = updatePlayers(msg.data.player)
        forward(server, JSON.stringify(msg), [msg.from])
        updateGames(server)
        if (msg.data.player.run) {
          state.games[state.players[id]].child = spawnGame(id, msg.data.player.run)
          // console.log(state.games[state.players[id]])
        }
        break
      case 'DECLINE':
        forward(server, message, [msg.data.to])
        updateGames(server)
        break
      case 'MOVE':
        let gameId = state.players[id]
        if (state.games[gameId].child) {
          state.games[gameId].child.stdin.write(msg.data.text)
        } else {
          forward(server, message, msg.data.group)
        }
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
            break
          }
          state.games[msg.data.game].version++
        } else {
          state.games[msg.data.game] = {
            id: msg.data.game,
            players: [],
            version: 0
          }
          //announce("Neues Spiel verfügbar <https://alert-system.com/alerts/1234|Click here>")
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
            break
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
              data: {
                rc: -1,
                msg: err
              }
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
        })
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
  if (state.games[gameId].child) {
    state.games[gameId].child.kill('SIGINT')
  }
  delete state.players[id]
  state.games[gameId].players = state.games[gameId].players.filter(v => v.id !== id)
  let message = JSON.stringify({
    id: 'EXIT',
    from: 'SERVER',
    data: {
      id: id,
      players: state.games[gameId].players
    }
  })
  console.log('%s EXIT <%s> (%d players)', new Date().getTime(), message, (server.clients.length ? server.clients.length : server.clients.size))
  // Forward message to affected players: Client has left
  forward(server, message, state.games[gameId].players.map(v => v.id))
  updateGames(server)
}

function createState() {
  state = {
    ipAddr: '0.0.0.0',
    domain: hostname,
    xslack: '',
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
  saveState()
}

function loadState() {
  fs.readFile(stateFile, 'utf-8', (err, data) => {
    if (err) {
      if (err.code == 'ENOENT') {
        createState();
      } else {
        console.log(err, err.code)
      }
    } else {
      state = JSON.parse(data)
      // console.log("LOAD", state)
      for (let gameId in state.games) {
        if (gameId.startsWith('L-')) {
          delete(state.games[gameId])
        } else {
          state.games[gameId].players = []
        }
      }
      state.players = {}
      saveState()
      setupServers()
    }
  })
}

function announce(info, channel) {
  // console.log(info, channel)
  if (state.slack) {
    if (null == channel) {
      channel = "#programmieren"
    }

    let data = {
      channel: channel,
      username: lib,
      text: info
      // icon_emoji: ":ghost:"
      // ,attachments: [{
      //   fallback: "New open task [Urgent]: <http://url_to_task|Test out Slack message attachments>",
      //   pretext: "New open task [Urgent]: <http://url_to_task|Test out Slack message attachments>",
      //   color: "#D00000",
      //   fields: [{
      //     title: "Notes",
      //     value: "This is much easier than I thought it would be.",
      //     short: false
      //   }]
      // }]
    }
    data = JSON.stringify(data)
    let options = {
      hostname: 'hooks.slack.com',
      port: 443,
      path: '/services/' + state.slack,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': data.length
      }
    }
    // console.log(options, data)

    let req = https.request(options, (res) => {
      console.log('Slack Announcement:', res.statusCode)
      if (res.statusCode != "200") {
        console.log(data, res.headers)
      }
      // console.log('headers:', res.headers)

      // res.on('data', (d) => {
      //   process.stdout.write(d)
      // })
    })

    req.on('error', (e) => {
      console.error(e)
    });

    req.write(data)
    req.end()
  }
}

function saveState() {
  subscriber.forEach(sId => {
    clients[sId].send(JSON.stringify({
      id: 'STATE',
      from: 'SERVER',
      data: state
    }))
  });
  fs.writeFileSync(stateFile, JSON.stringify(state), { encoding: 'utf8', flag: 'w' })
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

function getIds() {
  let list = ''
  for (let id in state.students) {
    list += '<li><a href="/student.id?id=' + id + '">' + state.students[id].name + '</a>'
  }
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="HfG GameServer">
  <meta name="author" content="ByronStar">

  <title>WebTechnology - Multiplayer Game</title>
  <script type="text/javascript" src="/client/lib/gameserver.js"></script>
  <script>Homeworks.gc.noMenu=true</script>
  <link rel="stylesheet" href="/client/css/progsp.css">
</head>

<body class="progsp">
  <div class="overlay" style="margin: 40px;">
    <h1>Id Dateien für Spiele</h1>
    <p>Damit Deine Spiele richtig zugeordnet werden können, benötigst Du Deine 'student.id' Datei im 'data' Unterverzeichnis
    Deines 'student' Ordners für IG4 WebTechnology.<br>Klicke in der Liste auf Deinen Namen, dann wird Deine 'student.id' Datei im 'Download' Ordner
    deines Rechners abgelelegt und Du kannst sie anschliessend in das 'data' Unterverzeichnis verschieben oder kopieren.
    <p>Diese Seite kannst Du nach dem Download schliessen.
    <div>
      <ul id="idlist">
      ${list}
      </ul>
    </div>
  </div>
</body>
</html>`
}

function getIndex() {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="WebTechnology - Multiplayer Game">
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

function createCert(publicKey, privateKey, subject, issuer, extensions, years) {
  let cert = forge.pki.createCertificate()
  cert.publicKey = publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + years)
  cert.setSubject(subject)
  cert.setIssuer(issuer)
  cert.setExtensions(extensions)
  cert.sign(privateKey, forge.md.sha256.create())
  return cert
}

function createCA(commonName, ipAddr) {
  // generate a key pair
  let rootKeys = forge.pki.rsa.generateKeyPair(4096)
  save('rootCA.key', forge.pki.privateKeyToPem(rootKeys.privateKey))
  let rootCA = createCert(rootKeys.publicKey, rootKeys.privateKey, getSubject(commonName), getSubject(commonName), getExtensions(true, ipAddr), 2)
  save('rootCA.pem', forge.pki.certificateToPem(rootCA))
}

function getSubject(commonName) {
  return [{
    name: 'countryName',
    value: 'DE'
  }, {
    shortName: 'ST',
    value: 'BW'
  }, {
    name: 'localityName',
    value: 'Schwäbisch Gmünd'
  }, {
    name: 'organizationName',
    value: 'HfG'
  }, {
    shortName: 'OU',
    value: 'IG1'
  }, {
    name: 'commonName',
    value: commonName
  }, {
    name: 'emailAddress',
    value: 'benno.staebler@hfg-gmuend.de'
  }]
}

function getAttrs(cA, ipAddr) {
  return [{
    name: 'extensionRequest',
    extensions: getExtensions(cA, ipAddr)
  }]
}

function getExtensions(cA, ipAddr) {
  return [{
    //   name: 'authorityKeyIdentifier',
    //   value: 'keyid,issuer'
    // }, {
    name: 'basicConstraints',
    cA: cA
  }, {
    name: 'keyUsage',
    digitalSignature: true,
    keyEncipherment: true,
  }, {
    name: 'subjectAltName',
    altNames: [{
      // 1 email, 2 is DNS type, 6: URI, 7: IP Address
      type: 2,
      value: 'progsp.hfg-gmuend.de'
    }, {
      type: 2,
      value: 'hfg.hopto.org',
    }, {
      type: 7,
      ip: ipAddr
    }]
    // }, {
    //   name: 'subjectKeyIdentifier',
    //   value: 'hash'
  }]
}

//let extensions = csr.getAttribute({ name: 'extensionRequest' }).extensions
// optionally add more extensions
// extensions.push.apply(extensions, [{
//   name: 'basicConstraints',
//   cA: true
// }, {
//   name: 'keyUsage',
//   keyCertSign: true,
//   digitalSignature: true,
//   nonRepudiation: true,
//   keyEncipherment: true,
//   dataEncipherment: true
// }])

function rootKeys() {
  return `-----BEGIN RSA PRIVATE KEY-----
MIIJKAIBAAKCAgEA7MrWiGYZxbAQNHtg6cbtKC8Ot+3ev8VfGb/HX0/FQ3jEi/Dc
kvoBAuAp8s5FVpe6As0jGD0JImMGT1jrzNgcI5g+Aolq5zjerf5RMXb9tz6WfPGF
sNAd2yUbS5h2mWacRO3YgDBc6ageLGp0un7Twk9qG/b/k3uf87Foobg4o+YIxFT6
9mxgdtcRtTX/RpbmUv9RKUc+aITCaHmOcPHgTQgbLnU+RuXcQTiiasYK5sPoVcCH
HUXI0/lngq8vy4n38BDeqaWlp0HzhNQF4kKDhG4DPjENEgcqKDJT4K+IWqOypvat
fMrOn1Y3rVNDBr4De9yqro3cdgf7KMdLZeFZ8MWSiUGiDbo1VeLNk2RaIUTNcrUE
EEXW1cWykHRb2z27fd0MzofoKhRhSYIGbj2sDkB1i6R/oluLKK0KbJSh5aSSswQu
ITl2Jt/AqYKZHOIZXoDqFvRIK2a1/OnUXJqwLENB5PI994bvhW1YSTDfO5ltLTPW
AhtUbGuWqxsSFSlIe/Hq/4RI7OuHSOQvrLlsmRqecU0+2vkXQJJM10p5VVXBYDRS
mBXfdpp/F/z0t7iRsaUPj15LTiJzACg/xyEKdj9KuFA3HXazrwqaI3UqbMJIeRsQ
jSOjATE5lt3jgCLajZag8d1pwluZlbLLgnSRmh7PKY90KiLQQwBvudniRq8CAwEA
AQKCAgBSsmRKLp5BlEOUkKJAAuFAb27MfZ6VivCzpW6TsuBJuBusY+okynsf7fm4
eqFspICqCcp/5JEUGVFS1NNFLxRkuf6uFB/psMrUKUVh6RSispEMAa2XGpfSuRrX
Q9/noxZgXFCINFu+nqArEuLBXxnFesasDY8kisBJ82N/Vz8wvl3Bc4xSE3d9CY99
oeYNWRYHVnOZ3u/EwNjEc+9zMoYLYRFdIEUnrY9Gl+jhMVkNTs4NZLfLWVvR7ABi
e5xNkVmt1bZtuRQpXbcWZJXJd0FHNsSbK7ZM3YOzliAFEEimnxT9ipj8RDf1Hb9E
IRf/eszsrRxO6excrFzi2PdUFWe7Kst/w6mB/gA4RbpSCimzMptD+6bBy7LHNihC
fYoIDgR+j+svsPxWIcvuU+iUYrjN/ABaDsIO8L47Uy/Fo8z29gEEB+slSnE8MbDb
C7nbiMw0NYnJk22/Of7SeC4iGKqWfC2E0x5i9zdaMx6bYcEEuZBOkvXsb/D9Ehj3
J+7Ivi8F4RE984JAU9ViqN/+64H4oh53oRn6l88nZD01sC42EUvkjjL0P9mKJhXs
qTomdDjQL5Te9JkzPUxG1Ffmy3fFHhHUpDWRfEo3k/tM/yfhb66Y1GdqHohZ9gkM
CR4LW6Y4vhb2zEi97zp9BV5C2Jrl2UfLQO0xA8+qo9Di++GdAQKCAQEA9yFf0Vts
0bVzbbxFwL6+jmf+MsKb4+Xwlilnq5G+KfCGX+gdhFh5MzFTAE0Am3d3Y2JNsDml
341u9qXWU0HGz5CKJt/V6dMDZJkGNyJeortcm1hwARP56HDtB035NUOszPD63W3I
vtiU71qdHV6P5jpZTmgur+fp7VkSr+0Hoj0Hc2NShsn3bpPZM17kvd+hZbhsz/2R
pNv16UtnC7nW3jdS1jx888ZPuncsRh5L9kqKMuq5KaHBXIEbFEYLoZX3npl8PmET
MXrxKqqBXo7KgUSpbR/L9rSAfhgdRfWuuP1nLzDod6gx+Y8ztU8BhabHiVezD4bV
wItVk2nK0jTYnwKCAQEA9Up6bTgovj2ZjgDXefUSwmdZlnKEjQTRCtrvobna855x
we7rN9yQPZim9iYkZxdSW7Tz4Bgy2zqGmp6mUljuY/8YNf0q8lOyQdTn9qwUvoUk
r0cJUZys41BJV3ewLsoDXkp17h9NxKnZMy1hoB1dpS76g8HDmw47aYDeplBDhHPU
86sH7/t4mLcN/7Tdr9deNDzK9X9BE7KTjDs4cHRwyDpCw2HeE7eB+BmbXxJgJRI4
+rjaCXEuCBNQW038md4S1FVmDq36riOruwnW8Wtl3ELMg50ykZFwV9QNY4909msD
0R2pQq924bj/p3XKUaNYk7QUPlV2Mh8vPl11MgoH8QKCAQBSmMT9pCDqtkquEo79
rMLjtb4wGPshYGjYx13u6fc07T78Lwgug6N+iK3FG/dn/rXYcbKlg5786Lh9l0/a
49Ee7qA9/fHxBKXNqZd6NfKLUTPSd+x3b8XG+nc+ScFRHB1VIfW2rEq7/odIuHBq
sIBH4piWrBtuj4SP34VvZzl18A/dcQTUKAya2K9vi/fHvkajSNCVc5qKDzpRjvIR
6Tr3amY1VGIu18kt+UbC6L1aw+8MtYbNc1K9KCl0zTR1/TmVuJbeAnP3xa91Iye6
At+L9PbrkgUJn6qSelzOVR7glVE3ZJFN7NlHH6WYo59OnD90l+sw9U/b2rXvXxx6
xU7hAoIBAEBo2zb8zS4PTNgN/obmxJNJwiuQTKAfCKlaDhygig74pxRuoVNc1n9m
K0ltgJeVdynfnT5V/Fy2xIurZy8ubQLTBE+A+BsDwUYqGvMaAqR4n8Zq19aXVoqm
FWwjYJ8YqsPCt67ch3ZBx2f53a3GqEVszZl1cuCvXwh4L37qiqAoLl4BpibtGKC5
SLLBkojO+8ypvf2y+aqrdLUZA9v7p3XcXpWhiEgTIsy8JKFVWOvDGjUz/wUFtDmo
oKwpEVByEO2yswbdxnqdoUWO8uMX+XpaDAvvZkz1LNPTOeTP0b23IhxyNnTtUEE7
a95UPtkrFGJMohgwJsZIjAZLUi/elHECggEBALnq1kYSD0a7wS68y+z5XcE7mLb5
65DcvsXq6KVDCIB4Cwajgdz2+2EfKyf3wv5y7uo8v+LLH3Ry1Uqb2U6avGQGCAfB
hmLlvZCIpEPQb0kNOeNcLkx1H/TGGM9jQs0eM/t4fBjLHZsOAPkNxC3L5/3TlfzE
xa+iW2zgHEXnS5A3iC7js2bIDJCS4L6ol0VBhCD3VTArGO2l/OXj5CcRmoiCpI9N
k1qnAQtw+0y/J8je4HdMGd8mjeR1SfrwzXQegLdidBT8rxowflJqO5Jo2rnwb4mG
hneLvbXbAdDqMTkKkfyS1ZDu3C8Rolm7T9cde6GhlCAyL5JenNB5IMoZLx8=
-----END RSA PRIVATE KEY-----`
}

function rootCA() {
  return `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`
}
