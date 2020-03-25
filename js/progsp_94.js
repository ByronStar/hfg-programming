var camera, scene, renderer, controls, earth, space, earthAxis, tilt, gmst, northPole, ball, sun, moon, stars, starmap, light, compass, wall, raycaster, vector;
var dateElem, locElem, infoElem, msgElem, nameElem, skyElem, findElem, gotoElem, timerElem, pauseElem, sunElem, menuElem, detailsElem, helpsElem, msgId;
var sats = [];
var selected, matsSat, matSel, matsStars, matFont, arrowHelper, homeMarker, orbitLine, satData;
var actDate = new Date();
var timeStep = 0;
var home, homeGeo, skyView = false;
var spotting = [];
var actSat = 0;
var showInfo = 0;

var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
var dirsAngle, minEle;
var eR = 6.378137;
var fps = 60;
var time = 0;
var clocked = true;
var paused = false;
var sunDate, homeSun;
var visibles = [];
var actStarMat = 3;
var starMapsOffset;
var satColors = ["#02ecda", "#f9004f", "#32b000", "#4333d5", "#caff14", "#db93ff", "#e2ff62", "#0182ca", "#d75800", "#8bd6ff", "#bf8a00", "#b4aaff", "#627700", "#bf79c3", "#b1ffa5", "#9e1847", "#daffd2", "#ff954f", "#3c5a1a", "#645800"]

/*
 - upside down: directions correct?
*/
function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight);
  dateElem = document.getElementById('date');
  locElem = document.getElementById('location');
  msgElem = document.getElementById('msg');
  infoElem = document.getElementById('info');
  nameElem = document.getElementById('name');
  skyElem = document.getElementById('sky');
  findElem = document.getElementById('find');
  gotoElem = document.getElementById('goto');
  timerElem = document.getElementById('timer');
  pauseElem = document.getElementById('pause');
  clockElem = document.getElementById('clock');
  sunElem = document.getElementById('sun');
  menuElem = document.getElementById('menu');
  detailsElem = document.getElementById('details');
  helpElem = document.getElementById('help');
  clearMessage();
  // sample();
  scene();
  // check();
}

function check() {
  // J2000 '2000-01-01T12:00:00.000' should be '2000-01-01T11:58:55.816'
  var chkDate = new Date(); // '1990-04-19T00:00:00.000'
  var chkGmst = satellite.gstime(chkDate);
  var jDate = satellite.jday(chkDate);
  var T = jCentury(jDate);
  // var v0 = calcSolarPos(chkDate.getTime())
  var v0 = calcSolarPos0(chkDate)
  // var v2 = calcSolarEcliptic(T)
  var dist = {
    Mercury: 138933300,
    Venus: 105191200,
    Mars: 226111600,
    Jupiter: 810726400,
    Saturn: 1556221100,
    Uranus: 3092380200,
    Neptune: 4620619300
  }
  var planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  planets.forEach((p) => {
    var v1 = calcPlanet(p, T)
    var vx = vAdd(v0, v1)
    console.log(chkDate, jDate, T, p, v0, v1, vx, dist[p]);
  })
}

function scene() {
  // console.log(satellite.radiansToDegrees(0.0365914186), satellite.radiansToDegrees(0.5077307372));
  dirsAngle = satellite.degreesToRadians(45 / 2);
  minEle = satellite.degreesToRadians(10);
  actDate = new Date();
  gmst = satellite.gstime(actDate);

  raycaster = new THREE.Raycaster();
  vector = new THREE.Vector3();
  scene = new THREE.Scene();
  // scene.add(new THREE.AxesHelper(90));

  // axial tilt
  tilt = satellite.degreesToRadians(23.4386111111)
  earthAxis = new THREE.Vector3(0, tilt, 0).normalize();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5000);
  camera.position.z = 20;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('tracker').appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  controls.enableZoom = true;
  controls.noKeys = true;
  // needs controls.update();
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.5;

  northPole = new THREE.Vector3(0, eR + 0.005, 0)
  earth = new THREE.Group();
  space = new THREE.Group();
  earth.add(createGlobe(eR, 64));
  // earth.add(createClouds(eR, 64));
  space.add(earth);
  space.add(createStars(100, 64))
  scene.add(createCompass());


  var T = jCentury(satellite.jday(actDate));
  // var v0 = calcSolarPos(chkDate.getTime())
  var sunPos = calcSolarPos0(actDate)
  var pos = vMultS(vAdd(sunPos, calcPlanet('Mars', T)), 1E-4)
  console.log(pos,  ecf2Vector3(satellite.eciToEcf(pos, gmst)))
  space.add(createBall(0.5, 32, 0xFF0000, 0xFF0000, ecf2Vector3(satellite.eciToEcf(pos, gmst))));

  // scene.add(createMarker({x: 9000, y: 0, z: 0}, 0xFF4000));
  // scene.add(createMarker({x: 0, y: 9000, z: 0}, 0x00FF00));
  // scene.add(createMarker({x: 0, y: 0, z: 9000}, 0x0000FF));
  // earth.add(createMarkerGeo(obsGeo[0], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[1], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[2], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[3], 0x00FFFF));
  // space.add(createMarkerGeo(obsGeo[4], 0xFF00FF));
  // space.add(createMarkerGeo(obsGeo[5], 0xFF00FF));
  // space.add(createMarkerGeo(obsGeo[7], 0xFF00FF));

  // scene.add(new THREE.AmbientLight(0x808080));
  scene.add(new THREE.AmbientLight(0x404040));
  light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(0, 0, 80);
  light.target.position.set(0, 0, 0);
  // light.castShadow = true;
  // var d = 300;
  // light.shadow.camera = new THREE.OrthographicCamera(-d, d, d, -d, 500, 1600);
  // light.shadow.bias = 0.0001;
  // light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
  scene.add(light);
  // scene.add( new THREE.DirectionalLightHelper( light, 3 ) );

  sun = new THREE.Group();
  sun.add(createBall(1.0, 32, 0xFFFF00, 0xFFFF00, light.position));
  space.add(sun);

  space.add(createMoon(0.8, 32, 0xFFFFC0, new THREE.Vector3(0, 0, 60)));

  updateHome(obsGeo[5]);
  getLocation();

  geoSat = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.04, 0.01, 0.005));
  geoLead = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.06, 0.02, 0.005));
  geoBig = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.2, 0.2, 0.1));
  matsSat = satColors.map(c => new THREE.MeshPhongMaterial({
    color: c,
    emissive: c
  }));
  matSel = new THREE.MeshPhongMaterial({
    color: 0xFF00FF,
    emissive: 0xFF00FF
  });

  scene.add(space);

  time = new Date().getTime();
  animate();
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keyup', onKeyUp);
  getTles('starlink.js').then(data => addSatellites(data));

  // Map positioning date => nearly 360 degrees offset
  var d = new Date('2020-03-21T12:00:00+00:00');
  starMapsOffset = 11 * Math.PI / 24 + satellite.gstime(d);

  // space.add(new THREE.AxesHelper(110));
  // sun.children[0].add(new THREE.AxesHelper(10));
}

/*
  User input and UI changes
*/
function onMouseUp(evt) {
  evt.preventDefault();
  var mouse3D = new THREE.Vector3((evt.clientX / window.innerWidth) * 2 - 1, -(evt.clientY / window.innerHeight) * 2 + 1, 0.5);
  raycaster.setFromCamera(mouse3D, camera);
  var intersects = raycaster.intersectObjects(sats.map(sat => sat.mesh));
  if (intersects.length > 0) {
    select(sats.find(sat => sat.mesh == intersects[0].object));
  }
  if (evt.ctrlKey) {
    intersects = raycaster.intersectObjects([ball], true);
    if (intersects.length > 0) {
      var pt = intersects[0].point;
      var loc = xyz2Geo(new THREE.Vector3(pt.x, pt.y, pt.z));
      updateHome(loc);
    }
    if (!skyView) {
      intersects = raycaster.intersectObjects([starmap], true);
      if (intersects.length > 0) {
        var pt = intersects[0].point;
        var loc = xyz2Geo(new THREE.Vector3(pt.x, pt.y, pt.z));
        alert(loc.latitude + ", " + loc.longitude);
      }
    }
  }
}

