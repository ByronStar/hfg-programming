// let gc = function() {
//   let gc = function(typeNumber, errorCorrectionLevel) {
let ipPort = 8091
let msgTrace = false
let ws, name
let gc = {
  players: [],
  me: null,
  id: null,
  gameId: 0,
  online: false,
  ready: false,
  server: null,
  move: function(data) {
    if (gc.ready) {
      data.group = gc.me.group
      sendState('MOVE', data)
    }
  },
  player: function(idx) {
    return gc.players.find(function(v, i) {
      return v.id === gc.me.group[idx]
    })
  },
  isPlayer: function(idx) {
    return game.ready && gc.id == gc.me.group[idx]
  },
  cursorPoint: cursorPoint
}
let playerNode
let statusNode
let moveCallback
let reconnect = false

// the WebSocket connection is established to the http / https URL with these ports
let wsPort = 11203
let wssPort = 11204

function wsinit(onMove, node, status) {
  initPoint()
  //console.log(location)
  let url = new URL(window.location.href)
  name = url.searchParams.get("name")
  if (null == name) {
    name = getCookie('name')
    if (null == name) {
      name = "Spieler" + Math.floor(rand(100, 999))
    }
  } else {
    if (name.startsWith('Spieler')) {
      let saved = getCookie('name')
      if (null != saved) {
        name = saved
      }
    } else {
      setCookie('name', name, 90)
    }
  }

  moveCallback = onMove
  let port = url.searchParams.get("port")
  // console.log(port)

  if (null != port) {
    wsPort = port
  }

  playerNode = node
  statusNode = status
  msgTrace = (msgTrace || null != url.searchParams.get("trace"))
  let host = url.searchParams.get("server")
  if (host) {
    gc.server = host
  } else {
    gc.server = location.hostname ? location.hostname : "localhost"
  }
  let wsUri = location.protocol === 'https:' ? 'wss://' + gc.server + ':' + wssPort : 'ws://' + gc.server + ':' + wsPort
  ws = createWebSocket(wsUri, onState, onReceive)
  console.log(location, ws)
  window.addEventListener('keydown', onKeyDownGC)
  if (location.pathname != '/') {
    document.getElementsByTagName('h1')[0].innerHTML += (location.port == ipPort ? " (published)" : " (develop)")
  }
  return gc
}

let pCnt = 0
let qCnt = 0

function onKeyDownGC(evt) {
  if (location.pathname == '/') {
    switch (evt.key) {
      case 'R':
        sendState('RESTART', { rc: 0 })
        break
      case 'S':
        sendState('STATE', {})
        break
      case 'Q':
        if (qCnt++ > 3) {
          sendState('RESTART', { rc: -1 })
        }
        break
      case 'T':
        break
      default:
        qCnt = 0
    }
  } else {
    switch (evt.key) {
      case 'X':
        console.log(gc.player(0).name, gc.player(1).name)
        break
      case 'P':
        if (location.port != ipPort) {
          let script = document.getElementById('game')
          if (null != script) {
            if (!location.pathname.endsWith('/progsp_game.html') && !script.src.endsWith('/progsp_game.js')) {
              if (gc.gameId != 0) {
                if (pCnt == 0) {
                  pCnt = 2;
                  publish(script)
                } else {
                  alert("Verherige 'Publish' Funktion noch aktiv!")
                }
              } else {
                alert("Bitte im Javascript \ngame.gameId = 0;\n durch \ngame.gameId = '" + guid7() + "';\n ersetzen!")
              }
            } else {
              alert("Bitte die Dateien umbenennen: progsp_game.html und progsp_game.js sind reservierte Namen!")
            }
          } else {
            alert("Der Game Code ist in der HTML Seite nicht mit der id 'game' markiert: <script id=\"game\" ... !")
          }
        } else {
          alert("Die 'Publish' Funktion geht nur bei lokale Seiten (z.B. Atom Liveserver)!")
        }
        break
      default:
    }
  }
}

