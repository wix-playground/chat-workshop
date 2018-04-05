const serverFactory = require('../src/server');
const getWebSocketClient = require('./utils/websocket-client');
const MESSAGE_TYPES = require('../src/message-types')

let server;
let port;

describe('WebSocket Server', () => {
  beforeEach(async () => {
    port = 10000 + Math.round(Math.random() * 1000);
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should establish connection on particular port', async () => {
    await createServer();
    const client = createClient();
    expect(await client.connect()).toEqual(client.STATUS.CONNECTED);
  });

  it('should allow to specify message handlers', async () => {
    await createServer({
      sqrt: (n) => Math.sqrt(n),
      pow: (n, p) => Math.pow(n, p)
    });
    const client = createClient();
    await client.connect();
    expect(await client.send('sqrt', 9)).toEqual(3);
    expect(await client.send('pow', 3, 2)).toEqual(9);
  });

  it('should send responses to correct clients', async () => {
    const client1 = createClient();
    const client2 = createClient();

    await createServer({
      sqrt: (n) => new Promise((resolve) => {
        setTimeout(() => resolve(Math.sqrt(n)), 10);
      }),
      pow: (n, p) => new Promise((resolve) => {
        setTimeout(() => resolve(Math.pow(n, p)));
      })
    });

    await client1.connect();
    await client2.connect();

    const p1 = client1.send('sqrt', 9);
    const p2 = client2.send('pow', 3, 2);

    expect(await p1).toEqual(3);
    expect(await p2).toEqual(9);
  });

  it('should correctly interleave multiple messages', async () => {
    const client = createClient();

    await createServer({
      sqrt: (n) => new Promise((resolve) => {
        setTimeout(() => resolve(Math.sqrt(n)), 10);
      }),
      pow: (n, p) => new Promise((resolve) => {
        setTimeout(() => resolve(Math.pow(n, p)));
      })
    });

    await client.connect();

    const p1 = client.send('sqrt', 9);
    const p2 = client.send('pow', 3, 2);

    expect(await p1).toEqual(3);
    expect(await p2).toEqual(9);
  });

  describe('broadcast', () => {
    it('should broadcast chat messages to all other clients', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();

      await createServer();

      await client1.connect();
      await client2.connect();
      await client3.connect();
      const incomingMessageHandler1 = jest.fn();
      const incomingMessageHandler2 = jest.fn();
      const incomingMessageHandler3 = jest.fn();
      client1.onSend(MESSAGE_TYPES.INCOMING, incomingMessageHandler1)
      client2.onSend(MESSAGE_TYPES.INCOMING, incomingMessageHandler2)
      client3.onSend(MESSAGE_TYPES.INCOMING, incomingMessageHandler3)

      await client1.send(MESSAGE_TYPES.BROADCAST, {text: 'hello world'});
      // @TODO: investigate runAllTicks and other jest helpers
      await sleep(100);
      expect(incomingMessageHandler1).toHaveBeenCalledWith(MESSAGE_TYPES.INCOMING, {text: 'hello world'});
      expect(incomingMessageHandler2).toHaveBeenCalledWith(MESSAGE_TYPES.INCOMING, {text: 'hello world'});
      expect(incomingMessageHandler3).toHaveBeenCalledWith(MESSAGE_TYPES.INCOMING, {text: 'hello world'});
    });
  });
});

const sleep = (timeout) => new Promise((resolve) => {
  setTimeout(resolve, timeout)
})

async function createServer(handlers = {}) {
  server = serverFactory.create(port);
  server.setHandlers(handlers);
  await server.start();
  return server;
}

function createClient() {
  return getWebSocketClient(`ws://127.0.0.1:${port}`);
}
