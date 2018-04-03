const express = require('express');
const http = require('http');
const url = require('url');
const WebSocketServer = require('./websocket-server');

class Server {
  constructor(PORT = 8080) {
    this.port = PORT;
    this.server = null;
    this.app = null;
    this.wss = null;
  }

  start() {
    return new Promise((resolve) => {
      this.app = express();

      this.server = http.createServer(this.app);
      this.wss = WebSocketServer(this.server);

      this.server.listen(this.port, () => {
        console.log('Listening on %d', this.server.address().port);
        resolve()
      });
    }).catch(e => {
      console.log('start failed', e)
    });
  }

  stop() {
    this.server.close();
    this.server = null;
    this.app = null;
    this.wss.close();
    this.wss = null;
  }
}

module.exports = {
  create: (port) => new Server(port)
};
