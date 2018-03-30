const serverFactory = require('../src/server');
const getWebSocketClient = require('./utils/websocket-client')

describe('chat server', () => {
  const serverPort = 8881;
  let server, webSocketClient;

  beforeEach(async () => {
    server = serverFactory.create(serverPort);
    await server.start();
    webSocketClient = getWebSocketClient(`ws://127.0.0.1:${serverPort}`);
  });

  afterEach(async () => {
    await server.stop();
  })

  it('should establish connection', async () => {
    const status = await webSocketClient.connect();
    expect(status).toEqual(webSocketClient.STATUS.CONNECTED)
  });

  it('should send and get messages', async () => {
    const receivedMessage = await webSocketClient.sendMessageAndReceiveMessage('hello');
    expect(receivedMessage).toEqual('hello');
  });

  // @TODO: broadcast message to multiple clients
});

