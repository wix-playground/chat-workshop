const chatServer = require('./chat-server');

describe('Chat Server', () => {
  describe('addMessage()', () => {
    it('should add message with timestamp and id', () => {
      const timestamp = Math.random();
      const id = Math.random();
      const server = driver()
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
      const server = driver().withChannel('a').get();
      server.addChannel('a');
      expect(server.getChannels()).toEqual(['a']);
    });

    it('should not replace existing channel', () => {
      const server = driver()
        .withChannel('a', ['hi'])
        .get();

      server.addChannel('a');
      expect(server.getMessages('a')).toEqual([
        expect.objectContaining({content: 'hi'})
      ]);
    });
  });

  describe('addUser()', () => {
    it('should create new user', () => {
      const server = driver().get();
      server.addUser('a');
      expect(server.getUsers()).toEqual(['a']);
    });

    it('should add more than one user', () => {
      const server = driver().get();
      server.addUser('a');
      server.addUser('b');
      server.addUser('c');
      expect(server.getUsers()).toEqual(['a', 'b', 'c']);
    });

    it('should not allow to add existing user', () => {
      const server = driver().get();
      server.addUser('a');
      expect(() => server.addUser('a')).toThrow();
      expect(server.getUsers()).toEqual(['a']);
    });
  });

  describe('joinChannel()', () => {
    it('should create channel if it does not exist', () => {
      const server = driver().get();
      server.joinChannel('u', 'a');
      expect(server.getChannels()).toEqual(['a']);
    });

    it('should not create channel twice', () => {
      const server = driver().get();
      server.joinChannel('u', 'a');
      server.joinChannel('u', 'a');
      expect(server.getChannels()).toEqual(['a']);
    });

    it('should not join same user twice', () => {
      const server = driver().get();
      server.joinChannel('u', 'a');
      server.joinChannel('u', 'a');
      expect(server.getChannelUsers('a')).toEqual(['u']);
    });
  });

  describe('Primary Channel', () => {
    it('should not exist by default', () => {
      const server = driver().get();
      expect(server.getPrimaryChannel()).toBeUndefined();
    });

    it('should create channel if it does not exist', () => {
      const server = driver().get();
      server.setPrimaryChannel('a');
      expect(server.getChannels()).toEqual(['a']);
    });

    it('should know which channel is primary', () => {
      const server = driver().get();
      server.setPrimaryChannel('a');
      expect(server.getPrimaryChannel()).toEqual('a');
    });
  });

  describe('authenticate()', () => {
    it('should create new user', async () => {
      const server = driver().get();
      server.authenticate('a', 'hunter2');
      expect(server.getUsers()).toEqual(['a']);
    });

    it('should return session data for correct name/password pair', () => {
      let sessionId = Math.random();
      const server = driver()
        .withIdGenerator({nextId: () => sessionId})
        .withUser('a', 'hunter2')
        .get();
      expect(server.authenticate('a', 'hunter2')).toEqual({sessionId, name: 'a'});
    });

    it('should fail when password is wrong', () => {
      let sessionId = Math.random();
      const server = driver()
        .withIdGenerator({nextId: () => sessionId})
        .withUser('a', 'hunter2')
        .get();
      expect(() => server.authenticate('a', 'hunter1')).toThrow();
    });

    it('should automatically join primary channel', () => {
      const server = driver().get();
      server.setPrimaryChannel('main');
      server.authenticate('pete', 'hunter2');
      expect(server.getChannelUsers('main')).toEqual(['pete']);
    });
  });
});

function randomInt() {
  return Math.random() * Math.MAX_INT;
}

function driver() {
  let timeService = {now: () => 1};
  let idGenerator = {nextId: () => 1};
  let channels = {};
  let users = {};

  return {
    withIdGenerator(value){
      idGenerator = value;
      return this;
    },
    withTimeService(value) {
      timeService = value;
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
      const server = chatServer({timeService, idGenerator})();
      Object.keys(channels).forEach((name) => {
        server.addChannel(name);
        channels[name].forEach((message) => server.addMessage(undefined, name, message));
      });
      Object.keys(users).forEach((name) => {
        server.addUser(name, users[name]);
      });
      return server;
    },
  };
}
