var camera, scene, light, renderer, canvas, controls, earth, space, axis, gmst, info;
var sats = [];
var selected, matSat, matSatSelect, arrowHelper;
var actDate = new Date();

var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
var satColors = [0xFF8000, 0x00A040, 0x0060FF, 0xFFFF00, 0x00FFFF];
var raycaster = new THREE.Raycaster();

function init() {
  console.log("screen = " + screen.width + " x " + screen.height + ", " + window.innerWidth + " x " + window.innerHeight);
  info = document.getElementById('info');
  // sample();
  scene();
}

function scene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5000);
  camera.position.z = 20;

  // scene.add(new THREE.AxesHelper(8));

  earth = new THREE.Group();
  space = new THREE.Group();
  earth.add(createGlobe(6.36, 64));
  scene.add(createStars(100, 64))

  // scene.add(createMarker({x: 9000, y: 0, z: 0}, 0xFF4000));
  // scene.add(createMarker({x: 0, y: 9000, z: 0}, 0x00FF00));
  // scene.add(createMarker({x: 0, y: 0, z: 9000}, 0x0000FF));

  earth.add(createMarkerGeo(home, 0xFF0000));
  // earth.add(createMarkerGeo(obsGeo[0], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[1], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[2], 0x00FFFF));
  // earth.add(createMarkerGeo(obsGeo[3], 0x00FFFF));
  // space.add(createMarkerGeo(obsGeo[4], 0xFF00FF));
  // space.add(createMarkerGeo(obsGeo[5], 0xFF00FF));

  space.add(earth);

  // axial tilt
  var tilt = satellite.degreesToRadians(-23.27)
  space.rotation.z = tilt;
  axis = new THREE.Vector3(0, tilt, 0).normalize();

  // rotate to observer - TODO: not correct
  scene.rotateOnAxis(new THREE.Vector3(0, 1, 0), tilt - home.longitude / 3);
  scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), home.latitude);

  scene.add(new THREE.AmbientLight(0x808080));
  // scene.add(new THREE.AmbientLight(0x404040));
  light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(0, 0, 8);
  light.target.position.set(0, 0, 0);
  // light.castShadow = true;
  // var d = 300;
  // light.shadow.camera = new THREE.OrthographicCamera(-d, d, d, -d, 500, 1600);
  // light.shadow.bias = 0.0001;
  // light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
  scene.add(light);
  // scene.add( new THREE.DirectionalLightHelper( light, 3 ) );

  geoSat = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.03, 0.03, 0.01));
  geoLead = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(0.05, 0.05, 0.01));
  matSat = satColors.map(c => new THREE.MeshPhongMaterial({
    color: c
  }));
  matSatSelect = new THREE.MeshPhongMaterial({
    color: 0xff00ff
  });

  actDate = new Date();
  gmst = satellite.gstime(actDate);

  starlink.forEach((list, i) => {
    var cnt = 0;
    var geo = geoLead;
    for (var satId in list) {
      var sat = addSatellite(satId, list, geo, matSat[i], i);
      geo = geoSat;
      sats.push(sat);
      cnt++;
    }
    // console.log(i, cnt);
  });


  scene.add(space);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('tracker').appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement); //helper to rotate around in scene
  controls.addEventListener('change', render);
  //controls.enableDamping = true;
  //controls.dampingFactor = 0.8;
  controls.enableZoom = false;
  // controls.noKeys = true;

  animate();
  // setTimeout(animate, 100);
  document.addEventListener('mouseup', onMouseUp);
}

