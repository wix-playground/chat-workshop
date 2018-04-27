const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const MESSAGE_TYPES = require('./message-types');

const MESSAGE_LIMIT = 100;

class Server {
  constructor(PORT = 8080) {
    this.port = PORT;
    this.wss = null;
    this.server = null;
    this.handlers = {};
    this.chatMessages = [];
  }

  start() {
    return new Promise((resolve) => {
      const app = express()
        .use((req, res) => res.json({}));

      this.server = http
        .createServer(app)
        .listen(this.port, () => {
          console.log(`Listening on ${ this.port }`);
          resolve();
        });

      const options = {
        host: '0.0.0.0',
        server: this.server,
      };

      this.wss = new WebSocket.Server(options);

      this.wss.on('connection', this.onConnection.bind(this));
      this.wss.on('error', this.onError.bind(this));

      // this.handlers[MESSAGE_TYPES.BROADCAST] = this.onBroadcastChatMessage.bind(this);

    }).catch(e => {
      console.log('start failed', e);
    });
  }

  setHandlers(handlers = {}) {
    this.handlers = handlers;
  }

  onError(err) {
    console.error('on-error', err);
  }

  onConnection(ws) {
    ws.on('message', (message) => this.onMessage(ws, message));
  }

  async onMessage(ws, message) {
    const [type, data, id] = JSON.parse(message);
    if (type === MESSAGE_TYPES.REQUEST_MESSAGES) {
      await this.onRequestChatMessages(ws, id);
    }
    if (type in this.handlers) {
      try {
        const result = await this.handlers[type].apply(null, data.concat(ws));
        ws.send(response(id, result));
      } catch (ex) {
        ws.send(error(id, ex));
      }
    } else {
      console.error(`no handler for "${type}" message!`);
    }
  }

  onBroadcastChatMessage(chatMessage) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify([MESSAGE_TYPES.INCOMING, chatMessage]));
      }
    });
    this.fillChatMessageHistory(chatMessage);
  }

  onRequestChatMessages(ws, id) {
    ws.send(JSON.stringify({id, result: this.chatMessages}));
  }

  fillChatMessageHistory(chatMessage) {
    this.chatMessages.push(chatMessage);
    const length = this.chatMessages.length;
    if (length > MESSAGE_LIMIT) {
      this.chatMessages.splice(0, length - MESSAGE_LIMIT);
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

module.exports = {
  create: (port) => new Server(port)
};