function onState(online, ws) {
  gc.online = online
  if (!gc.online) {
    gc.players = []
    if (reconnect) {
      setTimeout(reload, 5000)
    } else {
      if (location.hostname.match(/127.0.0.1|localhost/)) {
        alert("Es wurde kein lokaler Server gefunden! Eventuell einen remote Server verwenden:\n" + location.href + "?server=<IPAddress>")
      }
    }
  } else {
    reconnect = true
  }
  refreshPlayers(gc.players)
}

function reload() {
  location.reload(false)
}

function onReceive(data) {
  let msg = JSON.parse(data)

  if (msgTrace) {
    console.log("REC", msg)
  }

  // calcLag(msg, new Date().getTime())

  if (msg.data.players && msg.id != 'STATE') {
    refreshPlayers(msg.data.players)
  }
  if (gc.id === msg.from && msg.id != 'MOVE') {
    return
  }

  switch (msg.id) {
    case 'ID':
      // connected and server provides ID
      gc.id = msg.data.id
      gc.server = msg.data.ip
      if (!gc.server.match(/localhost|127.0.0.1/) && location.pathname != '/') {
        createQRCode(location.protocol + '//' + gc.server + ':' + ipPort + location.pathname + '?name=Mobile' + Math.floor(rand(100, 999)), 'p1')
      }
      sendState('JOIN', { name: name, game: gc.gameId })
      break
    case 'PLAYERS':
      break
    case 'EXIT':
      if (gc.me && gc.me.group.indexOf(msg.data.id) > -1) {
        gc.ready = false
        moveCallback({ id: 'EXIT' })
        gc.me.active = false
        gc.me.group = []
        sendState('UPDATE', { player: gc.me })
      }
      break
    case 'PREPARE':
      if (msg.data.to == gc.id) {
        if (gc.me.active) {
          sendState('DECLINE', { to: msg.from })
        } else {
          gc.me.active = true
          gc.me.group = msg.data.player.group
          gc.ready = true
          sendState('ACCEPT', { player: gc.me, to: msg.from })
        }
      }
      break
    case 'ACCEPT':
      break
    case 'DECLINE':
      gc.me.active = false
      gc.me.group = []
      sendState('UPDATE', { player: gc.me })
      break
    case 'STATE':
      if (!msgTrace) {
        console.log("REC", msg)
      }
      break
    case 'GAMES':
      let list = ""
      for (let gameId in msg.data.games) {
        if (gameId != -1) {
          let free = msg.data.games[gameId].players.reduce((cnt, v) => v.active ? cnt : cnt + 1, 0)
          list += '<li><a href="' + msg.data.games[gameId].html + "?name=" + name + '">' + msg.data.games[gameId].name + ' (' + free + ' / ' + msg.data.games[gameId].players.length + ' Spielern frei)</a></li>'
        }
      }
      document.getElementById('games').innerHTML = list
      break
    case 'STORE':
      pCnt--
      if (msg.data.rc < 0) {
        alert(msg.data.msg)
      } else {
        if (pCnt == 0) {
          // switch to published page: assign or replace
          location.assign('http://' + gc.server + ':' + ipPort + location.pathname)
        }
      }
      break
    case 'MOVE':
      moveCallback(msg.data)
      break
    default:
      break
  }
}

function prepareGame(p) {
  gc.ready = true
  gc.me.active = true
  gc.me.group = [gc.me.id, gc.players[p].id]
  sendState('PREPARE', { player: gc.me, to: gc.players[p].id })
}

