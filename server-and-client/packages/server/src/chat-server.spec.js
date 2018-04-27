const chatServer = require('./chat-server');
const storageDriver = require('./storage.driver');

describe('Chat Server', () => {
  describe('addMessage()', () => {
    it('should add message with timestamp and id', () => {
      const timestamp = Math.random();
      const id = Math.random();
      const server = serverDriver()
        .withTimeService({now: () => timestamp})
        .withIdGenerator({nextId: () => id})
        .withChannel('a')
        .get();

      server.addMessage('anon', 'a', 'hi');
      expect(server.getMessages('a')).toEqual([
        {from: 'anon', content: 'hi', timestamp, id}
      ]);
    });
  });

  describe('addChannel()', () => {
    it('should not duplicate channels', () => {
      const storage = storageDriver().get();
      const server = serverDriver().withStorage(storage).withChannel('a').get();
      server.addChannel('a');
      expect(storage.getChannels()).toEqual(['a']);
    });

    it('should not replace existing channel', () => {
      const server = serverDriver()
        .withChannel('a', ['hi'])
        .get();

      server.addChannel('a');
      expect(server.getMessages('a')).toEqual([
        expect.objectContaining({content: 'hi'})
      ]);
    });
  });

  describe('joinChannel()', () => {
    it('should create channel if it does not exist', () => {
      const storage = storageDriver().get();
      const server = serverDriver().withStorage(storage).get();
      server.joinChannel('u', 'a');
      expect(storage.getChannels()).toEqual(['a']);
    });

    it('should not create channel twice', () => {
      const storage = storageDriver().get();
      const server = serverDriver().withStorage(storage).get();
      server.joinChannel('u', 'a');
      server.joinChannel('u', 'a');
      expect(storage.getChannels()).toEqual(['a']);
    });

    it('should not join same user twice', () => {
      const server = serverDriver().get();
      server.joinChannel('u', 'a');
      server.joinChannel('u', 'a');
      expect(server.getChannelUsers('a')).toEqual(['u']);
    });
  });

  describe('Primary Channel', () => {
    it('should not set by default', () => {
      const storage = storageDriver().get();
      const server = serverDriver().withStorage(storage).get();
      expect(storage.getPrimaryChannel()).toBeUndefined();
    });

    it('should create channel if it does not exist', () => {
      const storage = storageDriver().get();
      const server = serverDriver().withStorage(storage).get();
      server.setPrimaryChannel('a');
      expect(storage.getChannels()).toEqual(['a']);
    });
  });

  describe('authenticate()', () => {
    it('should create new user', async () => {
      const storage = storageDriver().get();
      const server = serverDriver().withStorage(storage).get();
      server.authenticate('a', 'hunter2');
      expect(storage.getUsers()).toEqual(['a']);
    });

    it('should return session data for correct name/password pair', () => {
      let sessionId = Math.random();
      const server = serverDriver()
        .withIdGenerator({nextId: () => sessionId})
        .withUser('a', 'hunter2')
        .get();
      expect(server.authenticate('a', 'hunter2')).toEqual({sessionId, name: 'a'});
    });

    it('should fail when password is wrong', () => {
      let sessionId = Math.random();
      const server = serverDriver()
        .withIdGenerator({nextId: () => sessionId})
        .withUser('a', 'hunter2')
        .get();
      expect(() => server.authenticate('a', 'hunter1')).toThrow();
    });

    it('should automatically join primary channel', () => {
      const server = serverDriver().get();
      server.setPrimaryChannel('main');
      server.authenticate('pete', 'hunter2');
      expect(server.getChannelUsers('main')).toEqual(['pete']);
    });
  });
});

function randomInt() {
  return Math.random() * Math.MAX_INT;
}

function serverDriver() {
  let timeService = {now: () => 1};
  let idGenerator = {nextId: () => 1};
  let storage = undefined;
  let channels = {};
  let users = {};

  return {
    withIdGenerator(value) {
      idGenerator = value;
      return this;
    },
    withTimeService(value) {
      timeService = value;
      return this;
    },
    withStorage(value) {
      storage = value;
      return this;
    },
    withChannel(name, messages = []) {
      channels[name] = messages;
      return this;
    },
    withUser(name, password) {
      users[name] = password;
      return this;
    },
    get() {
      const deps = {
        timeService,
        idGenerator,
        storage: storage = storage || storageDriver()
          .withIdGenerator(idGenerator)
          .withTimeService(timeService)
          .get()
      };
      const server = chatServer(deps)();
      Object.keys(channels).forEach((name) => {
        server.addChannel(name);
        channels[name].forEach((message) => server.addMessage(undefined, name, message));
      });
      Object.keys(users).forEach((name) => {
        storage.addUser(name, users[name]);
      });
      return server;
    },
  };
}
