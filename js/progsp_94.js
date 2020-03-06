var camera, scene, renderer, controls, earth, space, axis, tilt, gmst, northPole, ball, sun, light, rose, wall, raycaster, vector;
var dateElem, locElem, infoElem, msgElem, nameElem, skyElem, findElem, gotoElem, timerElem, pauseElem, sunElem, msgId;
var sats = [];
var selected, matsSat, matSel, matFont, arrowHelper, homeMarker, orbitLine, satData;
var actDate = new Date();
var timeStep = 0;
var home, homeGeo, skyView = false;
var spotting = [];
var actSpot = 0;

var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
var dirsAngle, minEle;
var satColors = [0xFF8000, 0x00FF40, 0x0040FF, 0xFFFF00, 0x00FFFF];
var eR = 6.378137;
var fps = 60;
var time = 0;
var clocked = true;
var paused = false;
var sunDate, homeSun;
var spottings = [];
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
  clearMessage();
  // sample();
  scene();
}

function scene() {
  dirsAngle = satellite.degreesToRadians(45 / 2);
  minEle = satellite.degreesToRadians(10);
  actDate = new Date();
  gmst = satellite.gstime(actDate);

  raycaster = new THREE.Raycaster();
  vector = new THREE.Vector3();
  scene = new THREE.Scene();
  // scene.add(new THREE.AxesHelper(90));

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

  northPole = new THREE.Vector3(0, eR, 0)
  earth = new THREE.Group();
  space = new THREE.Group();
  earth.add(createGlobe(eR, 64));
  // earth.add(createClouds(eR, 64));
  scene.add(createStars(100, 64))

  // scene.add(createMarker({x: 9000, y: 0, z: 0}, 0xFF4000));
  // scene.add(createMarker({x: 0, y: 9000, z: 0}, 0x00FF00));
  // scene.add(createMarker({x: 0, y: 0, z: 9000}, 0x0000FF));
  // earth.add(createMarkerGeo(obsGeo[0], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[1], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[2], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[3], 0x00FFFF));
  // space.add(createMarkerGeo(obsGeo[4], 0xFF00FF));
  // space.add(createMarkerGeo(obsGeo[5], 0xFF00FF));

  space.add(earth);

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

  // axial tilt
  tilt = satellite.degreesToRadians(-23.27)
  // earth.rotation.z = tilt;
  axis = new THREE.Vector3(0, tilt, 0).normalize();

  sun = new THREE.Group();
  sun.add(createBall(1.0, 32, 0xFFFF00, light.position));
  space.add(sun);

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
  //invert if Y is negative to ensure teh latitude is comprised between -PI/2 & PI / 2
  if (vec.y < 0) {
    lat = -lat;
  }
  return {
    latitude: satellite.radiansToDegrees(lat).toFixed(6),
    longitude: satellite.radiansToDegrees(lng).toFixed(6),
    height: 250
  };
}

function onKeyUp(evt) {
  switch (evt.key) {
    case ' ':
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
    case 'a':
      camera.getWorldDirection(vector);
      console.log(satellite.radiansToDegrees(vector.x), satellite.radiansToDegrees(vector.y), satellite.radiansToDegrees(vector.z));
      break;
  }
}

function findSat(evt) {
  if (findElem.value != '' && (!selected || findElem.value != selected.id)) {
    sat = sats.find(sat => sat.id.includes(findElem.value))
    console.log(sat, findElem.value)
    if (sat) {
      select(sat);
    } else {
      showMessage("Satellite '" + findElem.value + "' not found", 8)
    }
  } else {
    if (spottings.length > 0) {
      // if (!paused) {
      //   stopTime();
      // }
      // actDate = new Date(spottings[actSpot].visible[0].beg.date);
      // gmst = satellite.gstime(actDate);
      select(spottings[actSpot])
      actSpot++;
    }
  }
}

function selectedSatGroup(evt) {
  console.log(evt.target.value);
  getTles(evt.target.value).then(data => addSatellites(data));
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

    // rotate home to noth pole
    space.quaternion.setFromUnitVectors(
      homeMarker.position.normalize(), // start position
      new THREE.Vector3(0, 1, 0).normalize(), // target position
    );

    earth.remove(homeMarker);
    homeMarker = null;
    rose.visible = true;
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
  if (value.match(/^ *[+-]?[0-9]+\.[0-9]+, *[+-]?[0-9]+\.[0-9]+ *$/)) {
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
      findElem.value = selected.id
      gotoElem.style.display = 'inline-block';
    }
    // var vec = ecf2Vector3(satellite.eciToEcf(selected.OSV.velocity, gmst));
    // var len = vec.length();
    // arrowHelper = new THREE.ArrowHelper(vec.normalize(), ecf2Vector3(satellite.eciToEcf(selected.OSV.position, gmst)), len * 100, 0xFF0000);
    // space.add(arrowHelper);
  } else {
    selected = null;
  }
}

