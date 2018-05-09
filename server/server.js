const uuidv4 = require('uuid/v4');

const server = require('http').createServer()
const io = require('socket.io')(server)

console.log("Server started at localhost:3000")

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

g_data = {}

io.on('connect', (socket) => {
  console.log("Client joined")

  //initial information to be sent to the client for them to prepare their game
  io.emit('greeting', 'Hello clients... Are you ready to play a game')
  socket.emit('loadup', terrain)

  socket.on('player_move', (data) => {
    g_data[data.id] = data
    socket.broadcast.emit('state', g_data);
  })

  socket.on('id_req', () => {
    const id = uuidv4()
    socket.id = id
    socket.emit('id_res', id)
  })

  socket.on('disconnect', () => {
    delete g_data[socket.id]
  })
}); 

require('draftlog').into(console)

const draft = console.draft(g_data)
setInterval( () => {
    draft(g_data || null)
}, 100)