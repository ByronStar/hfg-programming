var SatTrackUtils = {};
(function () {
  this.ajax = function (req) {
    const xmlhttp = createXMLHttp()

    // callback for state changes
    xmlhttp.onreadystatechange = function () {
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
          // console.log(xmlhttp);
          switch (req.responseType) {
            case "arraybuffer":
            case "blob":
              req.success(xmlhttp.response, req.context)
              break;
            case "document":
              req.success(xmlhttp.responseXML, req.context)
              break;
            case "json":
              req.success(xmlhttp.response, req.context)
              break;
            case "":
            case "text":
              req.success(xmlhttp.responseText, req.context)
              break;
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

}).apply(SatTrackUtils)
