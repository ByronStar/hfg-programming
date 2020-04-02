let dirNodeL, dirNodeR, serverL, serverR
let colors = [
  "#fd9400", "#000da3", "#1ed013", "#ff4cb3", "#009634", "#f70074", "#01b48a", "#c30018", "#0066dd", "#d5b500",
  "#002d8a", "#ffb134", "#7384ff", "#b4d256", "#42005b", "#818d00", "#9084ff", "#235300", "#ff90f8", "#042e00",
  "#8899ff", "#b24f00", "#0072ce", "#8c5a00", "#53b3ff", "#4e3e00", "#baacff", "#b9cf81", "#990077", "#95d5a0",
  "#92004e", "#007854", "#750024", "#d9c490", "#291f4b", "#ffa293", "#015078", "#e1afa8", "#421820", "#7b617f"
]
let charts = [
  { id: 'chart1', chart: null, datasets: [], config: {}, title: 'System Utilization', xLabel: 'Minutes', yLabel: 'Percent', yMax: 100, convert: d => Math.round(d * 100), selected: ['SPU_CPU', 'SPU_DISK', 'SPU_FABRIC', 'SPU_MEMORY'] },
  { id: 'chart2', chart: null, datasets: [], config: {}, title: 'Scheduler SN', xLabel: 'Minutes', yLabel: 'Count', yMax: 50, convert: d => d, selected: ["PLANS_STARTED", "PLANS_FINISHED"] },
  { id: 'chart3', chart: null, datasets: [], config: {}, title: 'Scheduler GRA', xLabel: 'Minutes', yLabel: 'Count', yMax: 20, convert: d => d, selected: ["PLANS_STARTED", "PLANS_FINISHED"] },
  { id: 'chart4', chart: null, datasets: [], config: {}, title: 'System Utilization', xLabel: 'Minutes', yLabel: 'Percent', yMax: 100, convert: d => Math.round(d * 100), selected: ['SPU_CPU', 'SPU_DISK', 'SPU_FABRIC', 'SPU_MEMORY'] },
  { id: 'chart5', chart: null, datasets: [], config: {}, title: 'Scheduler SN', xLabel: 'Minutes', yLabel: 'Count', yMax: 50, convert: d => d, selected: ["PLANS_STARTED", "PLANS_FINISHED"] },
  { id: 'chart6', chart: null, datasets: [], config: {}, title: 'Scheduler GRA', xLabel: 'Minutes', yLabel: 'Count', yMax: 20, convert: d => d, selected: ["PLANS_STARTED", "PLANS_FINISHED"] }
]
let interval = 10
let filter

function init() {
  let url = new URL(window.location)
  filter = url.searchParams.get("filter")
  if (filter) {
    filter = new RegExp(filter);
  }
  interval = url.searchParams.get("interval") || interval
  serverL = url.searchParams.get("serverL") || ''
  serverR = url.searchParams.get("serverR") || ''
  document.getElementById('infoL').innerHTML = serverL == '' ? url.hostname : serverL
  document.getElementById('infoR').innerHTML = serverR == '' ? url.hostname : serverR


  console.log("server", serverL, serverR)
  dirNodeL = document.getElementById('runDirL')
  dirNodeR = document.getElementById('runDirR')
  Chart.defaults.global.defaultFontColor = 'LightGray'
  Chart.defaults.global.elements.line.borderWidth = 2
  Chart.defaults.global.elements.point.radius = 2
  if (location.hostname.match(/localhost|127.0.0.1/) && serverL == '' && serverR == '') {
    // fake directory data for testing
    loadData('data/wlm/output.html').then(data => readDirectory(data))
    loadSampleData()
  } else {
    loadData(serverL + 'data/output/').then(data => readDirectory(data, serverL, dirNodeL, 0))
    if (serverL != serverR) {
      loadData(serverR + 'data/output/').then(data => readDirectory(data, serverR, dirNodeR, 3))
    }
  }
  // loadData('http://dashdb-q100m-h1.svl.ibm.com:8000/data/output/').then(data => console.log(data))
}

