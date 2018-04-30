import path from 'path';
import * as PHYSICS from './physics/physics-module.module.js'

const sphere = new WHS.Sphere({
  geometry: {
    radius: 1,
    widthSegments: 32,
    heightSegments: 32
  },

  modules: [
    new PHYSICS.SphereModule({
      mass: 1,
      restitution: 1
    })
  ],

  material: new THREE.MeshBasicMaterial({
    color: 0xF2F2F2
  }),

  position: new THREE.Vector3(0, 0, 0)
});

const app = new WHS.App([
  new WHS.ElementModule(document.getElementById('app')),
  new WHS.DefineModule('camera', new WHS.PerspectiveCamera({
    position: new THREE.Vector3(0, 0, 0),
    far: 300
  })),
  new WHS.SceneModule(),
  new WHS.RenderingModule({
    bgColor: 0x1f1f1f,

    renderer: {
      antialias: true
    }
  }, {shadow: false}),
  new PHYSICS.WorldModule({
    gravity: new THREE.Vector3(0, 0, 0),
    ammo: 'https://rawgit.com/WhitestormJS/physics-module-ammonext/master/vendor/ammo.js'
  }),
  new PHYSICS.ThirdPersonModule(sphere, {
    speed: 500,
    ypos: 0,
  }),
  new WHS.ResizeModule()
]);
sphere.addTo(app);

new WHS.AmbientLight({
  light: {
    intensity: 0.7
  }
}).addTo(app);

let box;
const size = 5;
for (let i = 0; i < 1; i++) {
  box = new WHS.Box({
    geometry: {
      width: size,
      height: size,
      depth: size
    },

    modules: [
      new PHYSICS.SphereModule({
        mass: 0,
        restitution: 1
      })
    ],

    material: new THREE.MeshNormalMaterial( { 
      flatShading: true, 
      vertexColors: THREE.FaceColors 
    } ),

    position: {
      x: Math.floor( Math.random() * 20 - 10 ) * 20,
      y: Math.floor( Math.random() * 20 - 10 ) * 20,
      z: Math.floor( Math.random() * 20 - 10 ) * 20
    }
  })
  box.addTo(app);
}

for (let i = 0; i < 199; i++) {
  const box_copy = box.clone(true, true);
  box_copy.position = {
    x: Math.floor( Math.random() * 20 - 10 ) * 20,
    y: Math.floor( Math.random() * 20 - 10 ) * 20,
    z: Math.floor( Math.random() * 20 - 10 ) * 20
  }
  // console.log(box.native.material)
  box_copy.addTo(app);
}
app.get('renderer').shadowMap.enabled = false
app.get('renderer').shadowMap.autoUpdate = false
console.log( app.get('renderer') )
// Start the app
app.start();