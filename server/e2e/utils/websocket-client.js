const uuid = require('uuid');
const WebSocket = require('ws');

function getWebSocketClient(url) {
  const STATUS = {
    CONNECTED: 'connected',
  };

  let client;

  return {
    STATUS,
    send(type) {
      const data = [].slice.call(arguments, 1);
      return new Promise((resolve) => {
        const id = uuid.v4();
        client.on('message', (data) => {
          const msg = JSON.parse(data);
          if (msg.id === id) {
            resolve(msg.result);
          }
        });
        client.send(JSON.stringify([type, data, id]));
      });
    },
    onSend(type, handler) {
      client.on('message', (message) => {
        const data = JSON.parse(message);
        if (Array.isArray(data)) {
          const [type, payload] = data
          handler(type, payload);
        }
      });
    },
    connect() {
      return new Promise((resolve, reject) => {
        client = new WebSocket(url);
        client.on('open', function open() {
          resolve(STATUS.CONNECTED);
        });
      });
    }
  };
}

module.exports = getWebSocketClient;
