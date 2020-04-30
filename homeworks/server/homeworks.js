"use strict"

let httpPort = 11203
let httpsPort = 11204

let msgTrace = false

const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server
const https = require('https')
const fs = require('fs')
const forge = require('node-forge')
const bcrypt = require('bcryptjs');

const http = require('http')
const url = require("url")
const path = require("path")

let httpServer, httpsServer

let hostname = require('os').hostname()
let ifs = require('os').networkInterfaces()
// console.log(ifs)

let options = {}
let ipAddr = 'localhost'
if (process.argv.length < 3 || process.argv[2] != '-local') {
  let ipAddrs = Object.keys(ifs).map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0]).filter(x => x)
  // console.log(ipAddrs)
  if (ipAddrs.length == 0) {
    console.log("Keine IP Adresse vorhanden: Mit dem Netz verbinden oder Server mit der Option '-local' starten.")
    process.exit(-1)
  }
  ipAddr = ipAddrs[0].address
}
if (process.argv.length > 2 && process.argv[2] == '-trace') {
  msgTrace = true
}

let clients = {}
// track active IP Addresses
let active = {}
let subscriber = [];

let contentTypesByExtension = {
  '.html': "text/html",
  '.css': "text/css",
  '.js': "text/javascript",
  '.json': "application/json",
  '.pem': "application/x-x509-ca-cert"
}

