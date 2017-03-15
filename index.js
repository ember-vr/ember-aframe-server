const WebSocket = require('ws');
const uuidV4 = require('uuid/v4');

let port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

let clients = {};

function applyId(id, data) {
  let json = JSON.parse(data);
  json.id = id;
  data = JSON.stringify(json);
  return data;
}

// setInterval(() => {

// }, 10000);

console.log('started on port ' + port);
wss.on('connection', function connection(ws) {
  console.log('connection');
  let id = uuidV4();
  clients[id] = {
    ws
  };
  // let dataForOthers = JSON.stringify({
  //   type: 'id',
  //   id
  // });
  // Object.keys(clients).forEach(clientId => {
  //   let client = clients[clientId].ws;
  //   if (client !== ws && client.readyState === WebSocket.OPEN) {
  //     client.send(dataForOthers);
  //     ws.send(JSON.stringify({
  //       type: 'id',
  //       id: clientId
  //     }));
  //   }
  // });

  ws.on('message', function incoming(data) {
    // Broadcast to everyone else.
    // console.log('message: ', data);
    let json = JSON.parse(data);
    json.id = id;
    if (json.type === 'route') {
      let previousRoute = clients[id].route;
      clients[id].route = json.data;
      Object.keys(clients).forEach(clientId => {
        let client = clients[clientId];
        if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
          data = JSON.stringify(json);
          // console.log('send: ', data);
          let hasRouteChangedSinceLastTime = previousRoute !== json.data;
          let didTheyUsedToBeInThisRoute = client.route === previousRoute;
          if (didTheyUsedToBeInThisRoute && hasRouteChangedSinceLastTime) {
            // client.ws.send(data);
            client.ws.send(JSON.stringify({
              type: 'left',
              id
            }));
          }
          let areTheyInTheSameRouteAsMe = client.route === json.data;
          if (areTheyInTheSameRouteAsMe && hasRouteChangedSinceLastTime) {
            // console.log('me: ' + id + ' with route ' + json.data);
            // console.log('other: ' + clientId + ' with route ' + client.route);
            ws.send(JSON.stringify({
              type: 'join',
              id: clientId,
              data: client.route
            }));
            client.ws.send(JSON.stringify({
              type: 'join',
              id,
              data: client.route
            }));
          }
        }
      });
    } else {
      Object.keys(clients).forEach(clientId => {
        let client = clients[clientId];
        if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
          if (client.route === clients[id].route) {
            data = JSON.stringify(json);
            // console.log('send: ', data);
            client.ws.send(data);
          }
        }
      });
    }
  });

  ws.on('close', function() {
    console.log('close: ' + id);
    let route = clients[id].route;
    delete clients[id];
    Object.keys(clients).forEach(clientId => {
      let client = clients[clientId];
      if (client.readyState === WebSocket.OPEN) {
        if (client.route === route) {
          client.send(JSON.stringify({
            type: 'left',
            id
          }));
        }
      }
    });
  });
});