function loadSampleData() {
  // load sample data
  loadData(serverL + 'data/wlm/capture_vt_system_util.out').then(data => createChart(data, charts[0]))
  loadData(serverL + 'data/wlm/capture_vt_sched_sn.out').then(data => createChart(data, charts[1]))
  loadData(serverL + 'data/wlm/capture_vt_sched_gra.out').then(data => createChart(data, charts[2]))
  loadData(serverR + 'data/wlm/capture_vt_system_util.out').then(data => createChart(data, charts[3]))
  loadData(serverR + 'data/wlm/capture_vt_sched_sn.out').then(data => createChart(data, charts[4]))
  loadData(serverR + 'data/wlm/capture_vt_sched_gra.out').then(data => createChart(data, charts[5]))
}

function readDirectory(data, server, dirNode, c) {
  let cnt = 0
  let lines = data.split(/\r?\n/)
  lines.forEach((line, l) => {
    if (line.startsWith('<li><a href="')) {
      let file = line.match(/>[^<]+/).map(s => s.replace(/[>/]/g, ""))[0] //s.substr(1,s.length-2)
      if (!filter || file.match(filter)) {
        let optElem = createElement(dirNode, 'option', {})
        optElem.appendChild(document.createTextNode(file))
        optElem.value = file
        if (serverL == serverR) {
          optElem = createElement(dirNodeR, 'option', {})
          optElem.appendChild(document.createTextNode(file))
          optElem.value = file
        }
        cnt++
        if (cnt == 2) {
          optElem.setAttribute('selected', 'selected')
        }
      }
    }
  })
  if (!location.hostname.match(/localhost|127.0.0.1/) || serverL != '' || serverR != '') {
    if (cnt > 0) {
      runDir = dirNode.value
      loadData(server + 'data/output/' + runDir + '/capture_vt_system_util.out').then(data => createChart(data, charts[c + 0]))
      loadData(server + 'data/output/' + runDir + '/capture_vt_sched_sn.out').then(data => createChart(data, charts[c + 1]))
      loadData(server + 'data/output/' + runDir + '/capture_vt_sched_gra.out').then(data => createChart(data, charts[c + 2]))
      if (cnt > 1 && serverL == serverR) {
        loadData(server + 'data/output/' + runDir + '/capture_vt_system_util.out').then(data => createChart(data, charts[c + 0]))
        runDir = dirNodeR.value
        loadData(server + 'data/output/' + runDir + '/capture_vt_system_util.out').then(data => createChart(data, charts[3]))
        loadData(server + 'data/output/' + runDir + '/capture_vt_sched_sn.out').then(data => createChart(data, charts[4]))
        loadData(server + 'data/output/' + runDir + '/capture_vt_sched_gra.out').then(data => createChart(data, charts[5]))
      }
    } else {
      loadSampleData()
    }
  }
}