function xyz2Geo(vec) {
  vec.normalize();
  //longitude = angle of the vector around the Y axis
  //-( ) : negate to flip the longitude (3d space specific )
  //- PI / 2 to face the Z axis
  var lng = -Math.atan2(-vec.z, -vec.x) - Math.PI / 2;
  //to bind between -PI / PI
  if (lng < -Math.PI) {
    lng += Math.PI * 2;
  }
  //latitude : angle between the vector & the vector projected on the XZ plane on a unit sphere
  //project on the XZ plane
  var p = new THREE.Vector3(vec.x, 0, vec.z);
  //project on the unit sphere
  p.normalize();
  //commpute the angle ( both vectors are normalized, no division by the sum of lengths )
  var lat = Math.acos(p.dot(vec));
  //invert if Y is negative to ensure the latitude is comprised between -PI/2 & PI / 2
  if (vec.y < 0) {
    lat = -lat;
  }
  lng -= (stars.rotation.y - Math.PI / 2);
  console.log(camera.position)
  return {
    latitude: satellite.radiansToDegrees(lat).toFixed(6),
    longitude: satellite.radiansToDegrees(lng).toFixed(6),
    height: 250
  };
}

function onKeyUp(evt) {
  switch (evt.key) {
    case 'ArrowUp':
      toggleSky()
      break;
    case 'n':
      controls.reset();
      controls.rotateLeft(tilt);
      controls.rotateUp(0);
      controls.update();
      break;
    case 'x':
      controls.reset();
      controls.rotateLeft(-Math.PI / 2);
      controls.rotateUp(0);
      controls.update();
      break;
    case 'y':
      controls.reset();
      controls.rotateLeft(0);
      controls.rotateUp(Math.PI / 2);
      controls.update();
      break;
    case 'z':
      controls.reset();
      controls.rotateLeft(0);
      controls.rotateUp(0);
      controls.update();
      break;
  }
}

function find(id) {
  sat = sats.find(sat => sat.id.includes(id))
  if (sat) {
    select(sat);
  } else {
    showMessage("Satellite '" + id + "' not found", 8)
  }
}

function findSat(evt) {
  if (findElem.value != '' && (!selected || selected != visibles[actSat])) { // findElem.value != selected.id
    find(findElem.value);
  } else {
    if (visibles.length > 0) {
      actSat = (actSat + 1) % visibles.length;
      select(visibles[actSat]);
    }
  }
}

function selectedSatGroup(evt) {
  console.log(evt.target.value);
  getTles(evt.target.value).then(data => addSatellites(data));
}

function toggleMenu(evt) {
  showInfo = (showInfo + 1) % 3;
  switch (showInfo) {
    case 0:
      detailsElem.style.display = 'block';
      helpElem.style.display = 'none';
      menuElem.innerHTML = 'ℹ️';
      break;
    case 1:
      detailsElem.style.display = 'block';
      helpElem.style.display = 'block';
      menuElem.innerHTML = '🔽';
      break;
    case 2:
      detailsElem.style.display = 'none';
      helpElem.style.display = 'none';
      menuElem.innerHTML = '▶️';
      break;
  }
}

function toggleStars(evt) {
  actStarMat = (actStarMat + 1) % matsStars.length;
  starmap.material = matsStars[actStarMat]
}

function toggleSky(evt) {
  if (skyView) {
    markHome();
    skyElem.innerHTML = '🛰';
  } else {
    skyElem.innerHTML = '🌍';
    skyView = true;
    // move controls and camera to noth pole for sky view
    controls.target.copy(northPole);
    camera.position.copy(northPole);
    camera.position.z += 0.008;
    if (selected) {
      var look = satellite.ecfToLookAngles(home, satellite.eciToEcf(selected.OSV.position, gmst));
      if (look.elevation > 0) {
        controls.rotateLeft(look.azimuth - minEle);
        controls.rotateUp(-look.elevation);
      }
    }
    controls.update();

    sats.forEach(sat => {
      sat.mesh.scale.set(0.2, 0.2, 0.2);
    });

    // rotate home to noth pole
    space.quaternion.setFromUnitVectors(
      homeMarker.position.normalize(), // start position
      new THREE.Vector3(0, 1, 0).normalize(), // target position
    );

    earth.remove(homeMarker);
    homeMarker = null;
    compass.visible = true;
    wall.visible = true;
  }
}

function startTime(evt) {
  clocked = true;
  clockElem.innerHTML = '🕰';
  timeStep = 0;
  updateTimer();
  if (paused) {
    actDate = new Date();
    paused = !paused;
    pauseElem.innerHTML = paused ? '⏯' : '⏸';
  }
}

function stopTime(evt) {
  paused = !paused;
  pauseElem.innerHTML = paused ? '⏯' : '⏸';
}

function setTime(evt) {
  if (selected && selected.visible.length > 0) {
    clocked = false;
    clockElem.innerHTML = '⏱';
    timeStep = 0;
    // if (!skyView) {
    //   toggleSky();
    // }
    updateTimer();
    var actSelected = selected;
    actDate = new Date(selected.visible[0].beg.date);
    select(selected);
    select(actSelected);
    if (paused) {
      paused = !paused;
      pauseElem.innerHTML = paused ? '⏯' : '⏸';
    }
  }
}

function backTime(evt) {
  clocked = false;
  clockElem.innerHTML = '⏱';
  if (timeStep > -5 && timeStep <= 5) {
    timeStep--;
  } else {
    if (timeStep > -30 && timeStep <= 30) {
      timeStep -= 5;
    } else {
      timeStep -= 30;
    }
  }
  updateTimer();
}

function forwardTime(evt) {
  clocked = false;
  clockElem.innerHTML = '⏱';
  if (timeStep >= -5 && timeStep < 5) {
    timeStep++;
  } else {
    if (timeStep >= -30 && timeStep < 30) {
      timeStep += 5;
    } else {
      timeStep += 30;
    }
  }
  updateTimer();
}

function updateTimer() {
  timerElem.innerHTML = clocked ? '' : timeStep == 0 ? '+1s' : (timeStep > 0 ? '+' + timeStep : timeStep) + 'm';
}

function locChange(evt) {
  var value = locElem.value;
  console.log(value);
  if (value.match(/^ *[+-]?[0-9]+(\.[0-9]+)?, *[+-]?[0-9]+(\.[0-9]+)? *$/)) {
    clearMessage();
    var coords = value.split(',')
    updateHome({
      latitude: coords[0].trim(),
      longitude: coords[1].trim(),
      height: 0.5
    });
  } else {
    showMessage('Use valid "latitude,longitude" values like "48.650325, 9.014026"', 8)
  }
}

function showMessage(txt, delay) {
  if (msgId) {
    clearTimeout(msgId);
  }
  msgId = setTimeout(clearMessage, delay * 1000);
  msgElem.innerHTML = txt;
}

function clearMessage() {
  if (msgId) {
    clearTimeout(msgId);
  }
  msgId = null;
  msgElem.innerHTML = 'Use the mouse to change the view and to select satellites';
}