function markHome() {
  space.rotation.set(0, 0, 0);
  skyView = false;
  rose.visible = false;
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
        html += '<tr><td>Altitude</td><td> ' + selected.visible[0].beg.look.elevationD.toFixed(1) + '°, ' + selected.visible[0].max.look.elevationD.toFixed(1) + '°, ' + selected.visible[0].end.look.elevationD.toFixed(1) + '°</td></tr>';
      }
      html += '</table>';
    }
    dateElem.innerHTML = actDate;
    infoElem.innerHTML = html;
    sats.forEach((s, i) => {
      updateSatellite(s);
    });

    positionSun(homeGeo);
    vector.setFromMatrixPosition(sun.children[0].matrixWorld);
    light.position.copy(vector);
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

function positionSun(locGeo) {
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

  // sun to actual position
  var sunPos = SunCalc.getPosition(actDate, locGeo.latitude, locGeo.longitude);
  sunPos.azimuth += Math.PI;
  sunPos.azimuthD = satellite.radiansToDegrees(sunPos.azimuth)
  sunPos.altitudeD = satellite.radiansToDegrees(sunPos.altitude)
  // console.log(loc, sunPos, vecLoc);

  var altAxis = dir.clone().cross(vecLoc).normalize();
  // scene.add(new THREE.ArrowHelper(altAxis, vecLoc, 2, 0xFF0000));
  var aziAxis = vecLoc.clone().normalize();

  dir.applyAxisAngle(altAxis, sunPos.altitude);
  dir.applyAxisAngle(aziAxis, -sunPos.azimuth);
  // scene.add(new THREE.ArrowHelper(dir.normalize(), vecLoc, 80, 0xFFFF00, 0.5, 0.5));

  sun.quaternion.setFromUnitVectors(
    sun.children[0].position.clone().normalize(), // new THREE.Vector3(0, 0, 1), // start position
    dir.normalize(), // target position
  );
}

/*
  Object creation
*/
function createMarkerGeo(at, color) {
  var ecf = satellite.geodeticToEcf({
    latitude: satellite.degreesToRadians(at.latitude),
    longitude: satellite.degreesToRadians(at.longitude),
    height: 300.0
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

function createBall(radius, segments, color, pos) {
  var ball = new THREE.Mesh(
    new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(radius, segments, segments)),
    new THREE.MeshPhongMaterial({
      color: color,
      emissive: color
      // ,wireframe: true
    }));
  ball.position.copy(pos);
  return ball;
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

  globe.rotation.y = satellite.degreesToRadians(-90);
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

function createStars(radius, segments) {
  var stars = new THREE.Group();
  stars.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('img/globe/galaxy_starfield.png'),
      side: THREE.BackSide
    })
  ));
  // stars.add(addCurve(99, 0xFF00FF));
  // var ew = addCurve(99, 0x00FFFF);
  // ew.rotation.y = satellite.degreesToRadians(90);
  // stars.add(ew);
  var loader = new THREE.FontLoader();
  var matFont = new THREE.MeshBasicMaterial({
    color: 0x00FF00
  });
  rose = new THREE.Group();
  rose.visible = false;
  stars.add(rose);
  loader.load('fonts/droid/droid_sans_bold.typeface.json', function(font) {
    fontOpts.font = font;
    dirs.forEach((dir, a) => {
      var geometry = new THREE.TextGeometry(dir, fontOpts);
      var char = new THREE.Mesh(geometry, matFont);
      char.position.set(90 * Math.cos(a * dirsAngle), 35, 90 * Math.sin(a * dirsAngle));
      char.lookAt(-0.4, eR, 0);
      rose.add(char);
    });
    rose.rotation.y = Math.PI / 2
  });
  return stars;
}

