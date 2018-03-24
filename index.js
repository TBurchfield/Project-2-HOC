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
/* distance formula */
var dist = function(x1, x2) {
  let total = 0;
  for (let i in x1) {
    total += Math.sqrt(x1[i] - x2[i]);
  }
  return total;
}

/* generates node position, checks for overlap with existing nodes */
var generate_position = function(max) {
  let random_pos = [random(max), random(max), random(max)];
  let tested = false;

  while (!tested) {
    for (let node of graph) {
      let pos = [node.position.x, node.position.y, node.position.z];
      if (dist(random_pos, pos) < max/5) {
        random_pos = [random(max), random(max), random(max)];
        continue;
      }
    }
    tested = true;
  }
  return {x: random_pos[0], y: random_pos[1], z: random_pos[2]};
}

/* random integer generator */
var random = function(max=20) {
  return Math.ceil(Math.random() * max) - max/2;
};

var num_nodes = 100;
var max_distance = 40; // max dist from center that a node can be placed
for (inode = 0; inode < num_nodes; inode++) {
  graph.push({
    id: inode,
    position: generate_position(max_distance),
    owner: 0,
  });
}

io.on('connection', function (socket) {
  socket.on('connect-user', function () {
    console.log('got a connection');
    socket.emit('update-graph', graph);
  });

  socket.on('claim', function (id) {
    for (var i = 0; i < graph.length; i++) {
      if (graph[i].id == id) {
        graph[i].owner = 1 - graph[i].owner;
        break;
      }
    }
    socket.emit('update-graph', graph);
  });
});
