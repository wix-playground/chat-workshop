const {defaultIdGenerator, defaultTimeService} = require('./defaults');
const storageDriver = require('./storage.driver');

describe('Storage', () => {
  it('should not have primary channel by default', () => {
    expect(storageDriver().get().getPrimaryChannel()).toBeUndefined();
  });

  it('should allow to set primary channel', () => {
    const name = randomName();
    const storage = storageDriver().get();
    storage.setPrimaryChannel(name);
    expect(storage.getPrimaryChannel()).toEqual(name);
  });

  it('should have no channels by default', () => {
    expect(storageDriver().get().getChannels()).toEqual([]);
  });

  it('should add new channel', () => {
    const name = randomName();
    const storage = storageDriver().get();
    storage.addChannel(name);
    expect(storage.getChannels()).toEqual([name]);
  });

  it('should remove channel', () => {
    const name = randomName();
    const storage = storageDriver().get();
    storage.addChannel(name);
    storage.removeChannel(name);
    expect(storage.getChannels()).toEqual([]);
  });

  it('should know if channel exists', () => {
    const name = randomName();
    const storage = storageDriver().get();
    storage.addChannel(name);
    expect(storage.hasChannel(name)).toEqual(true);
    storage.removeChannel(name);
    expect(storage.hasChannel(name)).toEqual(false);
  });

  it('should have no user by default', () => {
    expect(storageDriver().get().getUsers()).toEqual([]);
  });

  it('should add user', () => {
    const name = randomName();
    const storage = storageDriver().get();
    storage.addUser(name);
    expect(storage.getUsers()).toEqual([name]);
  });

  it('should get back user password and session ID', () => {
    const name = randomName();
    const password = randomText();
    const sessionId = randomId();
    const storage = storageDriver().get();
    storage.addUser(name, password, sessionId);
    expect(storage.getUser(name)).toEqual({password, sessionId});
  });

  it('should create channel without users', () => {
    const name = randomName();
    const storage = storageDriver().get();
    storage.addChannel(name);
    expect(storage.getChannelUsers(name)).toEqual([]);
  });

  it('should add user to a channel', () => {
    const name = randomName();
    const user = randomName();
    const storage = storageDriver().get();
    storage.addChannel(name);
    storage.addChannelUser(name, user);
    expect(storage.getChannelUsers(name)).toEqual([user]);
  });

  it('should add message to channel', () => {
    const id = randomId();
    const time = randomInt();
    const name = randomName();
    const user = randomName();
    const content = randomText();
    const storage = storageDriver()
      .withIdGenerator({nextId: () => id})
      .withTimeService({now: () => time})
      .get();
    storage.addChannel(name);
    storage.addChannelMessage(name, user, content);
    expect(storage.getChannelMessages(name)).toEqual([{
      id, content, from: user, timestamp: time
    }]);
  });
});

function randomName() {
  return Math.random().toString();
}

function randomText() {
  return Math.random().toString();
}

function randomId() {
  return Math.random().toString();
}

function randomInt() {
  return Math.random();
}
