const webSocketClient = require('./client');

function chatClient() {
  let client;
  let session;

  return {
    async connect(host, port, name, password) {
      client = webSocketClient(`ws://${host}:${port}`);
      await client.connect();
      session = await client.send('auth', name, password);
    },
    getChannels() {
      return client.send('channels');
    },
    getMessages(channel) {
      return client.send('messages', session, channel)
    },
    join(name) {
      return client.send('join', session, name);
    },
    send(channel, message) {
      return client.send('message', session, channel, message);
    },
    onEvent(type, fn) {
      client.addEventListener(type, fn);
    }
  };
}

module.exports = chatClient;
