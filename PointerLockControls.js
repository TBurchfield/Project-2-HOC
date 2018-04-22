/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, scene ) {

    var scope = this;

    camera.rotation.set( 0, 0, 0 );

    var pitchObject = new THREE.Object3D();
    var geometry = new THREE.SphereGeometry( 2, 8, 6 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff1100} );
    var sphere = new THREE.Mesh( geometry, material );

    pitchObject.add(sphere)
    scene.add(pitchObject)
    pitchObject.add( camera );

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add( pitchObject );

    camera.position.set(0, 0, 30);

    var PI_2 = Math.PI / 2;

    var onMouseMove = function ( event ) {
        if ( scope.enabled === false ) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
    };

    this.dispose = function () {
        document.removeEventListener( 'mousemove', onMouseMove, false );
    };
    document.addEventListener( 'mousemove', onMouseMove, false );
    this.enabled = false;

    this.getObject = function () {
        return yawObject;
    };

    this.getDirection = function () {
        var direction = new THREE.Vector3( 0, 0, - 1 );
        var rotation = new THREE.Euler( 0, 0, 0, 'YXZ' );

        return function ( v ) {
            rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );
            v.copy( direction ).applyEuler( rotation );
            return v;
        };
    }();
};
