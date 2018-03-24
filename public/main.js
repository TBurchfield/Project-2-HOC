/* main.js */

var nodes = [];
var players = [];
var g_player = null
var max_distance = 40; // max dist from center that a node can be placed
var num_nodes = 100;

/* random integer generator */
var random = function(max=20) {
  return Math.ceil(Math.random() * max) - max/2;
};

/* distance formula */
var dist = function(x1, x2) {
  let total = 0;
  for (let i in x1) {
    total += Math.sqrt(x1[i] - x2[i]);
  }
  return total;
}

/* generates node position, checks for overlap with existing nodes */
var generate_position = function(max) {
  let random_pos = [random(max), random(max), random(max)];
  let tested = false;

  while (!tested) {
    for (let node of nodes) {
      let pos = [node.position.x, node.position.y, node.position.z];
      if (dist(random_pos, pos) < max/5) {
        random_pos = [random(max), random(max), random(max)];
        continue;
      }
    }
    tested = true;
  }
  return {x: random_pos[0], y: random_pos[1], z: random_pos[2]};
}

/* initializes scene, camera, renderer */
var init = function() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#ffffff", 0.002);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 2000);
  camera.position.z = 4;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setClearColor("#001a33");
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild(renderer.domElement);


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
  nodes.push({id: nodes.length, position: node.position, owner: -1});
};

/* renders scene */
var render = function() {
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


init();
make_light();

for (inode = 0; inode < num_nodes; inode++) {
  make_node(generate_position(max_distance), color="#00ff00");
}

make_player({x: 0, y: 0, z: 0});

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
