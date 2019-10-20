// let gc = function() {
//   let gc = function(typeNumber, errorCorrectionLevel) {
let ws, name
let gc = {
  players: [],
  me: null,
  id: null,
  gameid: 0,
  online: false,
  ready: false,
  move: function(data) {
    if (gc.ready) {
      data.group = gc.me.group
      sendState('MOVE', data)
    }
  },
  send: function(cmd, data) {
    sendState(cmd, data)
  },
  player: function(idx) {
    return gc.players.find(function(v, i) {
      return v.id === gc.me.group[idx]
    })
  },
  store: getScript,
  add: setScript
}
let playerNode
let statusNode
let moveCallback
let msgTrace = false

// the WebSocket connection is established to the http / https URL with these ports
let wsPort = 11203
let wssPort = 11204

function wsinit(onMove, node, status) {
  //console.log(location);
  let url = new URL(window.location.href);
  name = url.searchParams.get("name");
  if (null == name) {
    name = "Spieler" + Math.floor(rand(100, 999))
  }

  moveCallback = onMove
  let port = url.searchParams.get("port");
  // console.log(port);

  if (null != port) {
    wsPort = port
  }

  playerNode = node
  statusNode = status
  let host
  serverIp = url.searchParams.get("server");
  if (serverIp) {
    host = serverIp
  } else {
    host = location.host ? location.host.replace(/:.*/, "") : "localhost"
  }
  let wsUri = location.protocol === 'https:' ? 'wss://' + host + ':' + wssPort : 'ws://' + host + ':' + wsPort
  ws = createWebSocket(wsUri, onState, onReceive)
  window.addEventListener('keydown', onKeyDownGC);
  return gc
}

function onKeyDownGC(evt) {
  switch (evt.key) {
    case 'R':
      gc.send('RESTART', { rc: 0 });
      break;
    case 'Q':
      gc.send('RESTART', { rc: -1 })
      break;
    case 'X':
      console.log(gc.player(0).name, gc.player(1).name);
      break;
    case 'S':
      gc.store('code');
      break;
    default:
  }
}

function onState(online, ws) {
  gc.online = online
  if (!gc.online) {
    gc.players = []
    setTimeout(reload, 2000)
  }
  refreshPlayers(gc.players)
}

function reload() {
  location.reload(false)
}

function onReceive(data) {
  let msg = JSON.parse(data)
  // calcLag(msg, new Date().getTime())

  if (msg.data.players) {
    refreshPlayers(msg.data.players)
  }
  if (gc.id === msg.from && msg.id != 'MOVE') {
    return
  }

  if (msgTrace) {
    console.log("REC", msg)
  }

  switch (msg.id) {
    case 'ID':
      // connected and server provides ID
      gc.id = msg.data.id
      sendState('JOIN', { name: name, gameid: gc.gameid })
      break
    case 'PLAYERS':
      break;
    case 'EXIT':
      if (gc.me.group.indexOf(msg.data.id) > -1) {
        gc.ready = false;
        moveCallback({ id: 'EXIT' });
        gc.me.active = false;
        gc.me.group = [];
        sendState('UPDATE', { player: gc.me })
      }
      break;
    case 'PREPARE':
      if (msg.data.to == gc.id) {
        if (gc.me.active) {
          sendState('DECLINE', { to: msg.from })
        } else {
          gc.me.active = true
          gc.me.group = msg.data.player.group
          gc.ready = true;
          sendState('ACCEPT', { player: gc.me, to: msg.from })
        }
      }
      break
    case 'ACCEPT':
      break
    case 'DECLINE':
      gc.me.active = false;
      gc.me.group = [];
      sendState('UPDATE', { player: gc.me })
      break;
    case 'MOVE':
      moveCallback(msg.data);
      break
    default:
      break
  }
}

function prepareGame(p) {
  gc.ready = true;
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
        p.innerHTML += v.name + " (me)"
      } else {
        p.innerHTML += v.name
      }
      if (gc.me && gc.me.group.indexOf(v.id) > -1) {
        p.style.color = 'lime'
      }
      playerNode.appendChild(p)
    })
    statusNode.setAttribute('fill', gc.online ? !gc.ready ? 'green' : 'lime' : 'red')
  }
}

function getScript(id) {
  var script = document.getElementById(id)
  // let url = new URL(script.src);
  // console.log(url);// url.pathname
  let js = "/js/" + gc.me.name.toLowerCase() + ".js"
  let html = "/" + gc.me.name.toLowerCase() + ".html"
  loadData(script.src, 'text/javascript', loadedScript, { js: js, html: html })
}

function loadedScript(text, context) {
  gc.send('STORE', { name: context.html, code: window.btoa(new XMLSerializer().serializeToString(document).replace("progsp_game", gc.me.name.toLowerCase())) })
  gc.send('STORE', { name: context.js, code: window.btoa(text) })
  let gameURL = location.origin + context.html
  createQRCode(gameURL, 'p1')
}

function setScript(name) {
  var script = document.createElement("script");
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', name);
  document.head.appendChild(script);
  console.log(document.head);
}

function createQRCode(data, id) {
  console.log(data)
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
    document.cookie = cname + "=" + cval + "; expires=" + d.toUTCString()
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
  return min + Math.random() * (max - min);
}

let headers = null;

function loadData(url, responseType, callback, context) {
  let xmlhttp;
  if (window.XMLHttpRequest) {
    // IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {
    // IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.overrideMimeType("text/plain; charset=utf-8");
  }

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4) {
      if ((xmlhttp.status == 200 || xmlhttp.status == 0 && xmlhttp.responseText)) {
        if (context) {
          let xxx = xmlhttp.getResponseHeader('xxx');
          if (xxx != "undefined") {
            context.xxx = xxx;
          }
        }
        switch (responseType) {
          case 'text/xml':
          case 'application/xml':
            callback(xmlhttp.responseXML, context);
            break;
          case 'application/json':
            callback(xmlhttp.responseText, context);
            break;
          default:
            callback(xmlhttp.responseText, context);
        }
      } else {
        console.log(xmlhttp.status, xmlhttp.getAllResponseHeaders());
      }
    }
  };

  // Inhalt deklarieren - ist nur beim lokalen Lesen ohne Webserver notwendig
  xmlhttp.responseType = responseType;
  // Lesen der Datei vorbereiten
  xmlhttp.open("GET", url, true);
  // Send the proxy header information along with the request
  if (headers) {
    xmlhttp.setRequestHeader("xxx", headers);
  }

  xmlhttp.send();
}

// }
//   return gc;
// }();
