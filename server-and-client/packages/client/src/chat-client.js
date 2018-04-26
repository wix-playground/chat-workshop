const webSocketClientFactory = require('./websocket-client');

function chatClientFactory(WebSocket) {
  const webSocketClient = webSocketClientFactory(WebSocket);

  return function chatClient() {
    let client;
    let session;
    let name;

    return {
      async connect(host, port, _name, password) {
        client = webSocketClient(`ws://${host}:${port}`);
        await client.connect();
        session = await client.send('auth', name = _name, password);
      },
      getName() {
        return name;
      },
      getChannels() {
        return client.send('channels');
      },
      getMessages(channel) {
        return client.send('messages', session, channel);
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
  };
}

module.exports = chatClientFactory;