function select(newSelected) {
  if (selected) {
    selected.mesh.material = selected.mat;
    if (orbitLine) {
      space.remove(orbitLine);
    }
    if (arrowHelper) {
      space.remove(arrowHelper);
    }
  }
  findElem.value = '';
  gotoElem.style.display = 'none';
  if (selected != newSelected) {
    selected = newSelected;
    selected.mesh.material = matSel;
    orbitLine = orbit(selected)
    space.add(orbitLine);
    if (selected.visible.length > 0) {
      refineVisibility(selected);
      var nextVisible = selected.visible[0].beg.date;
      var mins = Math.floor((nextVisible - actDate.getTime()) / 60000);
      showMessage("Satellite '" + selected.id + "' is visible in " + Math.floor(mins / 60) + 'h ' + mins % 60 + 'm at ' + new Date(nextVisible).toLocaleString(), 15);
      gotoElem.style.display = 'inline-block';
      showDetails(selected);
    }
    findElem.value = selected.id
    // var vec = ecf2Vector3(satellite.eciToEcf(selected.OSV.velocity, gmst));
    // var len = vec.length();
    // arrowHelper = new THREE.ArrowHelper(vec.normalize(), ecf2Vector3(satellite.eciToEcf(selected.OSV.position, gmst)), len * 100, 0xFF0000);
    // space.add(arrowHelper);
  } else {
    selected = null;
  }
}

function showDetails(sat) {
  if (selected.visible.length > 0) {
    refineVisibility(sat);
    var vis = sat.visible[0];
    console.log(sat.id, new Date(vis.beg.date).toLocaleString(), vis.beg.look.elevationD, new Date(vis.max.date).toLocaleTimeString(), vis.max.look.elevationD, new Date(vis.end.date).toLocaleTimeString(), vis.end.look.elevationD);
  }
}

function markHome() {
  space.rotation.set(0, 0, 0);
  skyView = false;
  compass.visible = false;
  wall.visible = false;
  if (!homeMarker) {
    homeMarker = createMarkerGeo(homeGeo, 0xFF0000);
    earth.add(homeMarker);
  }
  var vec = ecf2Vector3(satellite.geodeticToEcf(home));
  homeMarker.position.copy(vec);
  homeMarker.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // start position
    vec.normalize() // target position
  );
  sats.forEach(sat => {
    sat.mesh.scale.set(1.0, 1.0, 1.0);
  });
  // rotate to home position
  controls.reset();
  controls.rotateLeft(-home.longitude);
  controls.rotateUp(home.latitude);
  controls.update();
}

function azimuth2Dir(azimuth) {
  return dirs[Math.floor((azimuth + dirsAngle / 2) / dirsAngle)]
}

function animate() {
  requestAnimationFrame(animate);

  var next = new Date().getTime();
  if (!paused) {
    if (clocked) {
      actDate = new Date();
    } else {
      // actDate.setTime(actDate.getTime() + timeStep * 60000 / fps);
      if (timeStep == 0) {
        actDate.setTime(actDate.getTime() + (next - time));
      } else {
        actDate.setTime(actDate.getTime() + timeStep * 60 * (next - time));
      }
    }
    gmst = satellite.gstime(actDate);
    if (actDate.getUTCDate() != sunDate) {
      sunDate = actDate.getUTCDate();
      updateSunInfo();
    }
    var html = '';
    if (selected) {
      var look = satellite.ecfToLookAngles(home, satellite.eciToEcf(selected.OSV.position, gmst));
      html += '<p><table>';
      html += '<tr><td>Group ' + selected.group + '</td><td>' + selected.id + '</td></tr>'
      html += '<tr><td>Height</td><td>' + satellite.eciToGeodetic(selected.OSV.position, gmst).height.toFixed(2) + 'km</td></tr>';
      html += '<tr><td>Azimut</td><td>' + satellite.radiansToDegrees(look.azimuth).toFixed(2) + '° ' + azimuth2Dir(look.azimuth) + '</td></tr>';
      html += '<tr><td>Altitude</td><td>' + satellite.radiansToDegrees(look.elevation).toFixed(1) + '°</td></tr>';
      html += '<tr><td>Range</td><td>' + look.rangeSat.toFixed(0) + 'km</td></tr>';
      if (selected.visible.length > 0) {
        var nextVisible = selected.visible[0].beg.date;
        var mins = Math.floor((nextVisible - actDate.getTime()) / 60000);
        html += '<tr><td>Visible in</td><td> ' + Math.round(mins / 60) + 'h ' + mins % 60 + 'm</td></tr>';
        html += '<tr><td>Azimut</td><td> ' + azimuth2Dir(selected.visible[0].beg.look.azimuth) + ' -> ' + azimuth2Dir(selected.visible[0].end.look.azimuth) + '</td></tr>';
        html += '<tr><td>Altitude</td><td> ' + selected.visible[0].beg.look.elevationD + '°, ' + selected.visible[0].max.look.elevationD + '°, ' + selected.visible[0].end.look.elevationD + '°</td></tr>';
      }
      html += '</table>';
    }
    dateElem.innerHTML = actDate;
    infoElem.innerHTML = html;
    sats.forEach((s, i) => {
      updateSatellite(s);
    });

    positionSunAndMoon(actDate, homeGeo);
    vector.setFromMatrixPosition(sun.children[0].matrixWorld);
    light.position.copy(vector);

    stars.rotation.y = home.longitude + starMapsOffset - gmst;
  }
  time = next;

  render();
};

function render() {
  renderer.render(scene, camera);
}

function updateSunInfo() {
  homeSun = SunCalc.getTimes(actDate, homeGeo.latitude, homeGeo.longitude, homeGeo.height);
  // console.log(homeSun);
  sunElem.innerHTML = '🌞 ' + homeSun.dawn.toLocaleTimeString() + ' 🌙 ' + homeSun.dusk.toLocaleTimeString();
}

function positionSunAndMoon(date, locGeo) {
  loc = {
    latitude: satellite.degreesToRadians(locGeo.latitude),
    longitude: satellite.degreesToRadians(locGeo.longitude),
    height: locGeo.height
  }
  var vecLoc = ecf2Vector3(satellite.geodeticToEcf(loc));
  // scene.add(new THREE.PlaneHelper(new THREE.Plane(vecLoc.clone().negate(), eR), 1, 0xffff00));

  // vector from location to northPole
  var dir = northPole.clone().sub(vecLoc);
  // project to the plane defined by normal vecLoc
  var n = vecLoc.clone().normalize();
  // scene.add(new THREE.ArrowHelper(n, vecLoc, 2, 0x0000FF));
  n.multiplyScalar(dir.dot(n) / n.length());
  dir.sub(n).normalize();
  // scene.add(new THREE.ArrowHelper(dir, vecLoc, 2, 0x00FF00));
  var dirMoon = dir.clone();
  var altAxis = dir.clone().cross(vecLoc).normalize();
  // scene.add(new THREE.ArrowHelper(altAxis, vecLoc, 2, 0xFF0000));
  var aziAxis = vecLoc.clone().normalize();

  // sun to actual position
  var sunPos = SunCalc.getPosition(date, locGeo.latitude, locGeo.longitude);
  sunPos.azimuth += Math.PI;
  dir.applyAxisAngle(altAxis, sunPos.altitude);
  dir.applyAxisAngle(aziAxis, -sunPos.azimuth);
  // scene.add(new THREE.ArrowHelper(dir.normalize(), vecLoc, 80, 0xFFFF00, 0.5, 0.5));
  sun.quaternion.setFromUnitVectors(
    sun.children[0].position.clone().normalize(), // start position
    dir.normalize(), // target position
  );

  // moon to actual position
  var moonPos = SunCalc.getMoonPosition(date, locGeo.latitude, locGeo.longitude);
  moonPos.azimuth += Math.PI;
  dirMoon.applyAxisAngle(altAxis, moonPos.altitude);
  dirMoon.applyAxisAngle(aziAxis, -moonPos.azimuth);
  moon.children[0].position.z = moonPos.distance / 10000;
  // console.log(moonPos.distance);
  // scene.add(new THREE.ArrowHelper(dir.normalize(), vecLoc, 80, 0xFFFF00, 0.5, 0.5));
  moon.quaternion.setFromUnitVectors(
    moon.children[0].position.clone().normalize(), // start position
    dirMoon.normalize(), // target position
  );
}