function refreshPlayers(players) {
  gc.players = players
  gc.me = gc.players.find(function(v, i) {
    return v.id === gc.id
  })
  if (null != playerNode) {
    playerNode = clearElement(playerNode)
    gc.players.forEach(function(v, i) {
      let p = document.createElement('li')
      p.innerHTML = '<button ' + (v == gc.me || (gc.me && gc.me.active) || v.active ? 'disabled ' : '') + 'onclick="prepareGame(' + i + ')">Einladen</button>'
      if (gc.id === v.id) {
        p.innerHTML += v.name + " (me)" + (v.name.startsWith('Spieler')?' Tipp: in der Browser URL mit ?name=Hugo kann man seinen Namen ändern und speichern (Cookie)':'')
      } else {
        p.innerHTML += v.name
      }
      if (gc.me && gc.me.group.indexOf(v.id) > -1) {
        p.style.color = 'lime'
      }
      playerNode.appendChild(p)
    })
  }
  if (null != statusNode) {
    statusNode.setAttribute('fill', gc.online ? !gc.ready ? 'green' : 'lime' : 'red')
  }
}

function publish(script) {
  loadData(script.src, 'text/javascript', dataLoaded, { file: new URL(script.src).pathname })
  loadData(location.origin + location.pathname, 'text/html', dataLoaded, { file: location.pathname })
}

function dataLoaded(text, context) {
  if (context.file.endsWith('html')) {
    text = text.replace(/<!-- Code injected by live-server -->(.|\n)+<\/script>\n*/m, '')
  }
  sendState('STORE', { file: context.file, game: gc.gameId, name: gc.name, page: location.pathname, code: Base64.encode(text) })
}

function addScript(name) {
  let script = document.createElement("script")
  script.setAttribute('type', 'text/javascript')
  script.setAttribute('src', name)
  document.head.appendChild(script)
  console.log(document.head)
}

function createQRCode(data, id) {
  //console.log("qrcode=" + data)
  qr = qrcode(4, 'L')
  qr.addData(data)
  data.value = ""
  qr.make()
  document.getElementById(id).innerHTML = qr.createImgTag()
}

function createWebSocket(wsUri, onChange, onReceive) {
  try {
    const ws = new WebSocket(wsUri, 'echo-protocol')

    ws.onopen = function(evt) {
      onChange(true, ws)
    }

    ws.onclose = function(evt) {
      onChange(false, null)
    }

    ws.onerror = function(evt) {
      onChange(false, null)
      console.log('ERR', evt)
    }

    ws.onmessage = function(evt) {
      // console.log(evt.currentTarget, evt.srcElement, ws)
      onReceive(evt.data)
    }
    return ws
  } catch (e) {
    console.log(e)
    return null
  }
}

const sendState = (msgId, data) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const msg = { id: msgId, from: gc.id, ts: new Date().getTime(), data: data }
    if (msgTrace) {
      console.log("SND", msg)
    }
    ws.send(JSON.stringify(msg))
    if (msg.id == 'RESTART' && msg.data.rc == 0) {
      setTimeout(reload, 2000)
    }
  }
}

function clearElement(elem) {
  let id = elem.id
  elem.parentNode.replaceChild(elem.cloneNode(false), elem)
  return document.getElementById(id)
}

function setCookie(cname, cval, cdays) {
  if (null == cval) {
    document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC"
  } else {
    let d = new Date()
    d.setTime(d.getTime() + (cdays * 86400000))
    document.cookie = cname + "=" + cval + "; expires=" + d.toUTCString() + "; path=/"
  }
}

function getCookie(cname) {
  let name = cname + "="
  let cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim()
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return null
}

