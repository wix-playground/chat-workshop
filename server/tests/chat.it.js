const chatServer = require('../src/chat-server');
const chatClient = require('../src/chat-client');
const {AuthError, PermissionError} = require('../src/errors');

describe('Chat Server', () => {
  let chat;
  let client;

  beforeEach(async () => {
    chat = chatServer()(3210);
    chat.addChannel('general');
    chat.addUser('zucceberg', 'hunter2');

    client = chatClient();
    await chat.start();
    await client.connect('127.0.0.1', chat.getPort(), 'zucceberg', 'hunter2');
  });

  afterEach(async () => {
    await chat.stop();
  });

  it('should return a list of channels on server', async () => {
    expect(await client.getChannels()).toEqual(['general']);
  });

  it('should create new channel by joining it', async () => {
    await client.join('react-native-workshop');
    expect(await client.getChannels()).toEqual(['general', 'react-native-workshop']);
  });

  it('should send message to channel', async () => {
    await client.send('general', 'hello yall!');
    const messages = await chat.getMessages('general')
    expect(messages).toEqual([
      {timestamp: expect.any(Number), content: 'hello yall!', id: expect.any(String)}
    ]);
  });

  it('should get messages from a channel', async () => {
    await client.send('general', 'hello yall!');
    expect(await client.getMessages('general')).toEqual([
      {timestamp: expect.any(Number), content: 'hello yall!', id: expect.any(String)}
    ]);
  });

  it('should get message with timestamp as a response of sending one', async () => {
    const message = await client.send('general', 'hello yall!');
    expect(message).toEqual(
      {timestamp: expect.any(Number), content: 'hello yall!', id: expect.any(String)}
    );
  });

  it('should not allow to connect with wrong password', async () => {
    const another = chatClient();
    const connection = another.connect('127.0.0.1', chat.getPort(), 'zucceberg', 'yo');
    await expect(connection).rejects.toEqual(expect.objectContaining(new AuthError()));
  });

  it('should not allow to join channel when unauthenticated', async () => {
    const another = await unauthenticatedClient();
    await expect(another.join('rnw')).rejects.toEqual(expect.objectContaining(new PermissionError()));
  });

  it('should not allow to send message when unauthenticated', async () => {
    const another = await unauthenticatedClient();
    await expect(another.send('general', 'hello')).rejects.toEqual(expect.objectContaining(new PermissionError()));
  });

  it('should not allow to get channel messages when unauthenticated', async () => {
    await client.send('general', 'yello!');
    const another = await unauthenticatedClient();
    await expect(another.getMessages('general')).rejects.toEqual(expect.objectContaining(new PermissionError()));
    expect(await client.getMessages('general')).toEqual([
      {timestamp: expect.any(Number), content: 'yello!', id: expect.any(String)}
    ]);
  });

  it('should broadcast messsage to another client in same chat', async () => {
    chat.addUser('eric', 'googel');
    chat.addUser('sergey', 'ilikelary');
    chat.addUser('lary', 'ilikeeric');
    const onEricEvent = jest.fn();
    const onLaryEvent = jest.fn();
    const onSergeyEvent = jest.fn();
    const eric = await authenticatedClient('eric', 'googel');
    const sergey = await authenticatedClient('sergey', 'ilikelary');
    const lary = await authenticatedClient('lary', 'ilikeeric');
    eric.onEvent('message', onEricEvent);
    lary.onEvent('message', onLaryEvent);
    sergey.onEvent('message', onSergeyEvent);
    await eric.join('rnw');
    await sergey.join('rnw');
    await lary.join('general');
    await eric.send('rnw', 'hi');
    expect(onEricEvent).not.toBeCalled();
    expect(onLaryEvent).not.toBeCalled();
    expect(onSergeyEvent).toBeCalledWith({
      to: 'rnw',
      from: 'eric',
      timestamp: expect.any(Number),
      content: 'hi',
      id: expect.any(String)
    });
  });

  async function authenticatedClient(name, password) {
    const client = chatClient();
    await client.connect('127.0.0.1', chat.getPort(), name, password);
    return client;
  }

  async function unauthenticatedClient() {
    const client = chatClient();
    try {
      await client.connect('127.0.0.1', chat.getPort(), 'zucceberg', 'yo');
    } catch (ex) {
    }
    return client;
  }
});

