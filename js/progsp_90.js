'strict'

function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight)
  getLogins().then(
    logins => {
      console.log(logins.length + " logins loaded")
      // "Group","Title","Username","Password","URL","Notes"
      let text = ""
      let group = "Firefox"
      let passwds = {}
      logins.filter((login, i) => !(login.title.includes('"') || !login.secureContents.username || login.secureContents.username.includes('"') || !login.secureContents.password || login.secureContents.password.includes('"') || login.secureContents.password.length > 20)).forEach((login, i) => {
        if (passwds[login.secureContents.password]) {
          passwds[login.secureContents.password]++
        } else {
          passwds[login.secureContents.password] = 1
        }
        let url = login.secureContents.url || ""
        let username = login.secureContents.username.replace(/Ã¤/g,"ä")
        let title = login.title.replace(/â/g,"")
        let notes = "MacBook"
        let createdAt = login.createdAt || ""
        // ).replace(/\.*/,"")
        let updatedAt = login.updatedAt || ""
        text += '"' + group + '","' + title + '","' + username + '","' + login.secureContents.password + '","' + url + '","' + notes + '","' + Math.floor(createdAt) + '","' + Math.floor(updatedAt) + '"\n'
      });
      let pre = createElement(info, 'pre', {})
      pre.innerHTML = text
      document.getElementById('info').appendChild(pre)
      console.log(passwds)
    },
    error => {
      console.log("Logins:" + error)
    }
  )
}

function getLogins() {
  // let url = 'data/info_login_iMac.json'
  let url = 'data/info_login_Firefox.json'
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
