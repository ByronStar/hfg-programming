let dirNode
let charts = []

function init() {
  dirNode = document.getElementById('runDir')
  Chart.defaults.global.defaultFontColor = 'LightGray'
  loadData('wlm/capture_vt_system_util.out').then(data =>
    charts.push(createChart(data, { id: 'chart1', title: 'System Utilization', xLabel: 'Minutes', yLabel: 'Percent', data: d => Math.round(d * 100), selected: preselect1 }))
  )
  loadData('wlm/capture_vt_sched_sn.out').then(data =>
    charts.push(createChart(data, { id: 'chart2', title: 'Scheduler SN', xLabel: 'Minutes', yLabel: 'Count', data: d => d, selected: ["PLANS_WAITING_LONG", "PLANS_RUNNING_LONG"] }))
  )
  loadData('wlm/capture_vt_sched_gra.out').then(data =>
    charts.push(createChart(data, { id: 'chart3', title: 'Scheduler GRA', xLabel: 'Minutes', yLabel: 'Count', data: d => d, selected: ["SPU_CPU_SECS", "SPU_DISK_READ_SECS", "SPU_DISK_WRITE_SECS", "SPU_DATA_DISK_READ_SECS", "SPU_DATA_DISK_WRITE_SECS"] }))
  )
}

function refresh() {
  let dir = runDir.value
  loadData('output/' + dir + '/capture_vt_system_util.out').then(data => charts[0].datasets = createDatasets(data, charts[0].chart.config, cfg))
}

function updateChart(data, cfg) {
  let lines = data.split(/\r?\n/)
  let start = null
  config.data.labels = []
  datasets.forEach(dataset => dataset.data = [])
  lines.forEach((line, l) => {
    if (line.length > 0 && !line.startsWith('result') && !line.startsWith('-----') && !line.startsWith('(')) {
      if (l > 1) {
        let d = line.split(/ +\| +/).map(n => +n.trim())
        // skip first column
        datasets.forEach((dataset, i) => dataset.data.push(cfg.data(d[i + 1])))
        if (start) {
          config.data.labels.push(Math.floor((d[0] - start) / 60000000))
        } else {
          start = d[0]
          config.data.labels.push(0)
        }
      }
    }
}

function createChart(data, cfg) {
  let datasets
  let chart
  let colors = []
  let config = {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: JSON.parse(JSON.stringify(baseOptions))
  }
  config.options.title.text = cfg.title;
  config.options.scales.xAxes[0].scaleLabel.labelString = cfg.xLabel;
  config.options.scales.yAxes[0].scaleLabel.labelString = cfg.yLabel;

  let chartElem = document.getElementById(cfg.id)
  let ctx = chartElem.getContext('2d')
  let selectElem = createElement(chartElem.parentElement, 'select', { multiple: true, size: 10 });
  selectElem.addEventListener('change', function(evt) {
    cfg.selected = Array.from(evt.target.selectedOptions).map(v => v.value)
    console.log(cfg.selected)
    config.data.datasets = datasets.filter(dataset => cfg.selected.indexOf(dataset.label) > -1)
    chart.update();
  })

  let lines = data.split(/\r?\n/)
  let start = null
  lines.forEach((line, l) => {
    if (line.length > 0 && !line.startsWith('result') && !line.startsWith('-----') && !line.startsWith('(')) {
      if (l == 1) {
        let columns = line.split(/ +\| +/).map(d => d.trim());
        // skip first column
        columns.shift()
        datasets = columns.map((column, i) => {
          let optElem = createElement(selectElem, 'option', {})
          optElem.appendChild(document.createTextNode(column))
          optElem.value = column
          if (cfg.selected.indexOf(column) > -1) {
            optElem.setAttribute('selected', 'selected');
          }

          let g = groupKeys[i % groupKeys.length]
          let color = colorGroups[g][Math.floor(colorGroups[g].length * Math.random())]

          return {
            label: column,
            backgroundColor: color,
            borderColor: color,
            fill: false,
            data: []
          }
        })
      } else {
        let d = line.split(/ +\| +/).map(n => +n.trim())
        // skip first column
        datasets.forEach((dataset, i) => dataset.data.push(cfg.data(d[i + 1])))
        if (start) {
          config.data.labels.push(Math.floor((d[0] - start) / 60000000))
        } else {
          start = d[0]
          config.data.labels.push(0)
        }
      }
    }
  })

  config.data.datasets = datasets.filter(dataset => cfg.selected.indexOf(dataset.label) > -1)
  chart = new Chart(ctx, config);
  return { chart: chart, datasets: datasets, selected: cfg.selected }
}

function createDatasets(data, config, cfg) {
  let datasets
  return datasets
}

function loadData(file) {
  return new Promise((resolve, reject) => {
    SatTrackUtils.ajax({
      type: 'GET',
      url: 'data/' + file,
      responseType: 'text',
      success: (response, context) => resolve(response),
      error: (error, headers) => {
        console.warn('No connection')
      }
    })
  })
}

let preselect1 = [
  // 'ENTRY_TS',
  // 'HOST_CPU',
  // 'HOST_DISK',
  // 'HOST_FABRIC',
  // 'HOST_MEMORY',
  'SPU_CPU',
  'SPU_DISK',
  'SPU_FABRIC',
  'SPU_MEMORY'
  // 'MAX_SPU_CPU',
  // 'MAX_SPU_DISK',
  // 'MAX_SPU_FABRIC',
  // 'MAX_SPU_MEMORY',
  // 'SPU_TEMP_DISK',
  // 'MAX_SPU_TEMP_DISK',
  // 'SPU_TEMP_DISK_PAGES_ALLOCATED',
  // 'MAX_SPU_TEMP_DISK_PAGES_ALLOCATED'
]

let baseOptions = {
  responsive: true,
  title: {
    display: true,
    text: 'System Utilization'
  },
  tooltips: {
    mode: 'index',
    intersect: false,
  },
  hover: {
    mode: 'nearest',
    intersect: true
  },
  scales: {
    xAxes: [{
      display: true,
      gridLines: {
        color: 'DimGray'
      },
      scaleLabel: {
        display: true,
        labelString: 'Minutes'
      }
    }],
    yAxes: [{
      display: true,
      gridLines: {
        color: 'DimGray'
      },
      scaleLabel: {
        display: true,
        labelString: 'Percent'
      }
    }]
  }
}

function createElement(parent, type, attrList) {
  var elem = document.createElementNS(parent.namespaceURI, type);
  parent.appendChild(elem);
  for (attr in attrList) {
    elem.setAttribute(attr, attrList[attr]);
  }
  return elem;
}

let htmlColors = [
  { n: 'AliceBlue', c: '#f0f8ff', g: 'White' },
  { n: 'AntiqueWhite', c: '#faebd7', g: 'White' },
  { n: 'Aqua', c: '#00ffff', g: 'Blue' },
  { n: 'AquaMarine', c: '#7fffd4', g: 'Blue' },
  { n: 'Azure', c: '#f0ffff', g: 'White' },
  { n: 'Beige', c: '#f5f5dc', g: 'White' },
  { n: 'Bisque', c: '#ffe4c4', g: 'Brown' },
  // { n: 'Black', c: '#000000', g: 'Gray' },
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

let colorGroups = {}

htmlColors.forEach(h => {
  if (h.g in colorGroups) {
    colorGroups[h.g].push(h.n)
  } else {
    colorGroups[h.g] = [h.n]
  }
})

let groupKeys = Object.keys(colorGroups)
console.log(groupKeys)