/*
  Object creation
*/
function createMarkerGeo(at, color) {
  var ecf = satellite.geodeticToEcf({
    latitude: satellite.degreesToRadians(at.latitude),
    longitude: satellite.degreesToRadians(at.longitude),
    height: at.height
  });
  return createMarker(ecf2Vector3(ecf), color);
}

function createMarker(vec, color) {
  var marker = new THREE.Mesh(
    new THREE.BufferGeometry().fromGeometry(new THREE.CylinderGeometry(0.04, 0.001, 0.6, 16)),
    new THREE.MeshPhongMaterial({
      color: color
    }));

  marker.position.copy(vec);
  // align object with given axis to a vector
  marker.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // start position
    vec.normalize() // target position
  );
  // marker.position.copy(vector.clone().multiplyScalar(0.5));
  // marker.lookAt(0.0, 0.0, 0.0);
  return marker;
}

function createBall(radius, segments, color, emissive, pos) {
  var ball = new THREE.Mesh(
    new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(radius, segments, segments)),
    new THREE.MeshPhongMaterial({
      color: color,
      emissive: emissive,
      specular: new THREE.Color(color),
      shininess: 0.5
      // ,wireframe: true
    }));
  ball.position.copy(pos);
  return ball;
}

function createMoon(radius, segments, color, pos) {
  // https://github.com/ofrohn/threex.planets/tree/master/images/maps
  moon = new THREE.Group();
  if (true) {
    var ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('img/globe/moonmap.jpg'),
        bumpMap: new THREE.TextureLoader().load('img/globe/moonbump.jpg'),
        bumpScale: 0.01,
        emissive: 0xFFE0A0,
        emissiveIntensity: 0.3,
        // specular: new THREE.Color( 0x333333 ),
        // shininess: 0.5
      }));
    ball.position.copy(pos);
    ball.rotation.y = Math.PI / 2;
    moon.add(ball);
  } else {
    moon.add(createBall(0.8, 32, 0xFFFFC0, null, new THREE.Vector3(0, 0, 60)));
  }
  return moon;
}

function createGlobe(radius, segments) {
  // http://www.shadedrelief.com/natural3/pages/textures.html
  var globe = new THREE.Group();
  if (true) {
    ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('img/globe/2_no_clouds_4k.jpg'),
        // side: THREE.DoubleSide,
        bumpMap: new THREE.TextureLoader().load('img/globe/elev_bump_4k.jpg'),
        bumpScale: 0.1,
        // specularMap: new THREE.TextureLoader().load('img/globe/water_4k.png'),
        // specular: new THREE.Color('grey')
      }));
  } else {
    ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments / 2, segments / 2),
      new THREE.MeshPhongMaterial({
        color: 0x0000FF,
        wireframe: true
      }));
  }
  ball.rotation.y = -Math.PI / 2;
  globe.add(ball);
  // globe.add(addCurve(radius + 0.005, 0x808080));
  // var equ = addCurve(radius + 0.005, 0x808080);
  // equ.rotation.x = satellite.degreesToRadians(90);
  // globe.add(equ);

  var points = [new THREE.Vector2(1.0, 0.0), new THREE.Vector2(1.0, 0.4)];
  wall = new THREE.Mesh(
    new THREE.LatheGeometry(points, 32),
    new THREE.MeshBasicMaterial({
      color: 0x808080,
      opacity: 0.3,
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  wall.position.y = eR - 0.25;
  wall.visible = false;
  scene.add(wall);

  return globe;
}

function createClouds(radius, segments) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius + 0.003, segments, segments),
    new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load('img/globe/fair_clouds_4k.png'),
      transparent: true
    })
  );
}

function createCompass() {
  var loader = new THREE.FontLoader();
  var matFont = new THREE.MeshBasicMaterial({
    color: 0x00FF00
  });
  compass = new THREE.Group();
  compass.visible = false;
  loader.load('fonts/droid/droid_sans_bold.typeface.json', function(font) {
    fontOpts.font = font;
    dirs.forEach((dir, a) => {
      var geometry = new THREE.TextGeometry(dir, fontOpts);
      var char = new THREE.Mesh(geometry, matFont);
      char.position.set(90 * Math.cos(a * dirsAngle), 35, 90 * Math.sin(a * dirsAngle));
      char.lookAt(-0.4, eR, 0);
      compass.add(char);
    });
  });
  return compass;
}

function createStars(radius, segments) {
  // https://ofrohn.github.io
  stars = new THREE.Group();
  matsStars = [];
  matsStars.push(new THREE.MeshBasicMaterial({
    color: 0x00000F,
    side: THREE.BackSide
  }));
  matsStars.push(new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('img/globe/starfield8s8k.png'),
    side: THREE.BackSide
  }));
  // matsStars.push(new THREE.MeshBasicMaterial({
  //   map: new THREE.TextureLoader().load('img/globe/starfield8n8k.png'),
  //   side: THREE.BackSide
  // }));
  matsStars.push(new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('img/globe/starfield8nd8k.png'),
    side: THREE.BackSide
  }));
  // matsStars.push(new THREE.MeshBasicMaterial({
  //   map: new THREE.TextureLoader().load('img/globe/starfield8nc8k.png'),
  //   side: THREE.BackSide
  // }));
  matsStars.push(new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('img/globe/starfield8ndc8k.png'),
    side: THREE.BackSide
  }));
  starmap = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    matsStars[actStarMat]
  );
  starmap.scale.x = -1;
  stars.add(starmap);

  // stars.add(addCurve(99, 0xFF00FF));
  // var ew = addCurve(99, 0x00FFFF);
  // ew.rotation.y = satellite.degreesToRadians(90);
  // stars.add(ew);
  return stars;
}

function addSatellites(data) {
  satData = JSON.parse(data);
  console.log(satData.tles.length);

  if (orbitLine) {
    space.remove(orbitLine);
  }
  if (arrowHelper) {
    space.remove(arrowHelper);
  }
  findElem.value = '';
  gotoElem.style.display = 'none';
  visibles = [];
  selected = null;

  sats.forEach(sat => {
    space.remove(sat.mesh);
  });
  sats = [];

  satData.tles.forEach((list, i) => {
    var cnt = 0
    for (var satId in list) {
      sats.push(addSatellite(satId, list, i, cnt++));
    }
    console.log(i, cnt);
  });
  nameElem.innerHTML = 'TLEs of ' + getUTCDate(sats[0].satrec)
  setTimeout(findVisible, 1000, actDate, 24 * 60, 60000);
}

