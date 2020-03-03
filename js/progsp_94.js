var camera, scene, renderer, controls, earth, space, axis, tilt, gmst, northPole, ball, sun, light, raycaster, vector;
var dateElem, locElem, infoElem, msgElem, nameElem, skyElem, msgId;
var sats = [];
var selected, matsSat, matSel, matFont, arrowHelper, homeMarker, orbitLine, satData;
var actDate = new Date();
var home, homeGeo, skyView = false;

var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
var satColors = [0xFF8000, 0x00FF40, 0x0000FF, 0xFFFF00, 0x00FFFF];
var sect;
var eR = 6.378137;
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
  clearMessage();
  // sample();
  scene();
}

function scene() {
  sect = satellite.degreesToRadians(45);
  actDate = new Date();
  gmst = satellite.gstime(actDate);

  raycaster = new THREE.Raycaster();
  vector = new THREE.Vector3();
  scene = new THREE.Scene();
  // scene.name = 'scene';
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5000);
  camera.position.z = 30;

  // scene.add(new THREE.AxesHelper(90));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('tracker').appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.5;
  controls.enableZoom = true;
  controls.noKeys = true;

  northPole = new THREE.Vector3(0, eR, 0)
  earth = new THREE.Group();
  // earth.name = 'earth';
  space = new THREE.Group();
  earth.add(createGlobe(eR, 64));
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

  scene.add(new THREE.AmbientLight(0x808080));
  // scene.add(new THREE.AmbientLight(0x404040));
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
  sun.add(createBall(0.3, 32, 0xFFFF00, light.position));
  space.add(sun);

  updateHome(obsGeo[5]);
  getLocation();
  // positionSun({
  //   latitude: 0,
  //   longitude: 180,
  //   height: 0.0
  // });
  // positionSun({
  //   latitude: -14.104394,
  //   longitude: -75.156210,
  //   height: 0.5
  // });

  geoSat = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.04, 0.01, 0.005));
  geoLead = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.06, 0.02, 0.005));
  geoBig = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.2, 0.2, 0.1));
  matsSat = satColors.map(c => new THREE.MeshPhongMaterial({
    color: c
  }));
  matSel = new THREE.MeshPhongMaterial({
    color: 0xff00ff
  });

  scene.add(space);

  animate();
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keyup', onKeyUp);
  getTles('starlink.js').then(data => addSatellites(data));
}

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

