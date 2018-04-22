function animate() {

  requestAnimationFrame( animate );

  if ( controlsEnabled === true ) {

      raycaster.ray.origin.copy( controls.getObject().position );
      raycaster.ray.origin.y -= 10;

      var intersections = raycaster.intersectObjects( objects );

      var onObject = intersections.length > 0;

      var time = performance.now();
      var delta = ( time - prevTime ) / 1000;

      direction = camera.getWorldDirection();
      angle = THREE.Math.radToDeg( Math.atan(direction.y) )
      angle = range_scale(angle, -45, 45, -90, 90)
      let da = angle - prevAngle;
      console.log(da)

      direction.x = 1

      direction.y = Math.sin(angle)
      direction.z = Math.cos(angle)

      console.log(direction)
      console.log(velocity)

      if(da == 0 && !(moveForward || moveBackward || moveLeft || moveRight) ){
        velocity.x *= 0.8;
        velocity.z *= 0.8;
        velocity.y *= 0.8;
      }
      else {

        if ( moveForward || moveBackward ) {
          let ds = moveForward ? 1 : -1

          velocity.y += ds * direction.y * 400.0 * delta;
          velocity.z += -ds * direction.z * 400.0 * delta;
        }

        if ( moveLeft || moveRight ) {
          let ds = moveLeft ? 1 : -1
          velocity.x += -ds * Math.abs(direction.x) * 400.0 * delta;
        }
      }

      if ( onObject === true ) {
          velocity.y = Math.max( 0, velocity.y );
          canJump = true;
      }

      controls.getObject().translateX( velocity.x * delta );
      controls.getObject().translateY( velocity.y * delta );
      controls.getObject().translateZ( velocity.z * delta );

      prevTime = time;
      prevAngle = angle;
  }
  renderer.render( scene, camera );
}