function createChart(data, chart) {
  chart.config = {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: JSON.parse(JSON.stringify(baseOptions))
  }
  chart.config.options.title.text = chart.title;
  chart.config.options.scales.xAxes[0].scaleLabel.labelString = chart.xLabel;
  chart.config.options.scales.yAxes[0].scaleLabel.labelString = chart.yLabel;
    chart.config.options.scales.yAxes[0].ticks = {
        suggestedMin: 0,
        suggestedMax: chart.yMax
    }

  let color = '#0000FF'
  chart.average = {
    label: 'AVG-' + interval,
    backgroundColor: color,
    borderColor: color,
    fill: false,
    data: []
  }

  let chartElem = document.getElementById(chart.id)
  let ctx = chartElem.getContext('2d')
  let selectElem = createElement(chartElem.parentElement, 'select', { multiple: true, size: 10 });
  selectElem.addEventListener('change', function(evt) {
    chart.selected = Array.from(evt.target.selectedOptions).map(v => v.value)
    chart.config.data.datasets = chart.datasets.filter(dataset => chart.selected.indexOf(dataset.label) > -1)
    if (chart.config.data.datasets.length == 1) {
      chart.average.data = movingAverage(chart.config.data.datasets[0].data, interval)
      chart.config.data.datasets.push(chart.average);
    }
    chart.chart.update();
  })

  let lines = data.split(/\r?\n/)
  let start = null
  lines.forEach((line, l) => {
    if (line.length > 0 && !line.startsWith('result') && !line.startsWith('-----') && !line.startsWith('(')) {
      if (l == 1) {
        let columns = line.split(/ +\| +/).map(d => d.trim());
        // skip first column
        columns.shift()
        chart.datasets = columns.map((column, i) => {
          let optElem = createElement(selectElem, 'option', {})
          optElem.appendChild(document.createTextNode(column))
          optElem.value = column
          if (chart.selected.indexOf(column) > -1) {
            optElem.setAttribute('selected', 'selected');
          }
          let color = colors[i]
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
        chart.datasets.forEach((dataset, i) => dataset.data.push(chart.convert(d[i + 1])))
        if (start) {
          chart.config.data.labels.push(Math.floor((d[0] - start) / 60000000))
        } else {
          start = d[0]
          chart.config.data.labels.push(0)
        }
      }
    }
  })

  chart.config.data.datasets = chart.datasets.filter(dataset => chart.selected.indexOf(dataset.label) > -1)
  chart.chart = new Chart(ctx, chart.config);
}

function refreshL() {
  let runDir = dirNodeL.value
  loadData(serverL + 'data/output/' + runDir + '/capture_vt_system_util.out').then(data => updateChart(data, charts[0]))
  loadData(serverL + 'data/output/' + runDir + '/capture_vt_sched_sn.out').then(data => updateChart(data, charts[1]))
  loadData(serverL + 'data/output/' + runDir + '/capture_vt_sched_gra.out').then(data => updateChart(data, charts[2]))
}

function refreshR() {
  let runDir = dirNodeR.value
  loadData(serverR + 'data/output/' + runDir + '/capture_vt_system_util.out').then(data => updateChart(data, charts[3]))
  loadData(serverR + 'data/output/' + runDir + '/capture_vt_sched_sn.out').then(data => updateChart(data, charts[4]))
  loadData(serverR + 'data/output/' + runDir + '/capture_vt_sched_gra.out').then(data => updateChart(data, charts[5]))
}

function updateChart(data, chart) {
  if (chart.chart) {
    let lines = data.split(/\r?\n/)
    let start = null
    chart.config.data.labels = []
    chart.datasets.forEach(dataset => dataset.data = [])
    lines.forEach((line, l) => {
      if (line.length > 0 && !line.startsWith('result') && !line.startsWith('-----') && !line.startsWith('(')) {
        if (l > 1) {
          let d = line.split(/ +\| +/).map(n => +n.trim())
          // skip first column
          chart.datasets.forEach((dataset, i) => dataset.data.push(chart.convert(d[i + 1])))
          if (start) {
            chart.config.data.labels.push(Math.floor((d[0] - start) / 60000000))
          } else {
            start = d[0]
            chart.config.data.labels.push(0)
          }
        }
      }
    })
    chart.config.data.datasets = chart.datasets.filter(dataset => chart.selected.indexOf(dataset.label) > -1)
    if (chart.config.data.datasets.length == 1) {
      chart.average.data = movingAverage(chart.config.data.datasets[0].data, interval)
      chart.config.data.datasets.push(chart.average);
    }
    chart.chart.update()
  } else {
    createChart(data, chart)
  }
}

function loadData(url) {
  return new Promise((resolve, reject) => {
    SatTrackUtils.ajax({
      type: 'GET',
      url: url,
      responseType: 'text',
      success: (response, context) => resolve(response),
      error: (error, headers) => {
        console.log(error)
        alert('Error loading "' + url + '": ' + error.statusText + ', ' + error.status)
      }
    })
  })
}

function movingAverage(d, t) {
  var r = [],
    s = 0,
    ma;
  for (var i = 0; i < d.length; ++i) {
    s += isNaN(d[i]) ? 0 : d[i];
    if (i < t - 1) {
      r.push(NaN);
    } else if (i + 1 === t) {
      ma = s / t;
      r.push(ma);
    } else {
      s -= isNaN(d[i - t]) ? 0 : d[i - t];
      ma = s / t;
      r.push(ma);
    }
  }
  return r;
}


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
