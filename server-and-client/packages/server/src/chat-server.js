const uuid = require('uuid');
const webSocketServer = require('./server');
const {AuthError, PermissionError} = require('./errors');
const {defaultLogger, defaultIdGenerator, defaultTimeService} = require('./defaults');
const storageFactory = require('./storage');

class ChatServer {
  constructor(port, storage, timeService, idGenerator, logger) {
    this.port = port;
    this.idGenerator = idGenerator;
    this.logger = logger;
    this.storage = storage;

    this.wss = webSocketServer({logger})(port);
    this.sockets = {};

    this.authorized = this.authorized.bind(this);
    this.authenticate = this.authenticate.bind(this);

    this.wss.setHandlers({
      auth: this.authenticate,
      channels: () => this.storage.getChannels(),
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
    const logger = this.logger;
    return function (session) {
      const {name, sessionId} = session || {};
      const user = storage.getUser(name);
      if (user && user.sessionId === sessionId) {
        return fn.apply(null, arguments);
      } else {
        logger.log(`forbidden user "${name}"`);
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

    const primary = this.storage.getPrimaryChannel();
    if (primary) {
      this.joinChannel(name, primary);
    }

    this.logger.log('authenticated', name);
    return session;
  }

  joinChannel(userName, channelName) {
    this.addChannel(channelName);
    const users = this.storage.getChannelUsers(channelName);
    if (!users.includes(userName)) {
      this.storage.addChannelUser(channelName, userName);
    }
  }

  setPrimaryChannel(name) {
    this.storage.setPrimaryChannel(name);
    this.addChannel(name);
  }

  addChannel(name) {
    if (!this.storage.hasChannel(name)) {
      this.logger.log(`new channel: ${name}`);
      this.storage.addChannel(name);
    }
  }

  getChannelUsers(name) {
    return this.storage.getChannelUsers(name);
  }

  addMessage(userName, channelName, content) {
    const from = userName;
    const message = this.storage.addChannelMessage(channelName, from, content);
    const others = this.storage.getChannelUsers(channelName).filter((name) => name !== from);
    this.logger.log(`${userName} => ${channelName}: ${content}`);
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
}

module.exports =
  ({
    timeService = defaultTimeService,
    idGenerator = defaultIdGenerator,
    logger = defaultLogger,
    storage = storageFactory({defaultTimeService, defaultIdGenerator})()
  } = {}) =>
  (port = 8080) =>
  new ChatServer(port, storage, timeService, idGenerator, logger);
