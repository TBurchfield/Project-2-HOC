const uuidv4 = require('uuid/v4');

const server = require('http').createServer()
const io = require('socket.io')(server)

console.log("Server started at localhost:3000")

let colors = [0x009933, 0x009999, 0x33cc99, 0x663399, 0x993300, 0x9966cc, 0xcc0000, 0xcc6600, 0xccccff, 0xff99ff]
let used_colors = []

let players = {}
let terrain = {}

for (var i = 200; i > 0; i--) {
    terrain[uuidv4()] = {
        color: null,
        pos: {
            x: Math.floor( Math.random() * 20 - 10 ) * 20,
            y: Math.floor( Math.random() * 20 - 10 ) * 20,
            z: Math.floor( Math.random() * 20 - 10 ) * 20
        },
        size: 8
    }
}

server.listen(3000);

io.on('connect', (socket) => {
  console.log("Client joined")

  //initial information to be sent to the client for them to prepare their game
  io.emit('greeting', 'Hello clients... Are you ready to play a game')
  socket.emit('loadup', terrain)

  socket.on('client_update', (data) => {
    console.log(data)
    players[data.id] = data
    Object.assign(terrain, data.terrain);
    socket.broadcast.emit('state', players);
  })

  socket.on('id_req', () => {
    let unused_color = colors.filter(x => !used_colors.includes(x))
    const c = unused_color[Math.floor(Math.random()  * unused_color.length)]

    let client_obj = {
        id: uuidv4(),
        color: c
    }
    // Store info in socket, and refresh the player array
    socket.id = client_obj.id
    players[client_obj.id] = {}

    socket.emit('id_res', client_obj)
  })

  socket.on('disconnect', () => {
    delete players[socket.id]
  })
}); 

require('draftlog').into(console)

const draft = console.draft(players)
setInterval( () => {
    draft(players || null)
}, 100)