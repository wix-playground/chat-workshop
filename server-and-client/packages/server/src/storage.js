const {defaultIdGenerator, defaultTimeService} = require('./defaults');

class Storage {
  constructor(idGenerator, timeService) {
    this.idGenerator = idGenerator;
    this.timeService = timeService;
    this.channels = {};
    this.users = {};
    this.primaryChannel = undefined;
  }

  getUsers() {
    return Object.keys(this.users);
  }

  getUser(name) {
    return this.users[name];
  }

  addUser(name, password, sessionId) {
    return this.users[name] = {password, sessionId};
  }

  getChannels() {
    return Object.keys(this.channels);
  }

  hasChannel(name) {
    return !!this.channels[name];
  }

  getChannelUsers(name) {
    return this.channels[name].users;
  }

  getChannelMessages(name) {
    return this.channels[name].messages;
  }

  addChannelUser(channelName, userName) {
    return this.channels[channelName].users.push(userName);
  }

  addChannel(name) {
    return this.channels[name] = {
      messages: [],
      users: [],
    };
  }

  removeChannel(name) {
    delete this.channels[name];
  }

  addChannelMessage(channelName, userName, content) {
    const channel = this.channels[channelName];
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
};

module.exports =
  ({idGenerator = defaultIdGenerator, timeService = defaultTimeService} = {}) =>
  () => new Storage(idGenerator, timeService);