function getUTCDate(satrec) {
  var mon = [31, satrec.epochyr % 4 ? 28 : 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var t = satrec.epochdays;
  d = Math.floor(t);
  t = (t - d) * 24;
  h = Math.floor(t);
  t = (t - h) * 60;
  m = Math.floor(t);
  t = (t - m) * 60;
  s = Math.floor(t);
  mm = mon.findIndex(m => {
    d -= m;
    if (d < 0) {
      d += m;
      return true;
    }
    return false;
  });
  // console.log(2000 + satrec.epochyr, mm, d, h, m, s, 0);
  return new Date(Date.UTC(2000 + satrec.epochyr, mm, d, h, m, s));
}

function addSatellite(satId, tles, group, num) {
  var mat = matsSat[group];

  var satrec = satellite.twoline2satrec(tles[satId][0], tles[satId][1]);
  var osv = satellite.propagate(satrec, actDate)
  var height = satellite.eciToGeodetic(osv.position, gmst).height

  var geo = height > 20000 ? geoBig : (num == 0 ? geoLead : geoSat);

  var satMesh = new THREE.Mesh(geo, mat);
  sat = { id: satId, satrec: satrec, OSV: osv, mesh: satMesh, mat: mat, group: group, visible: [] };
  updateSatellite(sat);
  space.add(satMesh);
  return sat;
}

function updateSatellite(sat) {
  sat.mesh.position.copy(getVector(sat));
  sat.mesh.lookAt(0.0, 0.0, 0.0);
}

function getVector(sat) {
  sat.OSV = satellite.propagate(sat.satrec, actDate);
  return ecf2Vector3(satellite.eciToEcf(sat.OSV.position, gmst));
}

function ecf2Vector3(ecf) {
  return new THREE.Vector3(ecf.y / 1000, ecf.z / 1000, ecf.x / 1000);
}

function findVisible(startDate, max, step) {
  var begTime = new Date().getTime();
  // round to minute
  var cut = 60 * 1000;
  // round to day
  // cut = 24 * 60 * 60 * 1000;
  // var sat = sats.find(s => s.id == 'STARLINK-1066');

  var dtime = Math.floor(new Date(startDate).getTime() / cut) * cut;
  var date, gmst, sunDate, homeSun;
  var info = {};
  for (var s = 0; s < max; s++) {
    date = new Date(dtime);
    gmst = satellite.gstime(date);
    if (date.getUTCDate() != sunDate) {
      sunDate = date.getUTCDate();
      homeSun = SunCalc.getTimes(date, homeGeo.latitude, homeGeo.longitude, homeGeo.height);
    }
    // if ((date > homeSun.nightEnd && date < homeSun.dawn || date > homeSun.dusk && date < homeSun.night)) {
    if (date < homeSun.dawn || date > homeSun.dusk) {
      sats.forEach(sat => {
        var satOSV = satellite.propagate(sat.satrec, date);
        var eciSol = calcSolarPos(dtime);
        if (!isEclipsed(satOSV.position, eciSol)) {
          var satECF = satellite.eciToEcf(satOSV.position, gmst);
          var look = satellite.ecfToLookAngles(home, satECF, gmst);
          if (look.elevation >= minEle) {
            look.elevationD = satellite.radiansToDegrees(look.elevation).toFixed(1);
            if (!(sat.id in info)) {
              info[sat.id] = { final: false, beg: { date: dtime - step, look: look }, max: { date: dtime, look: look } };
              sat.visible.push(info[sat.id]);
            } else {
              if (look.elevation > info[sat.id].max.look.elevation) {
                info[sat.id].max = { date: dtime, look: look };
                info[sat.id].end = { date: dtime, look: look };
              }
            }
          } else {
            if (info[sat.id]) {
              info[sat.id].end = { date: dtime, look: look };
              delete info[sat.id];
            }
          }
        } else {
          if (info[sat.id]) {
            info[sat.id].end = { date: dtime, look: look };
            delete info[sat.id];
          }
        }
      });
    } else {
      info = {};
    }
    dtime += step;
    // if ((new Date().getTime() - begTime) > 500) {
    //   // console.log(new Date(startDate), s, max);
    //   if (s + 1 < max) {
    //     setTimeout(findVisible, 1000, dtime, max - s - 1, step);
    //   }
    //   break;
    // }
  }
  visibles = sats.filter(sat => sat.visible.length > 0).sort((a, b) => a.visible[0].beg.date - b.visible[0].beg.date);
  if (!selected) {
    actSat = 0;
    select(visibles[actSat]);
  }
  console.log((new Date().getTime() - begTime) + "ms - found " + visibles.length + " visible");
  // console.log(visibles);
  // console.log(visibles.filter(s => s.group == 2).map((s) => { return { id: s.id, visible: s.visible } }));
  // console.log(visibles.map((s) => { return { id: s.id, visible: s.visible } }));
}

function refineVisibility(sat) {
  var begTime = new Date().getTime();
  sat.visible.forEach((visible, v) => {
    if (!visible.final) {
      var date, gmst, sunDate, homeSun, info;
      var step = Math.max(1000, (visible.end.date - visible.beg.date) / 500);
      for (dtime = visible.beg.date; dtime < visible.end.date; dtime += step) {
        date = new Date(dtime);
        if (date.getUTCDate() != sunDate) {
          sunDate = date.getUTCDate();
          homeSun = SunCalc.getTimes(date, homeGeo.latitude, homeGeo.longitude, homeGeo.height);
        }
        if (date < homeSun.dawn || date > homeSun.dusk) {
          var satOSV = satellite.propagate(sat.satrec, date);
          var eciSol = calcSolarPos(dtime);
          if (!isEclipsed(satOSV.position, eciSol)) {
            var gmst = satellite.gstime(date);
            var satECF = satellite.eciToEcf(satOSV.position, gmst);
            var look = satellite.ecfToLookAngles(home, satECF, gmst);
            if (look.elevation >= minEle) {
              look.elevationD = satellite.radiansToDegrees(look.elevation).toFixed(1);
              // var mag = isBright(satOSV.position, eciSol, look.rangeSat);
              if (!info) {
                info = { beg: { date: dtime, look: look }, max: { date: dtime, look: look } };
              } else {
                info.end = { date: dtime, look: look };
                if (look.elevation > info.max.look.elevation) {
                  info.max = { date: dtime, look: look };
                }
              }
            } else {
              if (info) {
                break;
              }
            }
          } else {
            if (info) {
              break;
            }
          }
        } else {
          if (info) {
            break;
          }
        }
      }
      info.final = true;
      sat.visible[v] = info;
    }
  })
  console.log((new Date().getTime() - begTime) + "ms - finalized " + sat.id + " with " + sat.visible.length + " times");
}

function isBright(sat, sol, rangeSat) {
  var A = 60; // cross section area 4mx15m Solar Panel
  var p = 0.17; // bond albedo 0.0 - 0.5 depending on material
  // vector from sat to sol
  var satEarth = vMultS(sat, -1);
  var satSol = vAdd(satEarth, sol);
  // solar phase angle between sol and sat vectors
  var pha = Math.acos(vDot(sat, satSol) / (sat.l * satSol.l));
  // brightness
  var M = -26.74 - 2.5 * Math.log10((2 / (3 * Math.PI * Math.PI)) * A * p * ((Math.PI - pha) * Math.cos(pha) + Math.sin(pha))) + 5 * Math.log10(rangeSat / 1000);
  return M.toFixed(0);
}

function isEclipsed(sat, sol) {
  const xkmper = 6378.135; // Earth equatorial radius - kilometers (WGS '72)
  const sr = 696000.0; // Solar radius - kilometers (IAU 76)
  var sd_sun, sd_earth, delta, earth;

  // length of sat vector
  sat.l = Math.sqrt(sat.x * sat.x + sat.y * sat.y + sat.z * sat.z)
  sd_earth = Math.asin(xkmper / sat.l);

  // subtract sat vector from sol vector
  rho = vSub(sol, sat);

  sd_sun = Math.asin(sr / rho.l);
  // earth is the inverse of sat vector
  // earth = { x: -1 * sat.x, y: -1 * sat.y, z: -1 * sat.z, l: 1 * sat.l };
  earth = vMultS(sat, -1);

  // angle between sol and earth vectors
  delta = Math.acos(vDot(sol, earth) / (sol.l * earth.l));

  depth = sd_earth - sd_sun - delta;
  // console.log(sd_earth, sd_sun, delta, depth);
  if (sd_earth < sd_sun) {
    // not eclipsed
    return false
  } else {
    if (depth >= 0) {
      // is eclipsed
      return true
    } else {
      // not eclipsed
      return false;
    }
  }
}

function vAdd(v1, v2) {
  var v = { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }
  v.l = vLen(v);
  return v
}

function vSub(v1, v2) {
  var v = { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }
  v.l = vLen(v);
  return v
}

function vDot(v1, v2) {
  var dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
  return dot;
}

function vMultS(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s, l: v.l * Math.abs(s) }
}

function vLen(vec) {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
}

