'strict'
let url, layer, info, trello, cards
let cols = [320, 1060, 1800]

function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight)
  url = new URL(window.location.href)
  layer = document.getElementById('layer0')
  info = document.getElementById('info')
  // createGrid()
  // simulateLabels()
  initTrello()
}

function initTrello() {
  getFile('info_trello.json', 'application/json').then(
    data => {
      trello = JSON.parse(data)
      trello.idMap = {}
      trello.nameMap = {}
      trello.lists.forEach((list, i) => {
        trello.idMap[list.id] = list
        // trello.nameMap[list.name] = list
        list.cardCnt = 0
      })
      trello.labels.forEach((label, i) => {
        trello.idMap[label.id] = label
        trello.nameMap[label.name] = label
      })
      trello.labelCnt = 0
      runTrello()
    },
    error => {
      console.log("info_trello.json not loaded")
    }
  )
}

function processInput(evt) {
  evt.preventDefault();
  deleteCards(document.getElementById('filter').value)
}

function runTrelloX() {
  // delivered()
  // cleanGedruckt()
}

function runTrello() {
  let page = url.searchParams.get("page")
  if (null != page) {
    if ("" != page) {
      createLabels(+page, url.searchParams.get("update"))
    } else {
      alert("invalid page")
    }
  } else {
    let delCards = url.searchParams.get("delete")
    if (null != delCards) {
      if ("" != delCards) {
        deleteCards(delCards)
      } else {
        alert("invalid filter")
      }
    } else {
      checkCards(+url.searchParams.get("add"), +url.searchParams.get("num") || 0, +url.searchParams.get("max") || 3)
    }
  }
}

function createCard(name, idList) {
  let url = 'https://api.trello.com/1/cards'
  return new Promise((resolve, reject) => {
    ajax({
      type: 'POST',
      url: url,
      responseType: 'text',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        key: trello.key,
        token: trello.token,
        name: name,
        idList: idList
      }),
      success: (response, context) => resolve(response),
      error: (error, headers) => reject(error)
    })
  })
}

function updateCard(idCard, data) {
  let url = 'https://api.trello.com/1/cards/' + idCard
  return new Promise((resolve, reject) => {
    data.key = trello.key
    data.token = trello.token
    ajax({
      type: 'PUT',
      url: url,
      responseType: 'text',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify(data),
      success: (response, context) => resolve(response),
      error: (error, headers) => reject(error)
    })
  })
}

function deleteCard(idCard) {
  let url = 'https://api.trello.com/1/cards/' + idCard
  return new Promise((resolve, reject) => {
    data = {}
    data.key = trello.key
    data.token = trello.token
    ajax({
      type: 'DELETE',
      url: url,
      responseType: 'text',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data),
      success: (response, context) => resolve(response),
      error: (error, headers) => reject(error)
    })
  })
}

function checkCards(filter, num, max) {
  getCards().then(
    data => {
      cards = data
      console.log(cards.length + " cards loaded")
      let lblPrinted = trello.nameMap["Gedruckt"].id
      // process cards with known list and list prefix
      cards.filter((card, i) => (trello.idMap[card.idList] && card.name.startsWith(trello.idMap[card.idList].name + " "))).forEach((card, i) => {
        let list = trello.idMap[card.idList]
        list.cardCnt++
        if (card.idLabels.indexOf(lblPrinted) == -1) {
          trello.labelCnt += card.name.match(/ [0-9]+/) ? 2 : 1
        }
      })
      trello.lists.filter((list, i) => list.name.startsWith(filter)).forEach((list, i) => {
        let last = list.cardCnt + Math.min(num, max - list.cardCnt)
        if (list.cardCnt < max) {
          for (let c = list.cardCnt + 1; c <= last; c++) { // Math.min(num, max - list.cardCnt))
            console.log(list.name + ' ' + (c < 10 ? '0' + c : c), list.id)
            createCard(list.name + ' ' + (c < 10 ? '0' + c : c), list.id).then(
              data => {
                let card = JSON.parse(data)
                console.log(card);
                cards.push(card)
                trello.labelCnt += 2
              },
              error => {
                console.log("Trello: " + error)
              }
            )
          }
        }
      })
      showPages()
    },
    error => {
      console.log("Trello:" + error)
    }
  )
}

function showPages() {
  console.log(cards.length + " cards, " + trello.labelCnt + " labels to be printed")
  let skip = +url.searchParams.get("skip") || 0
  let ul = createElement(info, 'ul', {})
  let max = Math.ceil((skip + trello.labelCnt) / 24)
  for (let l = 0; l < max; l++) {
    let li = createElement(ul, 'li', {})
    li.innerHTML = '<a href="' + location.pathname + '?page=' + l + '&skip=' + skip + ' " target="page">Etiketten Seite ' + (l + 1) + '</a>'
  }
}

