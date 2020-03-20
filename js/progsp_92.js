let table, list

function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight);
  table = document.getElementById('colors')
  list = document.getElementById('list')
  let row
  htmlColors.forEach((hc, i) => {
    if (i % 10 == 0) {
      row = table.insertRow(-1)
    }
    let cell = row.insertCell(-1)
    cell.style.backgroundColor = hc.n
    cell.innerHTML = hc.n
  })
}

function show() {
  console.log(Array.from(table.rows[0].cells).map(c => c.innerHTML))
}

function select(evt) {
  if (evt.target.parentElement == table.rows[0]) {
    table.rows[0].deleteCell(evt.target.cellIndex)
  } else {
    cell = table.rows[0].insertCell(-1)
    cell.style.backgroundColor = evt.target.style.backgroundColor
    cell.innerHTML = evt.target.style.backgroundColor
  }
  list.innerHTML = "[" + Array.from(table.rows[0].cells).map(c => "'" + c.innerHTML + "'") + "]"
}

let htmlColors = [
  { n: 'AliceBlue', c: '#f0f8ff', g: 'White' },
  { n: 'AntiqueWhite', c: '#faebd7', g: 'White' },
  { n: 'Aqua', c: '#00ffff', g: 'Blue' },
  { n: 'AquaMarine', c: '#7fffd4', g: 'Blue' },
  { n: 'Azure', c: '#f0ffff', g: 'White' },
  { n: 'Beige', c: '#f5f5dc', g: 'White' },
  { n: 'Bisque', c: '#ffe4c4', g: 'Brown' },
  { n: 'Black', c: '#000000', g: 'Gray' },
  { n: 'BlanchedAlmond', c: '#ffebcd', g: 'Brown' },
  { n: 'Blue', c: '#0000ff', g: 'Blue' },
  { n: 'BlueViolet', c: '#8a2be2', g: 'Purple' },
  { n: 'Brown', c: '#a52a2a', g: 'Brown' },
  { n: 'BurlyWood', c: '#deb887', g: 'Brown' },
  { n: 'CadetBlue', c: '#5f9ea0', g: 'Blue' },
  { n: 'Chartreuse', c: '#7fff00', g: 'Green' },
  { n: 'Chocolate', c: '#d2691e', g: 'Brown' },
  { n: 'Coral', c: '#ff7f50', g: 'Orange' },
  { n: 'CornFlowerBlue', c: '#6495ed', g: 'Blue' },
  { n: 'Cornsilk', c: '#fff8dc', g: 'Brown' },
  { n: 'Crimson', c: '#dc143c', g: 'Red' },
  { n: 'Cyan', c: '#00ffff', g: 'Blue' },
  { n: 'DarkBlue', c: '#00008b', g: 'Blue' },
  { n: 'DarkCyan', c: '#008b8b', g: 'Green' },
  { n: 'DarkGoldenRod', c: '#b8860b', g: 'Brown' },
  { n: 'DarkGray', c: '#a9a9a9', g: 'Gray' },
  { n: 'DarkGreen', c: '#006400', g: 'Green' },
  { n: 'DarkKhaki', c: '#bdb76b', g: 'Yellow' },
  { n: 'DarkMagenta', c: '#8b008b', g: 'Purple' },
  { n: 'DarkOliveGreen', c: '#556b2f', g: 'Green' },
  { n: 'DarkOrange', c: '#ff8c00', g: 'Orange' },
  { n: 'DarkOrchid', c: '#9932cc', g: 'Purple' },
  { n: 'DarkRed', c: '#8b0000', g: 'Red' },
  { n: 'DarkSalmon', c: '#e9967a', g: 'Red' },
  { n: 'DarkSeaGreen', c: '#8fbc8f', g: 'Green' },
  { n: 'DarkSlateBlue', c: '#483d8b', g: 'Purple' },
  { n: 'DarkSlateGray', c: '#2f4f4f', g: 'Gray' },
  { n: 'DarkTurquoise', c: '#00ced1', g: 'Blue' },
  { n: 'DarkViolet', c: '#9400d3', g: 'Purple' },
  { n: 'DeepPink', c: '#ff1493', g: 'Pink' },
  { n: 'DeepSkyBlue', c: '#00bfff', g: 'Blue' },
  { n: 'DimGray', c: '#696969', g: 'Gray' },
  { n: 'DodgerBlue', c: '#1e90ff', g: 'Blue' },
  { n: 'FireBrick', c: '#b22222', g: 'Red' },
  { n: 'FloralWhite', c: '#fffaf0', g: 'White' },
  { n: 'ForestGreen', c: '#228b22', g: 'Green' },
  { n: 'Fuchsia', c: '#ff00ff', g: 'Purple' },
  { n: 'Gainsboro', c: '#dcdcdc', g: 'Gray' },
  { n: 'GhostWhite', c: '#f8f8ff', g: 'White' },
  { n: 'Gold', c: '#ffd700', g: 'Yellow' },
  { n: 'GoldenRod', c: '#daa520', g: 'Brown' },
  { n: 'Gray', c: '#808080', g: 'Gray' },
  { n: 'Green', c: '#008000', g: 'Green' },
  { n: 'GreenYellow', c: '#adff2f', g: 'Green' },
  { n: 'HoneyDew', c: '#f0fff0', g: 'White' },
  { n: 'HotPink', c: '#ff69b4', g: 'Pink' },
  { n: 'IndianRed', c: '#cd5c5c', g: 'Red' },
  { n: 'Indigo', c: '#4b0082', g: 'Purple' },
  { n: 'Ivory', c: '#fffff0', g: 'White' },
  { n: 'Khaki', c: '#f0e68c', g: 'Yellow' },
  { n: 'Lavender', c: '#e6e6fa', g: 'Purple' },
  { n: 'LavenderBlush', c: '#fff0f5', g: 'White' },
  { n: 'LawnGreen', c: '#7cfc00', g: 'Green' },
  { n: 'LemonChiffon', c: '#fffacd', g: 'Yellow' },
  { n: 'LightBlue', c: '#add8e6', g: 'Blue' },
  { n: 'LightCoral', c: '#f08080', g: 'Red' },
  { n: 'LightCyan', c: '#e0ffff', g: 'Blue' },
  { n: 'LightGoldenrodYellow', c: '#fafad2', g: 'Yellow' },
  { n: 'LightGray', c: '#d3d3d3', g: 'Gray' },
  { n: 'LightGreen', c: '#90ee90', g: 'Green' },
  { n: 'LightPink', c: '#ffb6c1', g: 'Pink' },
  { n: 'LightSalmon', c: '#ffa07a', g: 'Orange' },
  { n: 'LightSeaGreen', c: '#20b2aa', g: 'Green' },
  { n: 'LightSkyBlue', c: '#87cefa', g: 'Blue' },
  { n: 'LightSlateGray', c: '#778899', g: 'Gray' },
  { n: 'LightSteelBlue', c: '#b0c4de', g: 'Blue' },
  { n: 'LightYellow', c: '#ffffe0', g: 'Yellow' },
  { n: 'Lime', c: '#00ff00', g: 'Green' },
  { n: 'LimeGreen', c: '#32cd32', g: 'Green' },
  { n: 'Linen', c: '#faf0e6', g: 'White' },
  { n: 'Magenta', c: '#ff00ff', g: 'Purple' },
  { n: 'Maroon', c: '#800000', g: 'Brown' },
  { n: 'MediumAquaMarine', c: '#66cdaa', g: 'Green' },
  { n: 'MediumBlue', c: '#0000cd', g: 'Blue' },
  { n: 'MediumOrchid', c: '#ba55d3', g: 'Purple' },
  { n: 'MediumPurple', c: '#9370d8', g: 'Purple' },
  { n: 'MediumSeaGreen', c: '#3cb371', g: 'Green' },
  { n: 'MediumSlateBlue', c: '#7b68ee', g: 'Blue' },
  { n: 'MediumSpringGreen', c: '#00fa9a', g: 'Green' },
  { n: 'MediumTurquoise', c: '#48d1cc', g: 'Blue' },
  { n: 'MediumVioletRed', c: '#c71585', g: 'Pink' },
  { n: 'MidnightBlue', c: '#191970', g: 'Blue' },
  { n: 'MintCream', c: '#f5fffa', g: 'White' },
  { n: 'MistyRose', c: '#ffe4e1', g: 'White' },
  { n: 'Moccasin', c: '#ffe4b5', g: 'Yellow' },
  { n: 'NavajoWhite', c: '#ffdead', g: 'Brown' },
  { n: 'Navy', c: '#000080', g: 'Blue' },
  { n: 'OldLace', c: '#fdf5e6', g: 'White' },
  { n: 'Olive', c: '#808000', g: 'Green' },
  { n: 'OliveDrab', c: '#6b8e23', g: 'Green' },
  { n: 'Orange', c: '#ffa500', g: 'Orange' },
  { n: 'OrangeRed', c: '#ff4500', g: 'Orange' },
  { n: 'Orchid', c: '#da70d6', g: 'Purple' },
  { n: 'PaleGoldenRod', c: '#eee8aa', g: 'Yellow' },
  { n: 'PaleGreen', c: '#98fb98', g: 'Green' },
  { n: 'PaleTurquoise', c: '#afeeee', g: 'Blue' },
  { n: 'PaleVioletRed', c: '#db7093', g: 'Pink' },
  { n: 'PapayaWhip', c: '#ffefd5', g: 'Yellow' },
  { n: 'PeachPuff', c: '#ffdab9', g: 'Yellow' },
  { n: 'Peru', c: '#cd853f', g: 'Brown' },
  { n: 'Pink', c: '#ffc0cb', g: 'Pink' },
  { n: 'Plum', c: '#dda0dd', g: 'Purple' },
  { n: 'PowderBlue', c: '#b0e0e6', g: 'Blue' },
  { n: 'Purple', c: '#800080', g: 'Purple' },
  { n: 'Red', c: '#ff0000', g: 'Red' },
  { n: 'RosyBrown', c: '#bc8f8f', g: 'Brown' },
  { n: 'RoyalBlue', c: '#4169e1', g: 'Blue' },
  { n: 'SaddleBrown', c: '#8b4513', g: 'Brown' },
  { n: 'Salmon', c: '#fa8072', g: 'Red' },
  { n: 'SandyBrown', c: '#f4a460', g: 'Brown' },
  { n: 'SeaGreen', c: '#2e8b57', g: 'Green' },
  { n: 'SeaShell', c: '#fff5ee', g: 'White' },
  { n: 'Sienna', c: '#a0522d', g: 'Brown' },
  { n: 'Silver', c: '#c0c0c0', g: 'Gray' },
  { n: 'SkyBlue', c: '#87ceeb', g: 'Blue' },
  { n: 'SlateBlue', c: '#6a5acd', g: 'Purple' },
  { n: 'SlateGray', c: '#708090', g: 'Gray' },
  { n: 'Snow', c: '#fffafa', g: 'White' },
  { n: 'SpringGreen', c: '#00ff7f', g: 'Green' },
  { n: 'SteelBlue', c: '#4682b4', g: 'Blue' },
  { n: 'Tan', c: '#d2b48c', g: 'Brown' },
  { n: 'Teal', c: '#008080', g: 'Green' },
  { n: 'Thistle', c: '#d8bfd8', g: 'Purple' },
  { n: 'Tomato', c: '#ff6347', g: 'Orange' },
  { n: 'Turquoise', c: '#40e0d0', g: 'Blue' },
  { n: 'Violet', c: '#ee82ee', g: 'Purple' },
  { n: 'Wheat', c: '#f5deb3', g: 'Brown' },
  { n: 'White', c: '#ffffff', g: 'White' },
  { n: 'WhiteSmoke', c: '#f5f5f5', g: 'White' },
  { n: 'Yellow', c: '#ffff00', g: 'Yellow' },
  { n: 'YellowGreen', c: '#9acd32', g: 'Green' }
]
