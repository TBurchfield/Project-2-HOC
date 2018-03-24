var graph = []
var node_ids = new Set();
var socket = io();

// Create an empty scene

var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.002 );

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera( 100, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 4;

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});

// Configure renderer clear color
renderer.setClearColor("#001a33");

// Configure renderer size
renderer.setSize( window.innerWidth, window.innerHeight );

// controls
//controls = new THREE.FirstPersonControls( camera );
//controls.movementSpeed = 100;
//controls.lookSpeed = 0.1;

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );

var light = new THREE.PointLight(0xFFFFFF, 1, 100000);
light.position.set( 50, 50, 50 );
scene.add( light );

var geometry = new THREE.SphereGeometry( 1, 30, 30 );
var material = new THREE.MeshPhysicalMaterial( { color: "#ffff66" } );
//var sphere = new THREE.Mesh( geometry, material );
//scene.add( sphere );

// Render Loop
var render = function () {
  requestAnimationFrame( render );

  //sphere.rotation.x += 0.01;
  //sphere.rotation.y += 0.01;
  if (camera.fov > 0) {
    camera.updateProjectionMatrix();
  }

  // Render the scene
  renderer.render(scene, camera);
};

socket.on('update-graph', function (data) {
  for (var i = 0; i < data.length; i++) {
    if (!node_ids.has(data[i].id)) {
      graph.push(data[i]);
      node_ids.add(data[i].id);
      sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = data[i].location[0];
      sphere.position.y = data[i].location[1];
      sphere.position.z = data[i].location[2];
      scene.add(sphere);
    }
  }
});
socket.emit('connect-user');

render();