function animate() {
  requestAnimationFrame(animate);

  actDate = new Date();
  // actDate.setTime(actDate.getTime() - 360000);
  // actDate.setTime(actDate.getTime() + 6000);
  gmst = satellite.gstime(actDate);
  info.innerHTML = actDate;
  if (selected) {
    var look = satellite.ecfToLookAngles(home, satellite.eciToEcf(selected.OSV.position, gmst));
    var html = actDate + '<p><table>';
    html += '<tr><td>Train ' + selected.train + '</td><td>' + selected.id + '</td></tr>'
    html += '<tr><td>Height</td><td>' + satellite.eciToGeodetic(selected.OSV.position, gmst).height.toFixed(2) + 'km</td></tr>';
    html += '<tr><td>Azimut</td><td>' + satellite.radiansToDegrees(look.azimuth).toFixed(2) + '° '+ dirs[Math.floor(satellite.radiansToDegrees(look.azimuth) / 45 + 0.5)] + '</td></tr>';
    html += '<tr><td>Elevation</td><td>' + satellite.radiansToDegrees(look.elevation).toFixed(1) + '°</td></tr>';
    html += '<tr><td>Range</td><td>' + look.rangeSat.toFixed(0) + 'km</td></tr></table>';
    info.innerHTML = html;
  }

  sats.forEach((s, i) => {
    updateSatellite(s);
  });

  // 5184000 ticks per day
  // space.rotateOnAxis(axis, -satellite.degreesToRadians(0.000069444));
  // space.rotateOnAxis(axis, -satellite.degreesToRadians(1/60));

  render();
};

function render() {
  renderer.render(scene, camera);
}

function createBall(radius, segments) {
  return new THREE.Mesh(
    new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(radius, segments, segments)),
    new THREE.MeshPhongMaterial({
      color: 0x004080,
      // wireframe: true,
    }));
}

function createGlobe(radius, segments) {
  // http://www.shadedrelief.com/natural3/pages/textures.html
  var globe = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load('img/globe/2_no_clouds_4k.jpg'),
      bumpMap: new THREE.TextureLoader().load('img/globe/elev_bump_4k.jpg'),
      bumpScale: 0.1,
      // specularMap: new THREE.TextureLoader().load('img/globe/water_4k.png'),
      // specular: new THREE.Color('grey')
    })
  );
  globe.add(addCurve(radius + 0.01, 0x808080));
  var equ = addCurve(radius + 0.01, 0x808080);
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
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('img/globe/galaxy_starfield.png'),
      side: THREE.BackSide
    })
  );
}

