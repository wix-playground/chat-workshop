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
