let dirNodeL, dirNodeR
// let colors = [
//   "#ff6551", "#4c56dd", "#40a201", "#674f0d", "#ff4f94", "#be8cb7", "#009c64", "#ff9f6a", "#0057b9", "#28dae9",
//   "#415b16", "#6e3b93", "#9ad498", "#007968", "#03b1d6", "#b47eff", "#ff9397", "#ff64b1", "#f71c75", "#ae2700",
//   "#b84fd5", "#da202d", "#eda697", "#ff804a", "#73db9a", "#e9c16f", "#00d0b3", "#932a55", "#f4bf2c", "#de7400",
//   "#02a3fb", "#08e28f", "#5f4781", "#883c15", "#ff84bb", "#a60f16", "#ffae39", "#db0055", "#7d9100", "#e753d2",
//   "#efb4e4", "#951385", "#b2c810", "#947000", "#ae0041", "#b9d06a", "#0076db", "#65cfff", "#f7bb72", "#007131"
// ]

let colors = [
  "#fd9400", "#000da3", "#1ed013", "#ff4cb3", "#009634", "#f70074", "#01b48a", "#c30018", "#0066dd", "#d5b500",
  "#002d8a", "#ffb134", "#7384ff", "#b4d256", "#42005b", "#818d00", "#9084ff", "#235300", "#ff90f8", "#042e00",
  "#8899ff", "#b24f00", "#0072ce", "#8c5a00", "#53b3ff", "#4e3e00", "#baacff", "#b9cf81", "#990077", "#95d5a0",
  "#92004e", "#007854", "#750024", "#d9c490", "#291f4b", "#ffa293", "#015078", "#e1afa8", "#421820", "#7b617f"
]
let charts = [
  { id: 'chart1', chart: null, datasets: [], config: {}, title: 'System Utilization', xLabel: 'Minutes', yLabel: 'Percent', convert: d => Math.round(d * 100), selected: ['SPU_CPU', 'SPU_DISK', 'SPU_FABRIC', 'SPU_MEMORY'] },
  { id: 'chart2', chart: null, datasets: [], config: {}, title: 'Scheduler SN', xLabel: 'Minutes', yLabel: 'Count', convert: d => d, selected: ["PLANS_WAITING_LONG", "PLANS_RUNNING_LONG"] },
  { id: 'chart3', chart: null, datasets: [], config: {}, title: 'Scheduler GRA', xLabel: 'Minutes', yLabel: 'Count', convert: d => d, selected: ["SPU_CPU_SECS", "SPU_DISK_READ_SECS", "SPU_DISK_WRITE_SECS", "SPU_DATA_DISK_READ_SECS", "SPU_DATA_DISK_WRITE_SECS"] },
  { id: 'chart4', chart: null, datasets: [], config: {}, title: 'System Utilization', xLabel: 'Minutes', yLabel: 'Percent', convert: d => Math.round(d * 100), selected: ['SPU_CPU', 'SPU_DISK', 'SPU_FABRIC', 'SPU_MEMORY'] },
  { id: 'chart5', chart: null, datasets: [], config: {}, title: 'Scheduler SN', xLabel: 'Minutes', yLabel: 'Count', convert: d => d, selected: ["PLANS_WAITING_LONG", "PLANS_RUNNING_LONG"] },
  { id: 'chart6', chart: null, datasets: [], config: {}, title: 'Scheduler GRA', xLabel: 'Minutes', yLabel: 'Count', convert: d => d, selected: ["SPU_CPU_SECS", "SPU_DISK_READ_SECS", "SPU_DISK_WRITE_SECS", "SPU_DATA_DISK_READ_SECS", "SPU_DATA_DISK_WRITE_SECS"] }
]

function init() {
  dirNodeL = document.getElementById('runDirL')
  dirNodeR = document.getElementById('runDirR')
  Chart.defaults.global.defaultFontColor = 'LightGray'
  // 20200318_085050_stress_Ceilings_10-100-Atomics20
  loadData('wlm/capture_vt_system_util.out').then(data => createChart(data, charts[0]))
  loadData('wlm/capture_vt_sched_sn.out').then(data => createChart(data, charts[1]))
  loadData('wlm/capture_vt_sched_gra.out').then(data => createChart(data, charts[2]))
  loadData('wlm/capture_vt_system_util.out').then(data => createChart(data, charts[3]))
  loadData('wlm/capture_vt_sched_sn.out').then(data => createChart(data, charts[4]))
  loadData('wlm/capture_vt_sched_gra.out').then(data => createChart(data, charts[5]))
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

  let chartElem = document.getElementById(chart.id)
  let ctx = chartElem.getContext('2d')
  let selectElem = createElement(chartElem.parentElement, 'select', { multiple: true, size: 10 });
  selectElem.addEventListener('change', function(evt) {
    chart.selected = Array.from(evt.target.selectedOptions).map(v => v.value)
    chart.config.data.datasets = chart.datasets.filter(dataset => chart.selected.indexOf(dataset.label) > -1)
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
  loadData('output/' + runDir + '/capture_vt_system_util.out').then(data => updateChart(data, charts[0]))
  loadData('output/' + runDir + '/capture_vt_sched_sn.out').then(data => updateChart(data, charts[1]))
  loadData('output/' + runDir + '/capture_vt_sched_gra.out').then(data => updateChart(data, charts[2]))
}

function refreshR() {
  let runDir = dirNodeR.value
  loadData('output/' + runDir + '/capture_vt_system_util.out').then(data => updateChart(data, charts[3]))
  loadData('output/' + runDir + '/capture_vt_sched_sn.out').then(data => updateChart(data, charts[4]))
  loadData('output/' + runDir + '/capture_vt_sched_gra.out').then(data => updateChart(data, charts[5]))
}

function updateChart(data, chart) {
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
  chart.chart.update()
}

function loadData(file) {
  return new Promise((resolve, reject) => {
    SatTrackUtils.ajax({
      type: 'GET',
      url: 'data/' + file,
      responseType: 'text',
      success: (response, context) => resolve(response),
      error: (error, headers) => {
        console.log(error)
        alert('Error loading "' + file + '": ' + error.statusText + ', ' + error.status)
      }
    })
  })
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
