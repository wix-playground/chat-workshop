const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const MESSAGE_TYPES = require('./message-types');

class Server {
  constructor(PORT = 8080) {
    this.port = PORT;
    this.wss = null;
    this.handlers = {};
  }

  start() {
    return new Promise((resolve) => {
      const options = {
        port: this.port,
        host: '0.0.0.0'
      };
      this.wss = new WebSocket.Server(options, () => {
        console.log('Listening on %d', this.port);
        resolve();
      });

      this.wss.on('connection', this.onConnection.bind(this));
      this.wss.on('error', this.onError.bind(this));

      this.handlers[MESSAGE_TYPES.BROADCAST] = this.onBroadcastChatMessage.bind(this);

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
    ws.send('connection opened');
    ws.on('message', (message) => this.onMessage(ws, message));
  }

  async onMessage(ws, message) {
    const [type, data, id] = JSON.parse(message);
    if (type in this.handlers) {
      const result = await this.handlers[type].apply(null, data);
      ws.send(JSON.stringify({id, result}));
    }
  }

  onBroadcastChatMessage(chatMessage) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify([MESSAGE_TYPES.INCOMING, chatMessage]));
      }
    });
  }

  stop() {
    this.wss.close();
    this.wss = null;
  }
}

module.exports = {
  create: (port) => new Server(port)
};
