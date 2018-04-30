var camera, scene, renderer, controls, raycaster;

var objects = [];
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

function sign(x) {
  return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

function range_scale(input, init_low, init_high, final_low, final_high) {
  return (input - init_low) * (final_high - final_low) / (init_high - init_low) + final_low;
}

let rays = [
  new THREE.Vector3(0, 0, 1), // up
  new THREE.Vector3(1, 0, 1), // up left
  new THREE.Vector3(1, 0, 0), // left
  new THREE.Vector3(1, 0, -1), // down left
  new THREE.Vector3(0, 0, -1), // down
  new THREE.Vector3(-1, 0, -1), // down right
  new THREE.Vector3(-1, 0, 0), // right
  new THREE.Vector3(-1, 0, 1) // up right
];

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {
  var element = document.body;

  var pointerlockchange = function ( event ) {
    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
      controlsEnabled = true;
      controls.enabled = true;
      blocker.style.display = 'none';
    } else {
      controls.enabled = false;
      blocker.style.display = 'block';
      instructions.style.display = '';
    }
  };

  var pointerlockerror = function ( event ) {
    instructions.style.display = '';
  };

  document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

  document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

  instructions.addEventListener( 'click', function ( event ) {
    instructions.style.display = 'none';

    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    element.requestPointerLock();
  }, false );

} else {
  instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var prevAngle = 0;
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

init();
animate();

function init() {

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );
  scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  controls = new THREE.PointerLockControls( camera, scene );
  scene.add( controls.getObject() );

  var onKeyDown = function ( event ) {
    switch ( event.keyCode ) {
      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true; break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;
      }
  };

  var onKeyUp = function ( event ) {
    switch( event.keyCode ) {
      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
  };
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ), 0, 2 );

  var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
  floorGeometry.rotateX( -Math.PI / 2 );

  var position = floorGeometry.attributes.position;

  for ( var i = 0; i < position.count; i ++ ) {
    vertex.fromBufferAttribute( position, i );

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ( i, vertex.x, vertex.y, vertex.z );
  }

  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  count = floorGeometry.attributes.position.count;
  var colors = [];

  for ( var i = 0; i < count; i ++ ) {
    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colors.push( color.r, color.g, color.b );
  }

  floorGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  var floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

  var floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( floor );

  var boxGeometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
  boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices

  count = boxGeometry.attributes.position.count;
  colors = [];

  for ( var i = 0; i < count; i ++ ) {
    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colors.push( color.r, color.g, color.b );
  }

  boxGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  for ( var i = 0; i < 20; i ++ ) {
    var boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors } );
    boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    var box = new THREE.Mesh( boxGeometry, boxMaterial );
    box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
    box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
    box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

    scene.add( box );
    objects.push( box );
  }

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

  scene.updateMatrixWorld();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

  requestAnimationFrame( animate );

  if ( controlsEnabled === true ) {

    raycaster.ray.origin.copy( controls.getObject().position );
    var intersections = raycaster.intersectObjects( scene.children );
    if(intersections.length > 0){
      console.log(intersections)
    }
    
    var onObject = intersections.length > 0;

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 5.0 * delta;
    velocity.y -= velocity.y * 5.0 * delta;
    velocity.z -= velocity.z * 5.0 * delta;

    direction = camera.getWorldDirection( direction );
    angle = THREE.Math.radToDeg( Math.atan(direction.y) )
    angle = range_scale(angle, -45, 45, -90, 90)
    let radians = THREE.Math.degToRad(angle)

    df = sign(direction.z)
    direction.x = Number( moveLeft ) - Number( moveRight );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) {
      let dt = moveForward ? 1 : -1

      direction.y = df * Math.sin(radians)
      direction.z = df * Math.cos(radians)

      velocity.y -= -df * dt * direction.y * 800.0 * delta;
      velocity.z -= df * dt * direction.z * 800.0 * delta;
    }

    if ( moveLeft || moveRight ) {
      velocity.x -= direction.x * 1000.0 * delta;
    }

    if ( onObject === true ) {
      velocity.y = Math.max( 0, velocity.y );
      canJump = true;
    }

    controls.getObject().translateX( velocity.x * delta );
    controls.getObject().translateY( velocity.y * delta );
    controls.getObject().translateZ( velocity.z * delta );

    prevTime = time;
  }
  renderer.render( scene, camera );
}