function createMarkerGeo(at, color) {
  var ecf = satellite.geodeticToEcf({
    latitude: at.latitude,
    longitude: at.longitude,
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
    new THREE.Vector3(0, 1, 0),
    vec.normalize()
  );
  // marker.position.copy(vector.clone().multiplyScalar(0.5));
  // marker.lookAt(0.0, 0.0, 0.0);
  return marker;
}

function addSatellite(satId, sats, geo, mat, train) {
  var satMesh = new THREE.Mesh(geo, mat);
  sat = { id: satId, satrec: satellite.twoline2satrec(sats[satId][0], sats[satId][1]), mesh: satMesh, mat: mat, train: train };
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

function velo2Vector3(ecf) {
  return new THREE.Vector3(ecf.y / 1000, ecf.x / 1000, ecf.z / 1000);
}

function onMouseUp(evt) {
  evt.preventDefault();
  var mouse3D = new THREE.Vector3((evt.clientX / window.innerWidth) * 2 - 1, -(evt.clientY / window.innerHeight) * 2 + 1, 0.5);
  raycaster.setFromCamera(mouse3D, camera);
  var intersects = raycaster.intersectObjects(sats.map(sat => sat.mesh));
  if (intersects.length > 0) {
    if (selected) {
      selected.mesh.material = selected.mat;
    }
    selected = sats.find(sat => sat.mesh == intersects[0].object)
    selected.mesh.material = matSatSelect;
    // camera.lookAt(ecf2Vector3(satellite.eciToEcf(selected.OSV.position, gmst)));
    // camera.position.copy(ecf2Vector3(homeEcf));
    if (arrowHelper) {
      space.remove(arrowHelper);
    }
    arrowHelper = new THREE.ArrowHelper(ecf2Vector3(satellite.eciToEcf(selected.OSV.velocity, gmst)), ecf2Vector3(satellite.eciToEcf(selected.OSV.position, gmst)), 0.5, 0xFF0000);
    space.add(arrowHelper);
    // .material.color.setHex(Math.random() * 0xffffff);
    animate();
  }
}

function addCurve(radius, color) {
  // console.log(sat);
  // var pos = getPosition(sat);
  // var d = new THREE.Vector3(pos.x / 1000, pos.y / 1000, pos.z / 1000).length();
  // console.log(pos, d);
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

function sample() {
  var actDate = new Date(2020, 2, 25, 12, 37, 46);;
  // You will need GMST for some of the coordinate transforms. http://en.wikipedia.org/wiki/Sidereal_time#Definition
  var gmst = satellite.gstime(actDate);

  // Initialize a satellite record
  var satrec = satellite.twoline2satrec(starlink[4]["STARLINK-1105"][0], starlink[4]["STARLINK-1105"][1]);
  console.log(satrec);

  //  Propagate satellite using time since satellite epoch (in minutes) => Orbital State Vector
  var satOSV = satellite.sgp4(satrec, minutesSinceTleEpoch(actDate, satrec));
  //  Or you can use a JavaScript Date
  // var satOSV = satellite.propagate(satrec, actDate);
  // console.log("Sat OSV",satOSV);

  // console.log(gmst);

  // You can get ECF, Geodetic, Look Angles, and Doppler Factor.
  var positionEcf = satellite.eciToEcf(satOSV.position, gmst),
    observerEcf = satellite.geodeticToEcf(home),
    positionGd = satellite.eciToGeodetic(satOSV.position, gmst),
    lookAngles = satellite.ecfToLookAngles(home, positionEcf),
    dopplerFactor = satellite.dopplerFactor(observerEcf, positionEcf, satellite.eciToEcf(satOSV.velocity, gmst));

  console.log("Date", actDate);
  console.log("Sat OSV", satOSV.position);
  console.log("Sat ECF", positionEcf);
  console.log("Sat GEO", positionGd);
  console.log("Sat GEO", satellite.degreesLat(positionGd.latitude), satellite.degreesLong(positionGd.longitude));
  console.log("Obs GEO", home);
  console.log("Sat GEO", satellite.degreesLat(home.latitude), satellite.degreesLong(home.longitude));
  console.log("Obs ECF", observerEcf);
  console.log("Sat ANG", lookAngles);
  console.log("Sat DOP", dopplerFactor);

}
// Set the Observer
var obsGeo = [{
  // North pole
  latitude: satellite.degreesToRadians(90),
  longitude: satellite.degreesToRadians(0),
  height: 500.0
}, {
  // South pole
  latitude: satellite.degreesToRadians(-90),
  longitude: satellite.degreesToRadians(0),
  height: 500.0
}, {
  // West pole
  latitude: satellite.degreesToRadians(0),
  longitude: satellite.degreesToRadians(90),
  height: 500.0
}, {
  // East pole
  latitude: satellite.degreesToRadians(0),
  longitude: satellite.degreesToRadians(-90),
  height: 500.0
}, {
  // Home
  latitude: satellite.degreesToRadians(48.65),
  longitude: satellite.degreesToRadians(9.01),
  height: 0.490
}, {
  // Greenwitch Prime Meridian
  latitude: satellite.degreesToRadians(51.478067),
  longitude: satellite.degreesToRadians(0.0),
  height: 0
}, {
  // STARLINK-29 / 0 at Date(2020, 2, 25, 16, 18, 0)
  latitude: -0.028871518386126307,
  longitude: -1.2808969029552153,
  height: 388.61429896926074
}, {
  // STARLINK-1105 / 4 at Date(2020, 2, 25, 12, 37, 46)
  longitude: -2.247223648310454,
  latitude: 0.6068989797002822,
  height: 217.18949708975833
}];
var home = obsGeo[4];
var homeEcf = satellite.geodeticToEcf(home);
