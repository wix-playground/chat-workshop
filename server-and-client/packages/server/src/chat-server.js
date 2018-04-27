const webSocketServer = require('./server');
const {AuthError, PermissionError} = require('./errors');
const uuid = require('uuid');

class Storage {
  constructor(idGenerator, timeService) {
    this.idGenerator = idGenerator;
    this.timeService = timeService;
    this.channels = {};
    this.users = {};
    this.primaryChannel = undefined;
  }

  getUsers() {
    return this.users;
  }

  getUser(name) {
    return this.users[name];
  }

  addUser(name, password, sessionId) {
    return this.users[name] = {password, sessionId};
  }

  getChannels() {
    return this.channels;
  }

  getChannel(name) {
    return this.channels[name];
  }

  getChannelUsers(name) {
    return this.getChannel(name).users;
  }

  getChannelMessages(name) {
    return this.getChannel(name).messages;
  }

  addChannelUser(channelName, userName) {
    return this.getChannel(channelName).users.push(userName);
  }

  addChannel(name) {
    return this.channels[name] = {
      messages: [],
      users: [],
    };
  }

  addChannelMessage(channelName, userName, content) {
    const channel = this.getChannel(channelName);
    const message = {
      from: userName,
      id: this.idGenerator.nextId(),
      content: content,
      timestamp: this.timeService.now(),
    };
    channel.messages.push(message);
    return message;
  }

  setPrimaryChannel(name) {
    this.primaryChannel = name;
  }

  getPrimaryChannel() {
    return this.primaryChannel;
  }
}

class ChatServer {
  constructor(port, timeService, idGenerator) {
    this.port = port;
    this.idGenerator = idGenerator;

    this.wss = webSocketServer.create(port);
    this.storage = new Storage(idGenerator, timeService);
    this.sockets = {};

    this.authorized = this.authorized.bind(this);
    this.authenticate = this.authenticate.bind(this);

    this.wss.setHandlers({
      auth: this.authenticate,
      channels: this.getChannels.bind(this),
      join: this.authorized(
        (session, channelName) =>
          this.joinChannel(session.name, channelName)
      ),
      message: this.authorized(
        (session, channelName, content) =>
          this.addMessage(session.name, channelName, content)
      ),
      messages: this.authorized(
        (_, channelName) =>
          this.getMessages(channelName)
      ),
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
    const storage = this.storage;
    return function (session) {
      const {name, sessionId} = session || {};
      const user = storage.getUser(name);
      if (user && user.sessionId === sessionId) {
        return fn.apply(null, arguments);
      } else {
        throw new PermissionError();
      }
    };
  }

  authenticate(name, password, socket) {
    let user = this.storage.getUser(name);
    if (user && user.password !== password) {
      throw new AuthError();
    }

    const sessionId = this.idGenerator.nextId();
    this.storage.addUser(name, password, sessionId);
    this.sockets[name] = socket;

    const session = {sessionId, name};

    if (this.getPrimaryChannel()) {
      this.joinChannel(name, this.getPrimaryChannel());
    }

    return session;
  }

  joinChannel(userName, channelName) {
    this.addChannel(channelName);
    const users = this.storage.getChannelUsers(channelName);
    if (!users.includes(userName)) {
      this.storage.addChannelUser(channelName, userName);
    }
  }

  getPrimaryChannel() {
    return this.storage.getPrimaryChannel();
  }

  setPrimaryChannel(name) {
    this.storage.setPrimaryChannel(name);
    this.addChannel(name);
  }

  addChannel(name) {
    if (!this.storage.getChannel(name)) {
      this.storage.addChannel(name);
    }
  }

  getChannels() {
    return Object.keys(this.storage.getChannels());
  }

  getChannelUsers(name) {
    return this.storage.getChannelUsers(name);
  }

  addMessage(userName, channelName, content) {
    const from = userName;
    const message = this.storage.addChannelMessage(channelName, from, content);
    const others = this.storage.getChannelUsers(channelName).filter((name) => name !== from);
    const broadcast = others.map((name) => {
      const socket = this.sockets[name];
      const data = JSON.stringify([
        'event', ['message', [{
          ...message,
          to: channelName,
        }]],
      ]);
      return new Promise((resolve) => socket.send(data, {}, resolve));
    });
    return Promise.all(broadcast).then(() => message);
  }

  getMessages(channel) {
    return this.storage.getChannelMessages(channel);
  }

  addUser(name, password) {
    const user = this.storage.getUser(name);
    if (user) {
      throw new Error(`User "${name}" already exists`);
    }
    this.storage.addUser(name, password);
  }

  getUsers() {
    return Object.keys(this.storage.getUsers());
  }
}

const defaults = {
  timeService: Date,
  idGenerator: {nextId: () => uuid.v4()},
};

module.exports =
  ({timeService, idGenerator} = defaults) =>
  (port = 8080) =>
  new ChatServer(port, timeService, idGenerator);