function addSatellites(data) {
  satData = JSON.parse(data);
  nameElem.innerHTML = satData.name
  // console.log(satData.tles.length);

  if (orbitLine) {
    space.remove(orbitLine);
  }
  if (arrowHelper) {
    space.remove(arrowHelper);
  }
  findElem.value = '';
  gotoElem.style.display = 'none';
  spottings = [];
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
    // console.log(i, cnt);
  });
  setTimeout(findVisible, 1000, actDate, 24 * 60, 60000);
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
        var eciSol = calcSoloarPos(dtime);
        if (!isEclipsed(satOSV.position, eciSol)) {
          var satECF = satellite.eciToEcf(satOSV.position, gmst);
          var look = satellite.ecfToLookAngles(home, satECF, gmst);
          look.elevationD = satellite.radiansToDegrees(look.elevation);
          look.azimuthD = satellite.radiansToDegrees(look.azimuth);
          if (look.elevation >= minEle) {
            if (!(sat.id in info)) {
              info[sat.id] = { final: false, beg: { date: dtime - step, dd: new Date(dtime - step).toLocaleString(), look: look }, max: { date: dtime, dd: new Date(dtime - step).toLocaleString(), look: look } };
              sat.visible.push(info[sat.id]);
            } else {
              if (look.elevation > info[sat.id].max.look.elevation) {
                info[sat.id].max = { date: dtime, dd: new Date(dtime).toLocaleString(), look: look };
                info[sat.id].end = { date: dtime, dd: new Date(dtime).toLocaleString(), look: look };
              }
            }
          } else {
            if (info[sat.id]) {
              info[sat.id].end = { date: dtime, dd: new Date(dtime).toLocaleString(), look: look };
              delete info[sat.id];
            }
          }
        } else {
          if (info[sat.id]) {
            info[sat.id].end = { date: dtime, dd: new Date(dtime).toLocaleString(), look: look };
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
  spottings = sats.filter(sat => sat.visible.length > 0).sort((a, b) => a.visible[0].beg.date - b.visible[0].beg.date);
  if (!selected) {
    select(spottings[0]);
    actSpot = 1;
  }
  console.log((new Date().getTime() - begTime) + "ms - found " + spottings.length + " visible");
  // console.log(spottings);
  // console.log(spottings.filter(s => s.group == 2).map((s) => { return { id: s.id, visible: s.visible } }));
  // console.log(spottings.map((s) => { return { id: s.id, visible: s.visible } }));
}

function refineVisibility(sat) {
  sat.visible.forEach((visible, v) => {
    if (!visible.final) {
      var date, gmst, sunDate, homeSun, info;
      for (dtime = visible.beg.date; dtime < visible.end.date; dtime += 1000) {
        date = new Date(dtime);
        if (date.getUTCDate() != sunDate) {
          sunDate = date.getUTCDate();
          homeSun = SunCalc.getTimes(date, homeGeo.latitude, homeGeo.longitude, homeGeo.height);
        }
        if (date < homeSun.dawn || date > homeSun.dusk) {
          var satOSV = satellite.propagate(sat.satrec, date);
          var eciSol = calcSoloarPos(dtime);
          if (!isEclipsed(satOSV.position, eciSol)) {
            var gmst = satellite.gstime(date);
            var satECF = satellite.eciToEcf(satOSV.position, gmst);
            var look = satellite.ecfToLookAngles(home, satECF, gmst);
            look.elevationD = satellite.radiansToDegrees(look.elevation);
            look.azimuthD = satellite.radiansToDegrees(look.azimuth);
            if (look.elevation >= minEle) {
              if (!info) {
                info = { beg: { date: dtime, dd: new Date(dtime).toLocaleString(), look: look }, max: { date: dtime, dd: new Date(dtime).toLocaleString(), look: look } };
              } else {
                info.end = { date: dtime, dd: new Date(dtime).toLocaleString(), look: look };
                if (look.elevation > info.max.look.elevation) {
                  info.max = { date: dtime, dd: new Date(dtime).toLocaleString(), look: look };
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
}

function isEclipsed(sat, sol) {
  const xkmper = 6378.135; // Earth equatorial radius - kilometers (WGS '72)
  const sr = 696000.0; // Solar radius - kilometers (IAU 76)
  var sd_sun, sd_earth, delta, earth;

  // length of sat vector
  sat.l = Math.sqrt(sat.x * sat.x + sat.y * sat.y + sat.z * sat.z)
  sd_earth = Math.asin(xkmper / sat.l);

  // subtract sat vector from sol vector
  rho = { x: sol.x - sat.x, y: sol.y - sat.y, z: sol.z - sat.z };
  // length of rho (result) vector
  rho.l = Math.sqrt(rho.x * rho.x + rho.y * rho.y + rho.z * rho.z);

  sd_sun = Math.asin(sr / rho.l);
  // earth is the inverse of sat vector
  earth = { x: -1 * sat.x, y: -1 * sat.y, z: -1 * sat.z, l: 1 * sat.l };

  // angle between sol and earth vectors
  var dot = sol.x * earth.x + sol.y * earth.y + sol.z * earth.z;
  delta = Math.acos(dot / (sol.l * earth.l));

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

function calcSoloarPos(date) {
  const sr = 696000.0; // Solar radius - kilometers (IAU 76)
  const AU = 1.49597870E8; // Astronomical unit - kilometers (IAU 76)
  const secday = 86400.0; // Seconds per day
  const msday = secday * 1000; // Milliseconds per day
  const twopi = Math.PI * 2;
  const rad = Math.PI / 180;

  var jdate, mjd, year, delta_et, T, M, L, e, C, O, Lsa, nu, R, eps;

  jdate = date.valueOf() / msday - 0.5 + 2440588;

  mjd = jdate - 2415020.0;
  year = 1900 + mjd / 365.25;
  // Values determined using data from 1950-1991 in the 1990 Astronomical Almanac.
  // See DELTA_ET.WQ1 for details.
  var delta_et = 26.465 + 0.747622 * (year - 1950) + 1.886913 * Math.sin(twopi * (year - 1975) / 33);
  T = (mjd + delta_et / secday) / 36525.0;
  M = rad * (((358.47583 + ((35999.04975 * T) % 360.0) - (0.000150 + 0.0000033 * T) * Math.sqrt(T)) % 360.0));
  L = rad * (((279.69668 + ((36000.76892 * T) % 360.0) + 0.0003025 * Math.sqrt(T)) % 360.0));
  e = 0.01675104 - (0.0000418 + 0.000000126 * T) * T;
  C = rad * ((1.919460 - (0.004789 + 0.000014 * T) * T) * Math.sin(M) + (0.020094 - 0.000100 * T) * Math.sin(2 * M) + 0.000293 * Math.sin(3 * M));
  O = rad * (((259.18 - 1934.142 * T) % 360.0));
  Lsa = ((L + C - rad * (0.00569 - 0.00479 * Math.sin(O))) % twopi);
  nu = ((M + C) % twopi);
  R = 1.0000002 * (1 - Math.sqrt(e)) / (1 + e * Math.cos(nu));
  eps = rad * (23.452294 - (0.0130125 + (0.00000164 - 0.000000503 * T) * T) * T + 0.00256 * Math.cos(O));
  R = AU * R;
  // console.log(date, jdate, mjd, year, T, M, L, e, C, O, Lsa, nu, R, eps);
  // date, 1583363617646 (4.3.2020)
  // jdate,      2458913.4677968286
  // mjd,          43893.4677968286
  // year,          2020.1737653575046
  // T,                1.2017376790246472
  // M,                1.0452803920932854
  // L,                5.989577235040236
  // e,                0.01670062539916217
  // C,                0.029195863513032057
  // O,               -4.627763514824815
  // Lsa,              6.018757091414635
  // nu,               1.0744762556063174
  // R,        129237439.75784697
  // eps,              0.40904301694534384
  return { x: R * Math.cos(Lsa), y: R * Math.sin(Lsa) * Math.cos(eps), z: R * Math.sin(Lsa) * Math.sin(eps), l: R };
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
  positionSun(homeGeo);
  updateSunInfo();
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
  height: 0
}];

function sample() {
  var actDate = new Date(2020, 2, 25, 12, 37, 46);;
  // You will need GMST for some of the coordinate transforms. http://en.wikipedia.org/wiki/Sidereal_time#Definition
  var gmst = satellite.gstime(actDate);

  // Initialize a satellite record: ISS
  var satrec = satellite.twoline2satrec("1 25544U 98067A   20055.55157548  .00016717  00000-0  10270-3 0  9009", "2 25544  51.6415 190.7274 0005124 308.6091  51.4600 15.49221706 14393");

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
  console.log("Obs GEO", home);
  console.log("Sat GEO", satellite.degreesLat(home.latitude), satellite.degreesLong(home.longitude));
  console.log("Obs ECF", homeEcf);
  console.log("Sat ANG", satellite.ecfToLookAngles(home, satEcf));
  console.log("Sat DOP", satellite.dopplerFactor(homeEcf, satEcf, satellite.eciToEcf(satOSV.velocity, gmst)));
  console.log("Sat TLE", satrec);
}
var fontOpts = { font: null, size: 1, height: 1, curveSegments: 4, bevelEnabled: false, bevelThickness: 0.1, bevelSize: 0.1, bevelOffset: 0, bevelSegments: 3 };