const rad = Math.PI / 180
const deg = 180 / Math.PI
// const AU = 0.989 * 1.49597870E8;
const AU = 1.0 * 1.49597870E8;

function calcSolarPos(date) {
  // var JD = 367 * date.getFullYear() - Math.floor(7.0 * (date.getFullYear() + Math.floor(((date.getMonth() + 1) + 9.0) / 12.0)) / 4.0) + Math.floor(275.0 * (date.getMonth() + 1) / 9.0) + date.getDate() + 1721013.5 + date.getHours() / 24.0 + date.getMinutes() / 1440.0 + date.getSeconds() / 86400.0;
  var JD = satellite.jday(new Date(date))
  var T = jCentury(JD);

  // ecliptic coordinates
  var L = 280.4606184 + 36000.77005361 * T;
  var M = 357.5277233 + 35999.05034 * T;
  var lon = L + 1.914666471 * Math.sin(M * rad) + 0.918994643 * Math.sin(2 * M * rad);

  var ob = 23.439291 - 0.0130042 * T;
  // equatorial coordinates (unused)
  // var RA = Math.atan2(Math.cos(ob * rad) * Math.sin(M * rad), Math.cos(M * rad))
  // var dec = Math.asin(Math.sin(ob * rad) * Math.sin(M * rad))

  // rectangular equatorial coordinates
  var x = AU * Math.cos(lon * rad);
  var y = AU * Math.cos(ob * rad) * Math.sin(lon * rad);
  var z = AU * Math.sin(ob * rad) * Math.sin(lon * rad);

  var vec = { x: x, y: y, z: z, l: AU }
  return vec;
}

function calcSolarPos0(date) {
  var JD = 367 * date.getFullYear() - Math.floor(7.0 * (date.getFullYear() + Math.floor(((date.getMonth() + 1) + 9.0) / 12.0)) / 4.0) + Math.floor(275.0 * (date.getMonth() + 1) / 9.0) + date.getDate() + 1721013.5 + date.getHours() / 24.0 + date.getMinutes() / 1440.0 + date.getSeconds() / 86400.0;
  var UT1 = (JD - 2451545) / 36525;
  var longMSUN = 280.4606184 + 36000.77005361 * UT1;
  var mSUN = 357.5277233 + 35999.05034 * UT1;
  var ecliptic = longMSUN + 1.914666471 * Math.sin(mSUN * rad) + 0.918994643 * Math.sin(2 * mSUN * rad);
  var eccen = 23.439291 - 0.0130042 * UT1;

  var x = Math.cos(ecliptic * rad);
  var y = Math.cos(eccen * rad) * Math.sin(ecliptic * rad);
  var z = Math.sin(eccen * rad) * Math.sin(ecliptic * rad);

  var sunDistance = 0.989 * 1.49597870E8;
  var vec = { x: x * sunDistance, y: y * sunDistance, z: z * sunDistance, l: sunDistance }
  return vec;
}

function calcSolarEcliptic(T) {
  // ecliptic coordinates
  var L = 280.4606184 + 36000.77005361 * T;
  var M = 357.5277233 + 35999.05034 * T;
  // var AU = 1.00014 - 0.01671 * Math.cos(M * rad) - 0.00014 * Math.cos(2 * M * rad).
  var lon = L + 1.914666471 * Math.sin(M * rad) + 0.918994643 * Math.sin(2 * M * rad);
  return { x: AU * Math.cos(lon * rad), y: AU * Math.sin(lon * rad), z: 0.0, l: AU }
}

function calcPlanet(planet, T) {
  var act = { o: rad * 23.43928 }
  for (k in kepler[planet].elem) {
    act[k] = kepler[planet].elem[k] + kepler[planet].rate[k] * T
  }

  // mean anomaly -180° <= act.M <= 180°
  act.M = act.L - act.w1 // + b * T * T + c * Math.cos(f * T) + s * Math.sin(f * T)
  if (act.M < 0) {
    act.M = 360 + act.M % 360
  }

  // eccentric anomaly: M = E - ed * Math.sin(E)
  act.E = eccAnom(act.e, act.M);

  // heliocentric coordinates in orbital plane
  act.x1 = act.a * (Math.cos(rad * act.E) - act.e)
  act.y1 = act.a * Math.sqrt(1 - act.e * act.e) * Math.sin(rad * act.E)

  act.w = act.w1 - act.N
  // heliocentric coordinates in ecliptic pane
  act.x = (Math.cos(rad * act.w) * Math.cos(rad * act.N) - Math.sin(rad * act.w) * Math.sin(rad * act.N) * Math.cos(rad * act.i)) * act.x1 + (-Math.sin(rad * act.w) * Math.cos(rad * act.N) - Math.cos(rad * act.w) * Math.sin(rad * act.N) * Math.cos(rad * act.i)) * act.y1
  act.y = (Math.cos(rad * act.w) * Math.sin(rad * act.N) + Math.sin(rad * act.w) * Math.cos(rad * act.N) * Math.cos(rad * act.i)) * act.x1 + (-Math.sin(rad * act.w) * Math.sin(rad * act.N) + Math.cos(rad * act.w) * Math.cos(rad * act.N) * Math.cos(rad * act.i)) * act.y1
  act.z = Math.sin(rad * act.w) * Math.sin(rad * act.i) * act.x1 + Math.cos(rad * act.w) * Math.sin(rad * act.i) * act.y1

  // heliocentric coordinates in equatorial pane
  act.xq = act.x
  act.yq = Math.cos(act.o) * act.y - Math.sin(act.o) * act.z
  act.zq = Math.sin(act.o) * act.y + Math.cos(act.o) * act.z

  // console.log(act)
  var v = { x: AU * act.x, y: AU * act.y, z: AU * act.z, l: 0 }
  v.l = vLen(v)
  return v;
}

//  M = E - ed * Math.sin(E)
function eccAnom(e, M) {
  var ed = deg * e
  var dM, dE
  var En = M + ed * Math.sin(rad * M)
  i = 0
  do {
    dM = M - (En - ed * Math.sin(rad * En))
    dE = dM / (1 - e * Math.cos(rad * En))
    En = En + dE
  } while (dE < 1E-6 && i++ < 30)
  console.log(i, En, dE)
  return +En.toFixed(6)
}

function jCentury(jDate) {
  // Julian Centuries since Epoch (J2000)
  const J2000 = 2451545.0;
  return T = (jDate - J2000) / 36525;
}

function orbit(sat) {
  var date = actDate;
  var geo = new THREE.Geometry();
  for (var seg = 0; seg < 2 * 60; seg++) {
    // var satOSV = satellite.sgp4(sat.satrec, startPos + seg * 5);
    var satOSV = satellite.propagate(sat.satrec, date);
    geo.vertices.push(ecf2Vector3(satellite.eciToEcf(satOSV.position, satellite.gstime(date))));
    date = new Date(date.getTime() + 60000);
    // console.log(date);
  }
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: satColors[sat.group] })
  );
}

function addCurve(radius, color) {
  var curve = new THREE.EllipseCurve(
    0, 0, // ax, aY
    radius, radius, // xRadius, yRadius
    0, 2 * Math.PI, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
    new THREE.LineBasicMaterial({ color: color })
  );
}

function minutesSinceTleEpoch(date, satrec) {
  return ((date / 86400000) + 2440587.5 - satrec.jdsatepoch) * 1440
}

function updateHome(latLon) {
  homeGeo = latLon;
  home = {
    latitude: satellite.degreesToRadians(homeGeo.latitude),
    longitude: satellite.degreesToRadians(homeGeo.longitude),
    height: homeGeo.height
  };
  locElem.value = homeGeo.latitude + ', ' + homeGeo.longitude;
  markHome();
  positionSunAndMoon(actDate, homeGeo);
  updateSunInfo();
  compass.rotation.y = Math.PI / 2 + home.longitude + 0.005; // text center
}