function deleteCards(filter) {
  getCards().then(
    data => {
      cards = data
      console.log(cards.length + " cards loaded")
      cards.filter((card, i) => card.desc == "" && card.idLabels.length == 0 && card.name.startsWith(filter)).forEach((card, i) => {
        console.log(card.name);
        deleteCard(card.id).then(
          data => {
            let card = JSON.parse(data)
            console.log(card);
          },
          error => {
            console.log("Trello delete card: " + error)
          }
        )
      })
      showPages()
    },
    error => {
      console.log("Trello:" + error)
    }
  )
}

function delivered() {
  getCards().then(
    data => {
      cards = data
      console.log(cards.length + " cards loaded")
      let addId = trello.nameMap["Angekommen"].id
      let lblClear = [trello.nameMap["Gepackt"].id, trello.nameMap["Verladen"].id, trello.nameMap["Verladen Büro"].id]
      // console.log(lblClear)
      cards.filter((card, i) => card.idLabels.some(lblId => lblId == trello.nameMap["Verladen"].id || lblId == trello.nameMap["Verladen Büro"].id)).forEach((card, i) => {
        card.idLabels = card.idLabels.filter((lblId, i) => !lblClear.includes(lblId))
        card.idLabels.push(addId)
        console.log(card)
        updateCard(card.id, { idLabels: card.idLabels.join(',') }).then(
          data => {
            let card = JSON.parse(data)
            console.log(card);
          },
          error => {
            console.log("Trello update card: " + error)
          }
        )
      })
    },
    error => {
      console.log("Trello:" + error)
    }
  )
}

function cleanPrinted() {
  getCards().then(
    data => {
      cards = data
      console.log(cards.length + " cards loaded")
      cards.filter((card, i) => card.idLabels.indexOf(trello.nameMap["Gedruckt"].id) > -1).forEach((card, i) => {
        card.idLabels.filter((label, i) => label != trello.nameMap["Gedruckt"].id)
        updateCard(card.id, { idLabels: card.idLabels.filter((label, i) => label != trello.nameMap["Gedruckt"].id).join(',') }).then(
          data => {
            let card = JSON.parse(data)
            console.log(card);
          },
          error => {
            console.log("Trello update card: " + error)
          }
        )
      })
    },
    error => {
      console.log("Trello:" + error)
    }
  )
}

function createLabels(page, doUpdate) {
  info.setAttribute('style', 'display:none')
  getCards().then(
    data => {
      cards = data
      console.log(cards.length + " cards loaded")
      let skip = +url.searchParams.get("skip") || 0
      let slot = page == 0 ? skip : 0
      let used = skip
      let lblPrinted = trello.nameMap["Gedruckt"].id
      cards.filter((card, i) => (trello.idMap[card.idList] && card.name.startsWith(trello.idMap[card.idList].name + " ")) && card.idLabels.indexOf(lblPrinted) == -1).forEach((card, i) => {
        console.log(i, used, slot, card.name, card.shortUrl);
        let words = card.name.split(" ")
        if (Math.floor(used / 24) == page) {
          createLabel(layer, Math.floor(slot / 3), slot % 3, words[0], words[1], card.shortUrl)
          slot++
          if (doUpdate) {
            card.idLabels.push(trello.nameMap["Gedruckt"].id)
            console.log(card.id, card.idLabels.join(','))
            updateCard(card.id, { idLabels: card.idLabels.join(',') }).then(
              data => {
                let card = JSON.parse(data)
                console.log(card);
              },
              error => {
                console.log("Trello update card: " + error)
              }
            )
          }
        }
        used++
        // second label for boxes only
        if (Math.floor(used / 24) == page && words[1].match(/^[0-9]+$/)) {
          createLabel(layer, Math.floor(slot / 3), slot % 3, words[0], words[1], card.shortUrl)
          slot++
        }
        used += words[1].match(/^[0-9]+$/) && slot < 24 ? 1 : 0
      })
    },
    error => {
      console.log("Trello:" + error)
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

function simulateLabels() {
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

function createGrid() {
  createElement(layer, 'line', { x1: 690, y1: 0, x2: 690, y2: 2970 })
  createElement(layer, 'line', { x1: 1430, y1: 0, x2: 1430, y2: 2970 })
  for (let r = 0; r < 8; r++) {
    let row = -15 + r * 383
    createElement(layer, 'line', { x1: 0, y1: row, x2: 2100, y2: row })
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

function getCards() {
  let url = 'https://api.trello.com/1/boards/' + trello.board + '/cards?key=' + trello.key + '&token=' + trello.token
  // url = 'info_trello_cards.json'
  return new Promise((resolve, reject) => {
    getFile(url, 'application/json').then(
      data => resolve(JSON.parse(data)),
      error => reject(error)
    )
  })
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