function find(name) {
  sat = sats.find(sat => sat.id == name)
  if (sat) {
    select(sat);
  }
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
  if (selected != newSelected) {
    selected = newSelected;
    selected.mesh.material = matSel;
    orbitLine = orbit(selected)
    space.add(orbitLine);
    var vec = ecf2Vector3(satellite.eciToEcf(selected.OSV.velocity, gmst));
    var len = vec.length();
    arrowHelper = new THREE.ArrowHelper(vec.normalize(), ecf2Vector3(satellite.eciToEcf(selected.OSV.position, gmst)), len*100, 0xFF0000);
    space.add(arrowHelper);
  } else {
    selected = null;
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

function selectedSat(evt) {
  console.log(evt.target.value);
  getTles(evt.target.value).then(data => addSatellites(data));
}

function toggleSky(evt) {
  if (skyView) {
    markHome();
    skyElem.innerHTML = 'Sky';
  } else {
    skyElem.innerHTML = 'Earth';
    skyView = true;
    // move controls and camera to noth pole for sky view
    controls.target.copy(northPole);
    camera.position.copy(northPole);
    camera.position.z += 0.008;
    controls.update();

    // rotate home to noth pole
    space.quaternion.setFromUnitVectors(
      homeMarker.position.normalize(), // start position
      new THREE.Vector3(0, 1, 0).normalize(), // target position
    );

    earth.remove(homeMarker);
    homeMarker = null;
  }
}

function onKeyUp(evt) {
  switch (evt.key) {
    case ' ':
      toggleSky()
      break;
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      checkSun(+evt.key);
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

function markHome() {
  // -34.007113, 18.486086
  space.rotation.set(0, 0, 0);
  skyView = false;
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
  // var sunTimes = SunCalc.getTimes(actDate, homeGeo.latitude, homeGeo.longitude, homeGeo.height);
  // console.log(sunTimes);
  // //azimuth: 0 is south and Math.PI * 3/4 is northwest
  // var sunPos = SunCalc.getPosition(actDate, homeGeo.latitude, homeGeo.longitude);
  // console.log(sunPos, satellite.radiansToDegrees(sunPos.azimuth), satellite.radiansToDegrees(sunPos.altitude));
  // var moonPos = SunCalc.getMoonPosition(actDate, homeGeo.latitude, homeGeo.longitude);
  // var moonPhase = SunCalc.getMoonIllumination(actDate);
  // console.log(moonPos, moonPhase);
  // var moonTimes = SunCalc.getMoonTimes(actDate, homeGeo.latitude, homeGeo.longitude, false);
  // console.log(moonTimes);
}

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
  console.log(loc, sunPos, vecLoc);

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

function animate() {
  requestAnimationFrame(animate);

  actDate = new Date();
  // actDate.setTime(actDate.getTime() - 360000);
  // actDate.setTime(actDate.getTime() + 6000);
  gmst = satellite.gstime(actDate);
  var html = '';
  if (selected) {
    var look = satellite.ecfToLookAngles(home, satellite.eciToEcf(selected.OSV.position, gmst));
    html += '<p><table>';
    html += '<tr><td>Group ' + selected.group + '</td><td>' + selected.id + '</td></tr>'
    html += '<tr><td>Height</td><td>' + satellite.eciToGeodetic(selected.OSV.position, gmst).height.toFixed(2) + 'km</td></tr>';
    html += '<tr><td>Azimut</td><td>' + satellite.radiansToDegrees(look.azimuth).toFixed(2) + '° ' + dirs[Math.floor((look.azimuth + sect / 2) / sect)] + '</td></tr>';
    html += '<tr><td>Elevation</td><td>' + satellite.radiansToDegrees(look.elevation).toFixed(1) + '°</td></tr>';
    html += '<tr><td>Range</td><td>' + look.rangeSat.toFixed(0) + 'km</td></tr></table>';
  }
  dateElem.innerHTML = actDate;
  infoElem.innerHTML = html;

  sats.forEach((s, i) => {
    updateSatellite(s);
  });

  // 5184000 ticks per day
  // space.rotateOnAxis(axis, -satellite.degreesToRadians(0.000069444));
  // space.rotateOnAxis(axis, -satellite.degreesToRadians(1/60));

  // sun.rotation.y += 0.01;
  vector.setFromMatrixPosition(sun.children[0].matrixWorld);
  light.position.copy(vector);
  render();
};

function render() {
  renderer.render(scene, camera);
}

function createBall(radius, segments, color, pos) {
  var ball = new THREE.Mesh(
    new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(radius, segments, segments)),
    new THREE.MeshPhongMaterial({
      color: color
      // ,wireframe: true
    }));
  ball.position.copy(pos);
  return ball;
}

function createGlobe(radius, segments) {
  // http://www.shadedrelief.com/natural3/pages/textures.html
  var globe = new THREE.Group();
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
  // ball = new THREE.Mesh(
  //   new THREE.SphereGeometry(radius, segments/2, segments/2),
  //   new THREE.MeshPhongMaterial({
  //     color: 0x0000FF,
  //     wireframe: true
  //   }));
  globe.add(ball);
  globe.add(addCurve(radius + 0.005, 0x808080));
  var equ = addCurve(radius + 0.005, 0x808080);
  equ.rotation.x = satellite.degreesToRadians(90);
  globe.add(equ);

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
  loader.load('fonts/droid/droid_sans_bold.typeface.json', function(font) {
    fontOpts.font = font;
    var posY = 35;
    var posXZ = 90;
    var posXZm = 64;
    var geometry = new THREE.TextGeometry('N', fontOpts);
    var char = new THREE.Mesh(geometry, matFont);
    char.position.set(-0.4, posY, -posXZ);
    char.lookAt(-0.4, eR, 0);
    stars.add(char);
    geometry = new THREE.TextGeometry('O', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(posXZ, posY, -0.5);
    char.lookAt(0, eR, -0.5);
    stars.add(char);
    geometry = new THREE.TextGeometry('S', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(0.4, posY, posXZ);
    char.lookAt(0.4, eR, 0);
    stars.add(char);
    geometry = new THREE.TextGeometry('W', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(-posXZ, posY, 0.6);
    char.lookAt(0, eR, 0.6);
    stars.add(char);

    geometry = new THREE.TextGeometry('NO', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(posXZm, posY, -posXZm);
    char.lookAt(0, eR, 0);
    stars.add(char);
    geometry = new THREE.TextGeometry('SW', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(-posXZm, posY, posXZm);
    char.lookAt(0, eR, 0);
    stars.add(char);
    geometry = new THREE.TextGeometry('NW', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(-posXZm, posY, -posXZm);
    char.lookAt(0, eR, 0);
    stars.add(char);
    geometry = new THREE.TextGeometry('SO', fontOpts);
    char = new THREE.Mesh(geometry, matFont);
    char.position.set(posXZm, posY, posXZm);
    char.lookAt(0, eR, 0);
    stars.add(char);

  });
  return stars;
}

function addSatellites(data) {
  satData = JSON.parse(data);
  nameElem.innerHTML = satData.name
  console.log(satData.tles.length);

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
  select(sats[0]);
}

function addSatellite(satId, tles, group, num) {
  var mat = matsSat[group];

  var satrec = satellite.twoline2satrec(tles[satId][0], tles[satId][1]);
  var osv = satellite.propagate(satrec, actDate)
  var height = satellite.eciToGeodetic(osv.position, gmst).height

  var geo = height > 20000 ? geoBig : (num == 0 ? geoLead : geoSat);

  var satMesh = new THREE.Mesh(geo, mat);
  sat = { id: satId, satrec: satrec, OSV: osv, mesh: satMesh, mat: mat, group: group };
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

function orbit(sat) {
  var date = actDate;
  var geo = new THREE.Geometry();
  for (var seg = 0; seg < 8*60; seg++) {
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

function showMessage(txt) {
  if (msgId) {
    clearTimeout(msgId);
  }
  msgId = setTimeout(clearMessage, 8000);
  msgElem.innerHTML = txt;
}

function clearMessage() {
  if (msgId) {
    clearTimeout(msgId);
  }
  msgId = null;
  msgElem.innerHTML = 'Use the mouse to change the view and to select satellites';
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
    showMessage('Use valid "latitude,longitude" values like "48.650325, 9.014026"')
  }
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
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    height: position.coords.altitude ? position.coords.altitude : 250
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
