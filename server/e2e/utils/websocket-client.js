function getWebSocketClient(url) {
  const STATUS = {
    CONNECTED: 'connected',
  };

  const WebSocket = require('ws');

  return {
    STATUS,
    sendMessageAndReceiveMessage(message) {
      return new Promise((resolve, reject) => {
        const webSocketClient = new WebSocket(url);

        webSocketClient.on('open', function open() {
          webSocketClient.send(message);
        });

        webSocketClient.on('message', function message(receivedMessage) {
          resolve(receivedMessage);
        });
      });
    },
    connect() {
      return new Promise((resolve, reject) => {
        const webSocketClient = new WebSocket(url);

        webSocketClient.on('open', function open() {
          resolve(STATUS.CONNECTED);
        });
      });
    }
  };
}

module.exports = getWebSocketClient;
