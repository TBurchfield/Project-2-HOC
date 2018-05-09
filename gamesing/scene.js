import path from 'path';
import * as PHYSICS from './physics/physics-module.module.js'
import io from 'socket.io-client'
const socket = io('http://174.138.58.39:3000')

const info = {}
let gamestate = []
let players = {}
let terrain = {}

let sphere_color = 0xff0000

function throttled(delay, fn) {
  let lastCall = 0;
  return function (...args) {
    const now = (new Date).getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  }
}

const sphere = new WHS.Sphere({
  geometry: {
    radius: 1,
    widthSegments: 12,
    heightSegments: 12
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

console.log(terrain)

app.get('renderer').shadowMap.enabled = false
app.get('renderer').shadowMap.autoUpdate = false

// Start the app
app.start();

const update_handler = throttled(20, () => {
  socket.emit('client_update', {
      id: info.id, 
      color: info.color,
      pos: sphere.position, 
      terrain: {}
    }
  )
})

app.manager.modules.physics.addEventListener('update', update_handler)

if(!info.id){
  socket.emit('id_req')
}

//Socket bullshit
socket.on('greeting', (msg) => {
    console.log(msg)
})

socket.on('loadup', (data) => {
  Object.assign(terrain, data)
  let box
  for(let key of Object.keys(data)) {
    //key is uuidv4, data[key] to pos and color
    let block = data[key]
    if(!box){
      box = new WHS.Box({
        geometry: {
          width: block.size || 8,
          height: block.size || 8,
          depth: block.size || 8
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

        position: block.pos
      })
      box.addTo(app);
      terrain[box.native.uuid] = box
    }
    else {
      const box_copy = box.clone(true, true);
      box_copy.position = block.pos
      box_copy.addTo(app);
      terrain[box_copy.native.uuid] = box_copy
    }
  }
})

socket.on('id_res', (client_obj) => {
  // receive a client object
  Object.assign(info, client_obj)
  sphere.material = new THREE.MeshBasicMaterial({ color: client_obj.color })
})

socket.on('state', (data) => {
  Object.assign(gamestate, data)
})

// Manage other players here
const gamestate_loop = new WHS.Loop(() => {
  console.log(gamestate)
  for (let item of Object.values(gamestate)) {
    if(item.id === info.id || !item.id){
      continue
    }
    if (item.id in players) {
      players[item.id].position = item.pos
    }
    else {
      console.log(item)
      //player is new, create a WHS object for them
      const s = new WHS.Sphere({
        geometry: {
          radius: 1,
          widthSegments: 12,
          heightSegments: 12
        },

        modules: [
          new PHYSICS.SphereModule({
            mass: 1,
            restitution: 1
          })
        ],

        material: new THREE.MeshBasicMaterial({
          color: item.color
        }),

        position: new THREE.Vector3(0, 0, 0)
      })

      s.addTo(app)

      players[item.id] = s
    }
  }
})

gamestate_loop.start(app)

