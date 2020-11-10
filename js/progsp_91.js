'strict'
let url, layer, idx, trello, cards
let cols = [320, 1060, 1800]

// curl 'https://api.trello.com/1/members/me/boards?key=46715633098623bfa325ad862d9b179e&token=308eba89714d74b32098367393b8941af4536922f651e5434cdc4e782001e96c'
// curl 'https://api.trello.com/1/boards/5f3c3d9efd54c38f818d2d97/cards?key=46715633098623bfa325ad862d9b179e&token=308eba89714d74b32098367393b8941af4536922f651e5434cdc4e782001e96c'
// curl 'https://api.trello.com/1/boards/5f3c3d9efd54c38f818d2d97/labels?key=46715633098623bfa325ad862d9b179e&token=308eba89714d74b32098367393b8941af4536922f651e5434cdc4e782001e96c' > info_trello_labels.json
// curl 'https://api.trello.com/1/boards/5f3c3d9efd54c38f818d2d97/lists?key=46715633098623bfa325ad862d9b179e&token=308eba89714d74b32098367393b8941af4536922f651e5434cdc4e782001e96c' > info_trello_lists.json
function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight)
  url = new URL(window.location.href)
  idx = url.searchParams.get("skip") || 0
  layer = document.getElementById('layer0')
  // createGrid()
  // createLabels()
  loadCards()
}

// 370
// +385


function createGrid() {
  createElement(layer, 'line', { x1: 690, y1: 0, x2: 690, y2: 2970 })
  createElement(layer, 'line', { x1: 1430, y1: 0, x2: 1430, y2: 2970 })
  for (let r = 0; r < 8; r++) {
    let row = -15 + r * 383
    createElement(layer, 'line', { x1: 0, y1: row, x2: 2100, y2: row })
  }
}

function loadCards() {
  getFile('info_trello.json', 'application/json').then(
    data => {
      trello = JSON.parse(data);
      let url = 'https://api.trello.com/1/boards/' + trello.board + '/cards?key=' + trello.key + '&token=' + trello.token
      // console.log(url);
      // url = 'info_trello_cards.json'
      getFile(url, 'application/json').then(
        data => {
          cards = JSON.parse(data)
          cards.forEach((card, i) => {
            if (card.idLabels.indexOf('5f3c3d9efd54c38f818d2db6') == -1) {
              console.log(card.name, card.shortUrl);
              let words = card.name.split(" ")
              createLabel(layer, Math.floor(2 * idx / 3), (2 * idx) % 3, words[0], words[1], card.shortUrl)
              createLabel(layer, Math.floor((2 * idx + 1) / 3), (2 * idx + 1) % 3, words[0], words[1], card.shortUrl)
              idx++
            }
          })
        },
        error => {
          console.log("Trello Error")
        }
      )
    },
    error => {
      console.log("info_trello.json not loaded")
    }
  )
}

function createLabel(parent, r, c, lne1, lne2, url) {
  let grp = createElement(parent, 'g', { transform: 'translate(' + cols[c] + ', ' + (100 + r * 383) + ')' })
  let elem = createElement(grp, 'text', { x: -175, y: 0, width: 500 })
  elem.innerHTML = lne1
  elem = createElement(grp, 'text', { x: -175, y: 120, width: 500 })
  elem.innerHTML = lne2
  qr = qrcode(4, 'Q')
  qr.addData(url)
  lne1.value = ""
  qr.make()
  elem = createElement(grp, 'g', { transform: 'translate(' + 50 + ', ' + -90 + ')' })
  elem.innerHTML = qr.createSvgTag(true, 6)
}

function createLabels() {
  box = 1;
  let elem
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 3; c++) {
      createLabel(layer, r, c, 'Benno', box < 10 ? '0' + box : box, 'https://trello.com/c/ocQgJywS')
      if ((r * 3 + c) % 2 == 1) {
        box++
      }
    }
  }
}

function clearElement(elem) {
  let copy = elem.cloneNode(false);
  elem.parentNode.replaceChild(copy, elem);
  return copy;
}

function createElement(parent, type, attrList) {
  let elem = document.createElementNS(parent.namespaceURI, type);
  parent.appendChild(elem);
  for (attr in attrList) {
    elem.setAttribute(attr, attrList[attr]);
  }
  return elem;
}

function getFile(url, type) {
  return new Promise((resolve, reject) => {
    ajax({
      type: 'GET',
      url: url,
      responseType: 'text',
      headers: {
        'Content-Type': type
      },
      success: (response, context) => resolve(response),
      error: (error, headers) => reject(error)
    })
  })
}

function ajax(req) {
  const xmlhttp = createXMLHttp()

  // callback for state changes
  xmlhttp.onreadystatechange = function() {
    // request finished
    if (xmlhttp.readyState === 4) {
      // request processed and successful (200) or local file (0)
      if ((xmlhttp.status === 200 || xmlhttp.status === 0 && xmlhttp.response)) {
        if (req.context) {
          const xxx = xmlhttp.getResponseHeader('xxx')
          if (xxx !== "undefined") {
            req.context.xxx = xxx
          }
        }
        // console.log(xmlhttp)
        switch (req.responseType) {
          case "arraybuffer":
          case "blob":
            req.success(xmlhttp.response, req.context)
            break
          case "document":
            req.success(xmlhttp.responseXML, req.context)
            break
          case "json":
            req.success(xmlhttp.response, req.context)
            break
          case "":
          case "text":
            req.success(xmlhttp.responseText, req.context)
            break
          default:
            req.success(xmlhttp.responseText, req.context)
        }
      } else {
        req.error(xmlhttp, xmlhttp.getAllResponseHeaders())
      }
    }
  }

  if (req.responseType) {
    xmlhttp.responseType = req.responseType
  }

  // prepare request
  xmlhttp.open(req.type, req.url, true)

  // Send additional headers information along with the request
  if (req.headers) {
    for (header in req.headers) {
      xmlhttp.setRequestHeader(header, req.headers[header])
    }
  }

  // Send proxy tunnel headers information along with the request
  if (req.xxx) {
    xmlhttp.setRequestHeader("xxx", req.xxx)
  }

  // process request
  if (req.data) {
    xmlhttp.send(req.data)
  } else {
    xmlhttp.send()
  }
}

function createXMLHttp() {
  // Create object for ajax requests
  if (window.XMLHttpRequest) {
    // IE7+, Firefox, Chrome, Opera, Safari
    return new XMLHttpRequest()
  } else {
    // IE6, IE5
    const xmlhttp = new ActiveXObject("Microsoft.XMLHTTP")
    xmlhttp.overrideMimeType("text/plain; charset=utf-8")
    return xmlhttp
  }
}