function getLocation() {
  locElem.value = homeGeo.latitude + ', ' + homeGeo.longitude;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setPosition);
  } else {
    msgElem.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function setPosition(position) {
  console.log(position);
  updateHome({
    latitude: position.coords.latitude.toFixed(6),
    longitude: position.coords.longitude.toFixed(6),
    height: position.coords.altitude / 1000 ? position.coords.altitude : 0.25
  });
}

function getTles(tleData) {
  return new Promise((resolve, reject) => {
    SatTrackUtils.ajax({
      type: 'GET',
      url: 'data/' + tleData,
      responseType: 'text',
      // headers: {
      //   'Content-Type': 'application/json'
      // },
      success: (response, context) => resolve(response),
      error: (error, headers) => {
        console.warn('No connection')
      }
    })
  })
}

// Set the Observer
var obsGeo = [{
  // North pole
  latitude: 90,
  longitude: 0,
  height: 0.5
}, {
  // East pole
  latitude: 0,
  longitude: 90,
  height: 0.5
}, {
  // South pole
  latitude: -90,
  longitude: 0,
  height: 0.5
}, {
  // West pole
  latitude: 0,
  longitude: -90,
  height: 0.5
}, {
  // Z pole
  latitude: 0,
  longitude: 0,
  height: 0.5
}, {
  // Home
  latitude: 48.650325,
  longitude: 9.014026,
  height: 0.49
}, {
  // Greenwitch Prime Meridian
  latitude: 51.478067,
  longitude: 0.0,
  height: 0.5
}, {
  // Andromeda Alpheratz (677)
  latitude: 29.090828370625943,
  longitude: 2.0965338521764996,
  height: 10000
}];

/*
The primary orbital elements are here denoted as:
    N = longitude of the ascending node
    i = inclination to the ecliptic (plane of the Earth's orbit)
    w = argument of perihelion
    a = semi-major axis, or mean distance from Sun
    e = eccentricity (0=circle, 0-1=ellipse, 1=parabola)
    M = mean anomaly (0 at perihelion; increases uniformly with time)
Related orbital elements are:
    w1 = N + w   = longitude of perihelion
    L  = M + w1  = mean longitude
    q  = a*(1-e) = perihelion distance
    Q  = a*(1+e) = aphelion distance
    P  = a ^ 1.5 = orbital period (years if a is in AU, astronomical units)
    T  = Epoch_of_M - (M(deg)/360_deg) / P  = time of perihelion
    v  = true anomaly (angle between position and perihelion)
    E  = eccentric anomaly

Sun
    a = 1.000000                (mean distance, a.u.)
    e = 0.016709 - 1.151E-9     (eccentricity)
    i = 0.0                     (inclination)
    L = M + w1
    w1 = 282.9404 + 4.70935E-5  (longitude of perihelion)
    N = 0.0                     (undefined)
    M = 356.0470 + 0.9856002585 (mean anomaly)
    ob = 23.4393 - 3.563E-7     (obliquity of the ecliptic)
*/

// Keplerian elements and their rates, with respect to the mean ecliptic and equinox of J2000, valid for the time-interval 1800 AD - 2050 AD.
// https://ssd.jpl.nasa.gov/txt/p_elem_t1.txt
var kepler = {
  'Sun': {
    elem: { a: 1.000000, e: 0.20563593, i: 0.0, L: 638.9874, M: 356.0470, w1: 282.9404, N: 0.0, ob: 23.4393 },
    rate: { a: 0.0, e: -1.151E-9, i: 0.0, L: 0.985647352 * 36525, M: 0.9856002585, w1: 0.0000470935, N: 0.0, ob: 3.563E-7 }
  },
  'Mercury': {
    elem: { a: 0.38709927, e: 0.20563593, i: 7.00497902, L: 252.25032350, w1: 77.45779628, N: 48.33076593 },
    rate: { a: 0.00000037, e: 0.00001906, i: -0.00594749, L: 149472.67411175, w1: 0.16047689, N: -0.12534081 }
  },
  'Venus': {
    elem: { a: 0.72333566, e: 0.00677672, i: 3.39467605, L: 181.97909950, w1: 131.60246718, N: 76.67984255 },
    rate: { a: 0.00000390, e: -0.00004107, i: -0.00078890, L: 58517.81538729, w1: 0.00268329, N: -0.27769418 }
  },
  'EM Bary': {
    elem: { a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166, w1: 102.93768193, N: 0.0 },
    rate: { a: 0.00000562, e: -0.00004392, i: -0.01294668, L: 35999.37244981, w1: 0.32327364, N: 0.0 }
  },
  'Mars': {
    elem: { a: 1.52371034, e: 0.09339410, i: 1.84969142, L: -4.55343205, w1: -23.94362959, N: 49.55953891 },
    rate: { a: 0.00001847, e: 0.00007882, i: -0.00813131, L: 19140.30268499, w1: 0.44441088, N: -0.29257343 }
  },
  'Jupiter': {
    elem: { a: 5.20288700, e: 0.04838624, i: 1.30439695, L: 34.39644051, w1: 14.72847983, N: 100.47390909 },
    rate: { a: -0.00011607, e: -0.00013253, i: -0.00183714, L: 3034.74612775, w1: 0.21252668, N: 0.20469106 }
  },
  'Saturn': {
    elem: { a: 9.53667594, e: 0.05386179, i: 2.48599187, L: 49.95424423, w1: 92.59887831, N: 113.66242448 },
    rate: { a: -0.00125060, e: -0.00050991, i: 0.00193609, L: 1222.49362201, w1: -0.41897216, N: -0.28867794 }
  },
  'Uranus': {
    elem: { a: 19.18916464, e: 0.04725744, i: 0.77263783, L: 313.23810451, w1: 170.95427630, N: 74.01692503 },
    rate: { a: -0.00196176, e: -0.00004397, i: -0.00242939, L: 428.48202785, w1: 0.40805281, N: 0.04240589 }
  },
  'Neptune': {
    elem: { a: 30.06992276, e: 0.00859048, i: 1.77004347, L: -55.12002969, w1: 44.96476227, N: 131.78422574 },
    rate: { a: 0.00026291, e: 0.00005105, i: 0.00035372, L: 218.45945325, w1: -0.32241464, N: -0.00508664 }
  },
  'Pluto': {
    elem: { a: 39.48211675, e: 0.24882730, i: 17.14001206, L: 238.92903833, w1: 224.06891629, N: 110.30393684 },
    rate: { a: -0.00031596, e: 0.00005170, i: 0.00004818, L: 145.20780515, w1: -0.04062942, N: -0.01183482 }
  }
}

var osc = {
  'Mercury': {
    elem: { a: 0.38709821, e: 0.20563029, i: 7.00501414, L: 252.25070310, w1: 77.45482015, N: 48.33053734 },
    rate: { a: -0.00000109, e: 0.00002366, i: -0.00593327, L: 72.67674088, w1: 0.15719689, N: -0.12532166 }
  },
  'Venus': {
    elem: { a: 0.72332693, e: 0.00675579, i: 3.39458965, L: 181.97911305, w1: 131.86434118, N: 76.67837464 },
    rate: { a: 0.00000105, e: -0.00006236, i: -0.00085414, L: 197.81682147, w1: -0.32227035, N: -0.27796538 }
  },
  'Earth': {
    elem: { a: 1.00044883, e: 0.01711863, i: 0.00041813, L: 820.42619339, w1: 461.80893715, N: 135.08294263 },
    rate: { a: -0.00086529, e: -0.00086678, i: 0.01343153, L: -0.63135868, w1: 0.22802905, N: 30.77171869 }
  },
  'Mars': {
    elem: { a: 1.52367899, e: 0.09331510, i: 1.84987643, L: 355.45587154, w1: 336.09938879, N: 49.56200626 },
    rate: { a: 0.00000195, e: 0.00029355, i: -0.00822270, L: 60.28503474, w1: 0.45333345, N: -0.30416557 }
  },
  'Jupiter': {
    elem: { a: 5.20433624, e: 0.04878760, i: 1.30463073, L: 394.37584376, w1: 375.56021958, N: 100.49115126 },
    rate: { a: -0.00008803, e: -0.00105778, i: -0.00220646, L: 154.72500556, w1: -0.53499330, N: 0.15957292 }
  },
  'Saturn': {
    elem: { a: 9.58192920, e: 0.05563834, i: 2.48425239, L: 769.99081103, w1: 449.56525391, N: 113.69966051 },
    rate: { a: -0.00288651, e: -0.00146277, i: 0.00460377, L: -217.48495010, w1: 6.32288220, N: -0.23720613 }
  },
  'Uranus': {
    elem: { a: 19.23015642, e: 0.04439250, i: 0.77265574, L: 313.48303065, w1: 170.59401531, N: 74.00240745 },
    rate: { a: -0.10925418, e: 0.00595260, i: -0.00167549, L: 68.34664561, w1: 1.84864352, N: -0.03341381 }
  },
  'Pluto': {
    elem: { a: 39.57170546, e: 0.24945564, i: 17.23579292, L: 239.36256848, w1: 225.22000984, N: 110.03953412 },
    rate: { a: -0.26197572, e: 0.00293937, i: -0.07851806, L: 145.53110770, w1: -2.71462970, N: 0.01732820 }
  }
}

// Keplerian elements and their rates, with respect to the mean ecliptic and equinox of J2000, valid for the time-interval 3000 BC -- 3000 AD
// https://ssd.jpl.nasa.gov/txt/p_elem_t2.txt
var kepler3000 = {
  'Mercury': {
    elem: { a: 0.38709843, e: 0.20563661, i: 7.00559432, L: 252.25166724, w1: 77.45771895, N: 48.33961819 },
    rate: { a: 0.00000000, e: 0.00002123, i: -0.00590158, L: 149472.67486623, w1: 0.15940013, N: -0.12214182 },
  },
  'Venus': {
    elem: { a: 0.72332102, e: 0.00676399, i: 3.39777545, L: 181.97970850, w1: 131.76755713, N: 76.67261496 },
    rate: { a: -0.00000026, e: -0.00005107, i: 0.00043494, L: 58517.81560260, w1: 0.05679648, N: -0.27274174 },
  },
  'EM Bary': {
    elem: { a: 1.00000018, e: 0.01673163, i: -0.00054346, L: 100.46691572, w1: 102.93005885, N: -5.11260389 },
    rate: { a: -0.00000003, e: -0.00003661, i: -0.01337178, L: 35999.37306329, w1: 0.31795260, N: -0.24123856 },
  },
  'Mars': {
    elem: { a: 1.52371243, e: 0.09336511, i: 1.85181869, L: -4.56813164, w1: -23.91744784, N: 49.71320984 },
    rate: { a: 0.00000097, e: 0.00009149, i: -0.00724757, L: 19140.29934243, w1: 0.45223625, N: -0.26852431 },
  },
  'Jupiter': {
    elem: { a: 5.20248019, e: 0.04853590, i: 1.29861416, L: 34.33479152, w1: 14.27495244, N: 100.29282654 },
    rate: { a: -0.00002864, e: 0.00018026, i: -0.00322699, L: 3034.90371757, w1: 0.18199196, N: 0.13024619 },
    corr: { b: -0.00012452, c: 0.06064060, s: -0.35635438, f: 38.35125000 }
  },
  'Saturn': {
    elem: { a: 9.54149883, e: 0.05550825, i: 2.49424102, L: 50.07571329, w1: 92.86136063, N: 113.63998702 },
    rate: { a: -0.00003065, e: -0.00032044, i: 0.00451969, L: 1222.11494724, w1: 0.54179478, N: -0.25015002 },
    corr: { b: 0.00025899, c: -0.13434469, s: 0.87320147, f: 38.35125000 }
  },
  'Uranus': {
    elem: { a: 19.18797948, e: 0.04685740, i: 0.77298127, L: 314.20276625, w1: 172.43404441, N: 73.96250215 },
    rate: { a: -0.00020455, e: -0.00001550, i: -0.00180155, L: 428.49512595, w1: 0.09266985, N: 0.05739699 },
    corr: { b: 0.00058331, c: -0.97731848, s: 0.17689245, f: 7.67025000 }
  },
  'Neptune': {
    elem: { a: 30.06952752, e: 0.00895439, i: 1.77005520, L: 304.22289287, w1: 46.68158724, N: 131.78635853 },
    rate: { a: 0.00006447, e: 0.00000818, i: 0.00022400, L: 218.46515314, w1: 0.01009938, N: -0.00606302 },
    corr: { b: -0.00041348, c: 0.68346318, s: -0.10162547, f: 7.67025000 }
  },
  'Pluto': {
    elem: { a: 39.48686035, e: 0.24885238, i: 17.14104260, L: 238.96535011, w1: 224.09702598, N: 110.30167986 },
    rate: { a: 0.00449751, e: 0.00006016, i: 0.00000501, L: 145.18042903, w1: -0.00968827, N: -0.00809981 },
    corr: { b: -0.01262724, c: 0, s: 0, f: 0 }
  }
}

function sample() {
  var actDate = new Date(2020, 2, 25, 12, 37, 46);
  var homeGeo = obsGeo[5];
  var home = {
    latitude: satellite.degreesToRadians(homeGeo.latitude),
    longitude: satellite.degreesToRadians(homeGeo.longitude),
    height: homeGeo.height
  };
  // You will need GMST for some of the coordinate transforms. http://en.wikipedia.org/wiki/Sidereal_time#Definition
  var gmst = satellite.gstime(actDate);

  // Initialize a satellite record: ISS
  var satrec = satellite.twoline2satrec(
    // "1 25544U 98067A   20055.55157548  .00016717  00000-0  10270-3 0  9009",
    // "2 25544  51.6415 190.7274 0005124 308.6091  51.4600 15.49221706 14393",
    "1 44235C 19029A   20079.18242786  .00000102  00000-0  58438-5 0   790",
    "2 44235  53.0035 260.1775 0002154 105.9997 124.6214 15.12129902    19"
  );

  //  Propagate satellite using time since satellite epoch (in minutes) => Orbital State Vector
  var satOSV = satellite.sgp4(satrec, minutesSinceTleEpoch(actDate, satrec));
  //  Or you can use a JavaScript Date
  // var satOSV = satellite.propagate(satrec, actDate);

  var satEcf = satellite.eciToEcf(satOSV.position, gmst),
    satGeo = satellite.eciToGeodetic(satOSV.position, gmst),
    homeEcf = satellite.geodeticToEcf(home);

  console.log("Date", actDate);
  console.log("gmst", gmst);
  console.log("Sat OSV", satOSV.position);
  console.log("Sat ECF", satEcf);
  console.log("Sat GEO", satGeo);
  console.log("Sat GEO", satellite.degreesLat(satGeo.latitude), satellite.degreesLong(satGeo.longitude));
  console.log("Obs ECF", homeEcf);
  console.log("Obs GEO", home);
  console.log("Obs GEO", satellite.degreesLat(home.latitude), satellite.degreesLong(home.longitude));
  console.log("Sat ANG", satellite.ecfToLookAngles(home, satEcf));
  console.log("Sat DOP", satellite.dopplerFactor(homeEcf, satEcf, satellite.eciToEcf(satOSV.velocity, gmst)));
  console.log("Sat TLE", satrec);
}

var fontOpts = { font: null, size: 1, height: 1, curveSegments: 4, bevelEnabled: false, bevelThickness: 0.1, bevelSize: 0.1, bevelOffset: 0, bevelSegments: 3 };
