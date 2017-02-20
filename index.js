const WebSocket = require('ws');
const uuidV4 = require('uuid/v4');

const wss = new WebSocket.Server({ port: 80 });

let clients =  [];

console.log('started');
wss.on('connection', function connection(ws) {
  console.log('connection');
  let id = uuidV4();
  // clients[ws] = id;
  // wss.clients.forEach(function each(client) {
  //   if (client !== ws && client.readyState === WebSocket.OPEN) {
  //     client.send(id + ' ' + JSON.stringify({
  //       type: 'id'
  //     }));
  //   }
  //   ws.send(id + ' ' + JSON.stringify({
  //     type: 'id'
  //   }));
  // });
  clients[id] = ws;
  Object.keys(clients).forEach(id => {
    let client = clients[id];
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(id + ' ' + JSON.stringify({
        type: 'id'
      }));
    }
    ws.send(id + ' ' + JSON.stringify({
      type: 'id'
    }));
  });

  ws.on('message', function incoming(data) {
    // Broadcast to everyone else.
    console.log('message: ', data);
    // wss.clients.forEach(function each(client) {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     console.log('send: ', data);
    //     client.send(clients[client] + ' ' + data);
    //   }
    // });
    Object.keys(clients).forEach(id => {
      let client = clients[id];
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log('send: ', data);
        client.send(id + ' ' + data);
      }
    });
  });

  ws.on('close', function() {
    console.log('close: ' + id);
    delete clients[id];
    Object.keys(clients).forEach(id => {
      let client = clients[id];
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(id + ' ' + JSON.stringify({
          type: 'left'
        }));
      }
    });
  });
});