let state
let stateFile = './homeworks.json'
let studentsFile = './students.txt'
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
    if (!fs.existsSync('progsp.hfg-gmuend.de.key') || (ipAddr != 'localhost' && ipAddr != state.ipAddr)) {
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
    var userpass = new Buffer((request.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
    if (!bcrypt.compareSync(userpass, '$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC')) {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="HfG Homeworks"' });
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
  console.log((new Date()) + ' Homeworks Server erreichbar unter http://' + ipAddr + ':' + httpPort)

  // Byron:$2a$08$5IZmi9StV.mBmOSmZQ.hfeENTxsGzBa647uJFzbIpRUgSEwdS1L32
  // Bene:$2a$10$yJv.PbSvcZpc3THj8iPukeEGR7cM/9GoUgKcAnEs4TA90GvPr4eFi
  // ig1:$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC
  httpsServer = https.createServer(options, function(request, response) {
    // console.log(decodeURIComponent(request.url))
    var userpass = new Buffer((request.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
    if (bcrypt.compareSync(userpass, '$2a$08$5IZmi9StV.mBmOSmZQ.hfeENTxsGzBa647uJFzbIpRUgSEwdS1L32') ||
      bcrypt.compareSync(userpass, '$2a$10$yJv.PbSvcZpc3THj8iPukeEGR7cM/9GoUgKcAnEs4TA90GvPr4eFi')) {
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
        case '/state.json':
          response.writeHead(200, {
            "Content-Type": contentTypesByExtension['.json']
          })
          response.write(JSON.stringify(state))
          response.end()
          break
        default:
          let filename
          if (pathname.startsWith('/students')) {
            filename = ".." + pathname
          } else {
            filename = "../students" + pathname
          }
          filename = path.join(process.cwd(), filename)
          // console.log(pathname, filename)
          sendResponse(response, filename)
          break
      }
    } else {
      if (bcrypt.compareSync(userpass, '$2a$08$uGD7MtlHnvRQikJLGiUuIuye8dTapGoz2pXSuXyna9FFwUPRPYSIC')) {
        let actUrl = url.parse(decodeURIComponent(request.url), true)
        let pathname = actUrl.pathname
        switch (pathname) {
          case '/student.id':
            response.writeHead(200, {
              "Content-Type": "application/octet-stream"
            })
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
          default:
            response.writeHead(404, {
              "Content-Type": "text/plain"
            })
            response.write("404 Not Found\n")
            response.end()
            break
        }
      } else {
        response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="HfG Homeworks"' });
        response.end('HTTP Error 401 Unauthorized: Access is denied');
      }
    }
  })
  httpsServer.listen(httpsPort)
  console.log((new Date()) + ' Homeworks Server erreichbar unter https://' + ipAddr + ':' + httpsPort)

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

  if (firstTime && ipAddr != 'localhost') {
    if (state.domain) {
      announce("Neuer externer Homeworks Server `https://" + state.domain + ":" + httpsPort + "`", "#99_benno")
    } else {
      announce("Neuer lokaler Homeworks Server " + ipAddr + " - <https://" + ipAddr + ":" + httpsPort + "|Ausprobieren> (wenn Du im gleichen Netz bist)", "#99_benno")
    }
  }
}

function sendResponse(response, filename) {
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

function handleMessage(server, message, id, client) {
  let ip = client.upgradeReq.connection.remoteAddress
  if (msgTrace) {
    console.log('%s REC <%s>', new Date().getTime(), message.replace(/"code":"[^"]+"/, '"code":"..."'))
  }
  let msg = JSON.parse(message)
  let student
  if (!active[ip]) {
    active[ip] = true
    switch (msg.id) {
      case 'JOIN':
        if (msg.data.student) {
          student = msg.data.student
          if (!(student in state.students)) {
            state.students[student] = {
              name: 'Unbekannt',
              date: new Date().getTime(),
              dir: '../students/' + id,
              uploads: 0,
              hw: []
            }
          } else {
            client.send(JSON.stringify({
              id: 'INFO',
              from: 'SERVER',
              data: state.students[student].res[msg.data.aufgabe]
            }))
          }
          if (!(student in state.volatile)) {
            state.volatile[student] = {}
          }
        }
        break
      case 'REVIEW':
        student = msg.data.student
        let hw = state.students[student].hw[msg.data.hw]
        if (msg.data.res) {
          let res = msg.data.res
          res.date = new Date().getTime()
          state.students[student].res[hw.aufgabe] = res
          saveState()
        }
        client.send(JSON.stringify({
          id: 'REVIEW',
          from: 'SERVER',
          data: {
            name: state.students[student].name,
            res: state.students[student].res[hw.aufgabe]
          }
        }))
        break
      case 'STORE':
        student = msg.data.student
        let file = msg.data.file
        let part = file.endsWith('.js') ? 'js' : 'html'
        if (state.volatile[student].act) {
          state.volatile[student].act[part] = file
          let prev = state.students[student].hw.find(hw => hw.html == state.volatile[student].act.html && hw.js == state.volatile[student].act.js)
          if (prev) {
            prev.version++
            prev.date = new Date().getTime()
            // prev.page = msg.data.page
            // prev.aufgabe = msg.data.aufgabe
          } else {
            state.students[student].hw.push(state.volatile[student].act)
          }
          delete state.volatile[student].act
          state.students[student].uploads++
          saveState()
        } else {
          state.volatile[student].act = { version: 0, date: new Date().getTime(), page: msg.data.page, aufgabe: msg.data.aufgabe }
          state.volatile[student].act[part] = file
        }
        let buff = Buffer.from(msg.data.code, 'base64')
        //console.log(msg.data.code, buff, buff.toString(), buff.toString('utf-8'))
        let dir = '../students' + state.students[student].dir + path.dirname(file);
        if (!fs.existsSync(dir)) {
          mkDir(dir);
        }
        fs.writeFile('../students' + state.students[student].dir + file, buff.toString('utf-8'), 'utf8', (err, data) => {
          if (err) {
            console.log(err)
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: {
                rc: -1,
                msg: err,
                name: state.students[student].name
              }
            }))
          } else {
            console.log(file + " saved.")
            client.send(JSON.stringify({
              id: 'STORE',
              from: 'SERVER',
              data: {
                msg: 'saved',
                name: state.students[student].name
              }
            }))
          }
        })
        break
      case 'STATE':
        if (msg.data.add && subscriber.indexOf(id) == -1) {
          subscriber.push(id)
        }
        client.send(JSON.stringify({
          id: 'STATE',
          from: 'SERVER',
          data: state
        }))
        break
      case 'ADDUSER':
        console.log(msg.data)
        if (msg.data.firstname && msg.data.name && msg.data.group) {
          addUser(msg.data.firstname, msg.data.name, msg.data.group)
          saveState()
      }
        break
      case 'RESTART':
        process.exit(msg.data.rc)
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
  delete clients[id]
  subscriber = subscriber.filter(sId => sId != id)
  if (msgTrace) {
    console.log('%s EXIT <%s> (%d clients)', new Date().getTime(), 'Client ' + id + ' left', (server.clients.length ? server.clients.length : server.clients.size))
  }
}

function addUser(vorname, name, gruppe) {
  let id = guid7()
  let dir = '/' + vorname.toLowerCase() + '.' + name.toLowerCase()
  state.students[id] = {
    name: vorname + ' ' + name,
    group: gruppe,
    date: new Date().getTime(),
    dir: dir,
    uploads: 0,
    hw: [],
    res: []
  }
  fs.mkdirSync('../students' + dir);
  fs.mkdirSync('../students' + dir + '/js');
  fs.symlinkSync('../shared/css', '../students' + dir + '/css', 'dir')
  fs.symlinkSync('../shared/img', '../students' + dir + '/img', 'dir')
  fs.symlinkSync('../shared/lib', '../students' + dir + '/lib', 'dir')
}

function createState() {
  state = {
    ipAddr: '0.0.0.0',
    domain: hostname,
    xslack: '',
    students: {},
    volatile: {}
  }
  fs.readFile(studentsFile, 'utf-8', (err, data) => {
    if (err) {
      if (err.code == 'ENOENT') {
        state.students["192ad26b-a754-4fcd-bfd0-56795b4d0c20"] = {
          name: 'Benno Stäbler',
          group: 'IG1',
          date: new Date().getTime(),
          dir: '/benno.stäbler',
          uploads: 0,
          hw: [],
          res: []
        }
        saveState()
      } else {
        console.log(err, err.code)
      }
    } else {
      let lines = data.split(/\r?\n/)
      lines.forEach(l => {
        if (l.length > 0 && !l.startsWith('#')) {
          let p = l.split(/;/)
          addUser(p[13], p[12], p[9])
        }
      })
      saveState()
      state.volatile = {}
    }
  })
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
      saveState()
      state.volatile = {}
      setupServers()
    }
  })
}

function saveState() {
  subscriber.forEach(sId => {
    clients[sId].send(JSON.stringify({
      id: 'STATE',
      from: 'SERVER',
      data: state
    }))
  });
  fs.writeFile(stateFile, JSON.stringify(state), { encoding: 'utf8', flag: 'w' }, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      // console.log(stateFile + " updated")
    }
  })
}

