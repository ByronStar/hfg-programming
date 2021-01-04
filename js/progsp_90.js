'strict'

function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight)
  loadCSV()
}

function loadCSV() {
  let map = {}
  let master
  getFile('data/pwd/info_JoB.csv', 'text/csv').then(
    data => {
      master = CSVToArray(data, ',')
      master.pop()
      master.shift()
      console.log(master.length, master[0])
      master.forEach((line, l) => {
        key = line[1] + ':' + line[2] + ':' + line[3]
        // eleminate DUPs
        if (!(key in map)) {
          map[key] = line
        }
      })
      getFile('data/pwd/info_import.csv', 'text/csv').then(
        data => {
          let lines = CSVToArray(data, ',')
          lines.pop()
          console.log(lines.length, lines[0])
          lines.forEach((line, l) => {
            key = line[1] + ':' + line[2] + ':' + line[3]
            // merge in timestamps
            if (key in map) {
              let mLine = map[key]
              mLine[6] = line[6]
              mLine[7] = line[7]
              // console.log(key, mLine, line)
            }
          })
          let text = ''
          for (entry in map) {
            line = map[entry]
            if (!line[6]) {
              console.log(line)
            }
            text += '"' + (line[0] || '') + '","' + (line[1] || '') + '","' + (line[2] || '') + '","' + (line[3] || '') + '","' + (line[4] || '') + '","' + (line[5] || '') + '","' + (line[6] || '') + '","' + (line[7] || '') + '"\n'
          }
          let pre = createElement(info, 'pre', {})
          pre.innerHTML = text
          document.getElementById('info').appendChild(pre)
        },
        error => console.log(error)
      )
    },
    error => console.log(error)
  )
}

function loadJSON() {
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
        let username = login.secureContents.username.replace(/Ã¤/g, "ä")
        let title = login.title.replace(/â/g, "")
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

function CSVToArray(strData, strDelimiter) {
  strDelimiter = (strDelimiter || ",");
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );
  var arrData = [
    []
  ];
  var arrMatches = null;

  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec(strData)) {

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];

    // Check to see if the given delimiter has a length (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
      // Since we have reached a new row of data, add an empty row to our data array.
      arrData.push([]);
    }

    // Now that we have our delimiter out of the way, let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(
        new RegExp("\"\"", "g"),
        "\""
      );
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];
    }

    // Now that we have our value string, let's add it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  return (arrData);
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
