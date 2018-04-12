const webSocketServer = require('./server');
const {AuthError, PermissionError} = require('./errors');

class ChatServer {
  constructor(port, timeService, idGenerator) {
    this.timeService = timeService;
    this.idGenerator = idGenerator;
    this.wss = webSocketServer.create(port);
    this.port = port;

    this.channels = {};
    this.users = {};

    this.wss.setHandlers({
      channels: this.getChannels.bind(this),
      join: this.authorized.bind(this)(this.joinChannel.bind(this)),
      message: this.authorized.bind(this)(this.addMessage.bind(this)),
      auth: this.authenticate.bind(this),
    });
  }

  getPort() {
    return this.port;
  }

  start() {
    return this.wss.start();
  }

  stop() {
    return this.wss.stop();
  }

  authorized(fn) {
    const users = this.users;
    return function (session) {
      const {name, sessionId} = session || {};
      const user = users[name];
      if (user && user.sessionId === sessionId) {
        return fn.apply(null, arguments);
      } else {
        throw new PermissionError();
      }
    };
  }

  joinChannel(session, name) {
    this.addChannel(name);
    this.channels[name].users.push(session.name);
  }

  addChannel(name) {
    if (!this.channels[name]) {
      this.channels[name] = {
        messages: [],
        users: [],
      };
    }
  }

  getChannels() {
    return Object.keys(this.channels);
  }

  addMessage(session, channel, message) {
    const chan = this.channels[channel];
    chan.messages.push({
      content: message,
      timestamp: this.timeService.now(),
    });
    return Promise.all([
      chan.users.map((name) => {
        if (name !== session.name) {
          const user = this.users[name];
          const data = JSON.stringify([
            'event', ['message', [{
              content: message,
              to: channel,
              from: session.name,
              timestamp: this.timeService.now(),
            }]],
          ]);
          return new Promise((resolve) => user.socket.send(data, {}, resolve));
        }
        return Promise.resolve();
      })
    ]);
  }

  getMessages(channel) {
    return this.channels[channel].messages;
  }

  addUser(name, password) {
    if (name in this.users) {
      throw new Error(`User "${name}" already exists`);
    }
    this.users[name] = {password};
  }

  getUsers() {
    return Object.keys(this.users);
  }

  authenticate(name, password, socket) {
    let user = this.users[name];
    if (user && user.password !== password) {
      throw new AuthError();
    }
    user = this.users[name] = {
      password: password,
      sessionId: this.idGenerator.nextId(),
      socket: socket,
    };
    return {
      sessionId: user.sessionId,
      name,
    };
  }
}

const defaults = {
  timeService: Date,
  idGenerator: {nextId: () => Math.random()},
};

module.exports =
  ({timeService, idGenerator} = defaults) =>
  (port = 8080) =>
  new ChatServer(port, timeService, idGenerator);
