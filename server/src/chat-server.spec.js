const chatServer = require('./chat-server');

describe('Chat Server', () => {
  describe('addMessage()', () => {
    it('should add message with timestamp', () => {
      let timestamp = Math.random();
      const server = driver()
        .withTimeService({now: () => timestamp})
        .withChannel('a')
        .get();

      server.addMessage({}, 'a', 'hi');
      expect(server.getMessages('a')).toEqual([
        {content: 'hi', timestamp}
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
      let timestamp = Math.random();
      const server = driver()
        .withTimeService({now: () => timestamp})
        .withChannel('a', ['hi'])
        .get();

      server.addChannel('a');
      expect(server.getMessages('a')).toEqual([
        {content: 'hi', timestamp}
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

  describe('authenticate', () => {
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
  });
});

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
        channels[name].forEach((message) => server.addMessage({}, name, message));
      });
      Object.keys(users).forEach((name) => {
        server.addUser(name, users[name]);
      });
      return server;
    },
  };
}
