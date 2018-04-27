const {webSocketClientFactory} = require('wix-chat-workshop-client');
const WebSocket = require('isomorphic-ws');

const serverFactory = require('../src/server');
const ProtocolError = require('../src/error');
const MESSAGE_TYPES = require('../src/message-types');

const webSocketClient = webSocketClientFactory(WebSocket);

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

  it('should return rejected promise if handler throws', async () => {
    await createServer({
      oops: () => { throw new ProtocolError(-1, 'oops!'); }
    });
    const client = createClient();
    await client.connect();
    await expect(client.send('oops')).rejects.toEqual({
      code: -1,
      message: '-1: oops!',
    });
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
});

async function createServer(handlers = {}) {
  server = serverFactory()(port);
  server.setHandlers(handlers);
  await server.start();
  return server;
}

function createClient() {
  return webSocketClient(`ws://127.0.0.1:${port}`);
}
