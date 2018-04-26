const webSocketServer = require('./server');
const {AuthError, PermissionError} = require('./errors');
const uuid = require('uuid');

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
      messages: this.authorized.bind(this)(this.getUserMessages.bind(this)),
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
    const user = session.name;
    const chan = this.channels[name];
    if (!chan.users.includes(user)) {
      chan.users.push(user);
    }
  }

  getPrimaryChannel() {
    return this.primaryChannel;
  }

  setPrimaryChannel(name) {
    this.primaryChannel = name;
    this.addChannel(name);
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

  getChannelUsers(name) {
    return this.channels[name].users;
  }

  addMessage(session, channel, content) {
    const from = session.name;
    const chan = this.channels[channel];
    const message = {
      from,
      id: uuid.v4(),
      content: content,
      timestamp: this.timeService.now(),
    };
    chan.messages.push(message);

    const broadcast = chan.users.map((name) => {
      if (name !== from) {
        const user = this.users[name];
        const data = JSON.stringify([
          'event', ['message', [{
            ...message,
            to: channel,
            from,
          }]],
        ]);
        return new Promise((resolve) => user.socket.send(data, {}, resolve));
      }
      return null;
    });

    return Promise.all(broadcast).then(() => message);
  }

  getMessages(channel) {
    return this.channels[channel].messages;
  }

  getUserMessages(session, channel) {
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

    const session = {
      sessionId: user.sessionId,
      name,
    };
    if (this.getPrimaryChannel()) {
      this.joinChannel(session, this.getPrimaryChannel());
    }

    console.log('>>> authenticated', name);
    return session;
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