function trace(arg) {
  let now = (window.performance.now() / 1000).toFixed(3)
  console.log(now + ': ', arg)
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

let pt, matrix

function initPoint() {
  let svg = document.getElementById('svg')
  pt = svg.createSVGPoint()
  matrix = svg.getScreenCTM().inverse()
}

// Get point in global SVG space
function cursorPoint(evt) {
  pt.x = evt.clientX
  pt.y = evt.clientY
  return pt.matrixTransform(matrix)
}

let headers = null

function loadData(url, responseType, callback, context) {
  let xmlhttp
  if (window.XMLHttpRequest) {
    // IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest()
  } else {
    // IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP")
    xmlhttp.overrideMimeType("text/plain; charset=utf-8")
  }

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4) {
      if ((xmlhttp.status == 200 || xmlhttp.status == 0 && xmlhttp.responseText)) {
        if (context) {
          let xxx = xmlhttp.getResponseHeader('xxx')
          if (xxx != "undefined") {
            context.xxx = xxx
          }
        }
        switch (responseType) {
          case 'text/xml':
          case 'application/xml':
            callback(xmlhttp.responseXML, context)
            break
          case 'application/json':
            callback(xmlhttp.responseText, context)
            break
          default:
            callback(xmlhttp.responseText, context)
        }
      } else {
        console.log(xmlhttp.status, xmlhttp.getAllResponseHeaders())
      }
    }
  }

  // Inhalt deklarieren - ist nur beim lokalen Lesen ohne Webserver notwendig
  xmlhttp.responseType = responseType
  // Lesen der Datei vorbereiten
  xmlhttp.open("GET", url, true)
  // Send the proxy header information along with the request
  if (headers) {
    xmlhttp.setRequestHeader("xxx", headers)
  }

  xmlhttp.send()
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

function hashCode(text) {
  let hash = 0,
    i, chr;
  if (text.length === 0) return hash;
  for (i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info
 *
 **/
const Base64 = {

  // private property
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    // public method for encoding
    ,
  encode: function(input) {
      let output = ""
      let chr1, chr2, chr3, enc1, enc2, enc3, enc4
      let i = 0

      input = Base64._utf8_encode(input)

      while (i < input.length) {
        chr1 = input.charCodeAt(i++)
        chr2 = input.charCodeAt(i++)
        chr3 = input.charCodeAt(i++)

        enc1 = chr1 >> 2
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
        enc4 = chr3 & 63

        if (isNaN(chr2)) {
          enc3 = enc4 = 64
        } else if (isNaN(chr3)) {
          enc4 = 64
        }

        output = output +
          this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
          this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4)
      } // Whend

      return output
    } // End Function encode


    // public method for decoding
    ,
  decode: function(input) {
      let output = ""
      let chr1, chr2, chr3
      let enc1, enc2, enc3, enc4
      let i = 0

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "")
      while (i < input.length) {
        enc1 = this._keyStr.indexOf(input.charAt(i++))
        enc2 = this._keyStr.indexOf(input.charAt(i++))
        enc3 = this._keyStr.indexOf(input.charAt(i++))
        enc4 = this._keyStr.indexOf(input.charAt(i++))

        chr1 = (enc1 << 2) | (enc2 >> 4)
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
        chr3 = ((enc3 & 3) << 6) | enc4

        output = output + String.fromCharCode(chr1)

        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2)
        }

        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3)
        }

      } // Whend

      output = Base64._utf8_decode(output)

      return output
    } // End Function decode


    // private method for UTF-8 encoding
    ,
  _utf8_encode: function(string) {
      let utftext = ""
      string = string.replace(/\r\n/g, "\n")

      for (let n = 0; n < string.length; n++) {
        let c = string.charCodeAt(n)

        if (c < 128) {
          utftext += String.fromCharCode(c)
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192)
          utftext += String.fromCharCode((c & 63) | 128)
        } else {
          utftext += String.fromCharCode((c >> 12) | 224)
          utftext += String.fromCharCode(((c >> 6) & 63) | 128)
          utftext += String.fromCharCode((c & 63) | 128)
        }

      } // Next n

      return utftext
    } // End Function _utf8_encode

    // private method for UTF-8 decoding
    ,
  _utf8_decode: function(utftext) {
    let string = ""
    let i = 0
    let c, c1, c2, c3
    c = c1 = c2 = 0

    while (i < utftext.length) {
      c = utftext.charCodeAt(i)

      if (c < 128) {
        string += String.fromCharCode(c)
        i++
      } else if ((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i + 1)
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
        i += 2
      } else {
        c2 = utftext.charCodeAt(i + 1)
        c3 = utftext.charCodeAt(i + 2)
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
        i += 3
      }

    } // Whend

    return string
  } // End Function _utf8_decode
}
// }
//   return gc
// }()
