const WebSocket = require('ws');
const uuidV4 = require('uuid/v4');

let port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

let clients =  [];

console.log('started on port ' + port);
wss.on('connection', function connection(ws) {
  console.log('connection');
  let id = uuidV4();
  clients[id] = ws;
  Object.keys(clients).forEach(clientId => {
    let client = clients[clientId];
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(id + ' ' + JSON.stringify({
        type: 'id'
      }));
      ws.send(clientId + ' ' + JSON.stringify({
        type: 'id'
      }));
    }
  });

  ws.on('message', function incoming(data) {
    // Broadcast to everyone else.
    // console.log('message: ', data);
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // console.log('send: ', data);
        client.send(id + ' ' + data);
      }
    });
  });

  ws.on('close', function() {
    console.log('close: ' + id);
    delete clients[id];
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(id + ' ' + JSON.stringify({
          type: 'left'
        }));
      }
    });
  });
});
