// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;
var three = require('three');

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var graph = [];
graph.push({
  id: 0;
  location: [-4, 0, -4];
  owner: 0;
})
graph.push({
  id: 1;
  location: [0, 0, -4];
  owner: 0;
})
graph.push({
  id: 2;
  location: [4, 0, -4];
  owner: 0;
})

function updateGraph() {
  socket.broadcast.emit('update-graph', {
    graph: graph;
  });
}

io.on('connection', function (socket) {
  socket.on('connect', function () {
    updateGraph();
  });

  socket.on('claim', function (id) {
    for (var i = 0; i < graph.length; i++) {
      if (graph[i].id == id) {
        graph[i].owner = 1 - graph[i].owner;
        break;
      }
    }
    updateGraph();
  });
});
