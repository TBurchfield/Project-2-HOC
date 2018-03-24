// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera( 100, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 4;

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});

// Configure renderer clear color
renderer.setClearColor("#001a33");

// Configure renderer size
renderer.setSize( window.innerWidth, window.innerHeight );

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );

var light = new THREE.PointLight(0xFFFFFF, 1, 100000);
light.position.set( 50, 50, 50 );
scene.add( light );

var geometry = new THREE.SphereGeometry( 1, 30, 30 );
var material = new THREE.MeshPhysicalMaterial( { color: "#ffff66" } );
var sphere = new THREE.Mesh( geometry, material );

scene.add( sphere );

// Render Loop
var render = function () {
  requestAnimationFrame( render );

  //sphere.rotation.x += 0.01;
  //sphere.rotation.y += 0.01;
  if (camera.fov > 0) {
    camera.fov--;
    camera.updateProjectionMatrix();
  }

  // Render the scene
  renderer.render(scene, camera);
};

render();
