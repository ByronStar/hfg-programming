const fs = require('fs')

checkFile('progsp_4nina.html')

function checkFile(filename) {
  fs.readFile(filename, "binary", function(err, file) {
    if (err) {
      console.log(err + "\n")
      return
    }
    // for (i = 0; i < file.length; i++) {
    //   console.log(">>" + file.charAt(i) + "=" +  file.charCodeAt(i).toString(16))
    // }
    console.log(file.replace(/\xe2\x80\x8b/g,""))
    // console.log(err + "\n")(file.replace(/\u200B/g,""), "binary")
  })
}
