/* main.js */
var graph = []
var node_ids = new Set();
var socket = io();

// Create an empty scene

var nodes = [];
var players = [];
var g_player = null

/* initializes scene, camera, renderer */
var init = function() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#ffffff", 0.002);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 2000);
  camera.position.z = 4;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setClearColor("#001a33");
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

};

/* makes a pointlight */
var make_light = function(args=["#ffffff", 1, 100000], position=[50, 50, 50]) {
  light = new THREE.PointLight(...args);
  light.position.set(...position);
  scene.add(light);
  return light;
};

/* creates a node at specified position */
var make_node = function(position, color="#ffffff") {
  let geometry  = new THREE.SphereGeometry(.25, 30, 30);
  let material  = new THREE.MeshPhysicalMaterial({color: color})
  let node      = new THREE.Mesh(geometry, material);
  Object.assign(node.position, position);
  scene.add(node);
};

/* renders scene */
function render() {
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(scene.children);
	for (var i = 0; i < intersects.length; i++) {
		intersects[i].object.material.color.set(0xff0000);
	}
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};


/* initialize player */
var make_player = function(position, color="#ffff00") {
  let geometry  = new THREE.ConeGeometry(.05, .1, 10);
  let material  = new THREE.MeshPhysicalMaterial( {color: color} );
  let player    = new THREE.Mesh(geometry, material);
  g_player = player;
  Object.assign(player.position, position);
  scene.add(player);
  players.push({id: players.length, position: player.position});

  controls = new THREE.OrbitControls(camera, player.domElement);
  controls.movementSpeed = 100;
  controls.lookSpeed = 0.1;
  controls.update();

  g_player.add(camera);
}

/* handler */
function onMouseMove(event) {
  event.preventDefault();
  mouse.x =   ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
} 

document.addEventListener('mousemove', onMouseMove, false);

init();
make_light();

make_player({x: 0, y: 0, z: 0});
socket.on('update-graph', function (data) {
  for (var i = 0; i < data.length; i++) {
    if (!node_ids.has(data[i].id)) {
      graph.push(data[i]);
      node_ids.add(data[i].id);
      make_node(data[i].position);
    }
  }
});
socket.emit('connect-user');

render();


var keyDowns = Rx.Observable.fromEvent(document, 'keydown');
var keyUps = Rx.Observable.fromEvent(document, 'keyup');
var keyActions = Rx.Observable
    .merge(keyDowns, keyUps)
    .filter((function() {
        var keysPressed = {};
        return function(e) {
            var k = e.key || e.which;
            if (e.type == 'keyup') {
                delete keysPressed[k];
                return true;
            } else if (e.type == 'keydown') {
                if (keysPressed[k]) {
                    return false;
                } else {
                    keysPressed[k] = true;
                    return true;
                }
            }
        };
    })());

keyActions.subscribe( function(e) {
    console.log(e.type, e.key || e.which, e.timeStamp);
    if (e.keyCode == 87) {
        g_player.position.y += .1;
    } else if (e.keyCode == 83) {
        g_player.position.y -= .1;
    } else if (e.keyCode == 65) {
        g_player.position.x -= .1;
    } else if (e.keyCode == 68) {
        g_player.position.x += .1;
    } else if (e.keyCode == 32) {
        g_player.position.set(0, 0, 0);
    }
  });
