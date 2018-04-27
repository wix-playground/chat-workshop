const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const MESSAGE_TYPES = require('./message-types');
const {defaultLogger} = require('./defaults');

const MESSAGE_LIMIT = 100;

class Server {
  constructor(port, logger) {
    this.port = port;
    this.wss = null;
    this.server = null;
    this.logger = logger;
    this.handlers = {};
  }

  start() {
    const startup = new Promise((resolve) => {
      const app = express()
        .use((req, res) => res.json({}));

      this.server = http
        .createServer(app)
        .listen(this.port, () => {
          this.logger.log(`Listening on ${ this.port }`);
          resolve();
        });

      this.wss = new WebSocket.Server({
        host: '0.0.0.0',
        server: this.server,
      });
      this.wss.on('connection', this.onConnection.bind(this));
      this.wss.on('error', this.onError.bind(this));
    });
    startup.catch(e => this.logger.log('start failed', e));
    return startup;
  }

  setHandlers(handlers = {}) {
    this.handlers = handlers;
  }

  onError(err) {
    this.logger.error('on-error', err);
  }

  onConnection(ws) {
    ws.on('message', (message) => this.onMessage(ws, message));
  }

  async onMessage(ws, message) {
    const [type, data, id] = JSON.parse(message);
    if (type in this.handlers) {
      try {
        const result = await this.handlers[type].apply(null, data.concat(ws));
        ws.send(response(id, result));
      } catch (ex) {
        ws.send(error(id, ex));
      }
    } else {
      this.logger.error(`no handler for "${type}" message!`);
    }
  }

  stop() {
    this.wss.close();
    this.server.close();
    this.wss = null;
  }
}

function response(id, result) {
  return JSON.stringify(['response', {id, result}]);
}

function error(id, ex) {
  return JSON.stringify(['response', {
    id,
    result: null,
    error: {message: ex.message, code: ex.code}
  }]);
}

module.exports =
  ({logger = defaultLogger} = {}) =>
  (port = 8080) => new Server(port, logger);
