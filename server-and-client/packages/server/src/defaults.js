const uuid = require('uuid');

const defaultIdGenerator = {
  nextId: () => uuid.v4(),
};

const defaultLogger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
};

const defaultTimeService = {
  now: () => Date.now(),
};

module.exports = {
  defaultLogger,
  defaultIdGenerator,
  defaultTimeService,
};
