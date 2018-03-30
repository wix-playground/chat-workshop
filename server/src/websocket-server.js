const WebSocket = require('ws');

const WebSocketServer = (httpServer) => {
  const wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', function connection(ws, req) {
    ws.on('message', function incoming(message) {
      ws.send(message)
    });
  });

  return wss;
}

module.exports = WebSocketServer;