function announce(info, channel) {
  if (state.slack) {
    if (null == channel) {
      channel = "#programmieren"
    }

    let data = {
      channel: channel,
      username: "HomeworksServer",
      text: info,
      icon_emoji: ":ghost:"
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

function mkDir(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? path.sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(path.sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
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
  <meta name="description" content="HfG Homeworks">
  <meta name="author" content="ByronStar">

  <title>Programmiersprachen - Hausaufgaben</title>
  <script type="text/javascript" src="/shared/lib/homeworks.js"></script>
  <script>Homeworks.gc.noMenu=true</script>
  <link rel="stylesheet" href="/shared/css/progsp.css">
</head>

<body class="progsp">
  <div class="overlay" style="margin: 40px;">
    <h1>Id Dateien für Hausaufgaben Abgabe</h1>
    <p>Damit Deine Hausaufgaben richtig zugeordnet werden können, benötigst Du Deine 'student.id' Datei im 'data' Unterverzeichnis
    Deines 'student' Ordners für IG1 Programmiersprachen.<br>Klicke in der Liste auf Deinen Namen, dann wird Deine 'student.id' Datei im 'Download' Ordner
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
  // let list = ''
  // for (let id in state.students) {
  //   list += '<li>' + state.students[id].name
  //   list += '<ol>'
  //   state.students[id].hw.forEach((hw, h) => {
  //     let actUrl = 'https://' + state.domain + ':' + httpsPort + state.students[id].dir + hw.html + '?id=' + id + '&hw=' + h
  //     let res = state.students[id].res[hw.aufgabe]
  //     list += '<li>' + (!res || hw.date > res.date ? ' 🚦' : ' ✅') + ' <img src="shared/img/' + (res ? res.icon : 'x.png') + '"> <a href="' + actUrl + '" target="_blank">' + hw.html + '</a>'
  //     list += (res ? ' ' + res.fb : '') + ' ( hw=' + hw.aufgabe + ', v' + hw.version + ', ' + new Date(hw.date).toLocaleString() + (res ? ', ' + new Date(res.date).toLocaleString() : '') + ' )'
  //   })
  //   list += '</ol>'
  // }
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="HfG Homeworks">
  <meta name="author" content="ByronStar">

  <title>Programmiersprachen - Hausaufgaben</title>
  <script type="text/javascript" src="/shared/lib/homeworks.js"></script>
  <link rel="stylesheet" href="/shared/css/progsp.css">
</head>

<body class="progsp">
  <div class="overlay" style="margin: 40px;">
    <h1>Abgegebene Hausaufgaben</h1>
    <div>
      <ul id="hwlist">
      </ul>
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
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
-----END RSA PRIVATE KEY-----`
}

function rootCA() {
  return `-----BEGIN CERTIFICATE-----
MIIF/DCCA+SgAwIBAgIBATANBgkqhkiG9w0BAQsFADCBljELMAkGA1UEBhMCREUx
CzAJBgNVBAgTAkJXMRkwFwYDVQQHExBTY2h35GJpc2NoIEdt/G5kMQwwCgYDVQQK
EwNIZkcxDDAKBgNVBAsTA0lHMTEWMBQGA1UEAxMNaGZnLmhvcHRvLm9yZzErMCkG
CSqGSIb3DQEJARMcYmVubm8uc3RhZWJsZXJAaGZnLWdtdWVuZC5kZTAeFw0xOTEx
MDIxMDIxMzRaFw0yMTExMDIxMDIxMzRaMIGWMQswCQYDVQQGEwJERTELMAkGA1UE
CBMCQlcxGTAXBgNVBAcTEFNjaHfkYmlzY2ggR238bmQxDDAKBgNVBAoTA0hmRzEM
MAoGA1UECxMDSUcxMRYwFAYDVQQDEw1oZmcuaG9wdG8ub3JnMSswKQYJKoZIhvcN
AQkBExxiZW5uby5zdGFlYmxlckBoZmctZ211ZW5kLmRlMIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEA7MrWiGYZxbAQNHtg6cbtKC8Ot+3ev8VfGb/HX0/F
Q3jEi/DckvoBAuAp8s5FVpe6As0jGD0JImMGT1jrzNgcI5g+Aolq5zjerf5RMXb9
tz6WfPGFsNAd2yUbS5h2mWacRO3YgDBc6ageLGp0un7Twk9qG/b/k3uf87Foobg4
o+YIxFT69mxgdtcRtTX/RpbmUv9RKUc+aITCaHmOcPHgTQgbLnU+RuXcQTiiasYK
5sPoVcCHHUXI0/lngq8vy4n38BDeqaWlp0HzhNQF4kKDhG4DPjENEgcqKDJT4K+I
WqOypvatfMrOn1Y3rVNDBr4De9yqro3cdgf7KMdLZeFZ8MWSiUGiDbo1VeLNk2Ra
IUTNcrUEEEXW1cWykHRb2z27fd0MzofoKhRhSYIGbj2sDkB1i6R/oluLKK0KbJSh
5aSSswQuITl2Jt/AqYKZHOIZXoDqFvRIK2a1/OnUXJqwLENB5PI994bvhW1YSTDf
O5ltLTPWAhtUbGuWqxsSFSlIe/Hq/4RI7OuHSOQvrLlsmRqecU0+2vkXQJJM10p5
VVXBYDRSmBXfdpp/F/z0t7iRsaUPj15LTiJzACg/xyEKdj9KuFA3HXazrwqaI3Uq
bMJIeRsQjSOjATE5lt3jgCLajZag8d1pwluZlbLLgnSRmh7PKY90KiLQQwBvudni
Rq8CAwEAAaNTMFEwDAYDVR0TBAUwAwEB/zALBgNVHQ8EBAMCBaAwNAYDVR0RBC0w
K4IUcHJvZ3NwLmhmZy1nbXVlbmQuZGWCDWhmZy5ob3B0by5vcmeHBMCosjcwDQYJ
KoZIhvcNAQELBQADggIBACi8fNjZJKpbHF11zeyChu6ceKBPcMrPaY+VUkSBv3nt
mL76daV44dnczQgOE4onMurdww4Eid/dK56F4S7FcKuA6jRQ2XnWMqljdMvEZq3q
zXGGMCsDOgJVSXAiLo/LZVETnmzovvoGxw9ghvld7T2DAiRGkxZ/zdSsGlQiAYY4
2ZOXdfLZ89LB/pwbfn8j++CUoBlZA1YIA+ELRbKorXQLkd0O3sHmthvovEUGgIy3
gimme59zZhhvlpIum1MWmf6RUeITgQHcpp4sX3LVCHH46+TElK3TmiN7TqX2k1Ik
Klpy82Ghxy0SnE8EesrW18WhDjq3IGdqplmRqZHsx4OhStI8K4kM6fIJYPFdcTMj
ZD68exTZ8OAs4Oq5TdT4dIyT/VON2mfenAoEisKoBhQC/1viQYoOJZMU16VJX4IB
MDfCvPXDF+lJVbtAA0P7JjoaI4TP1wUYaKJhOhIMAI7YbMVmRpONagJgdM1r5RM2
h7lWfnZO1OG9ZZRjS1t1uyw1OhL8HxCtXrvfIdDFFZTdMaSjLhGSGDnMbP2P9+sD
g4novPUe084Snxivdub+zHqaCoUhXtNocZXANBHvNm+aT+rM0jtwGDAYB3y0wmZw
oXoS8mYxfYwLpTI8dCKLKWeZfZuiAiKC+KJYojWrIPIWE8IM8TjQLGHfa1sgdZRf
-----END CERTIFICATE-----`
}
