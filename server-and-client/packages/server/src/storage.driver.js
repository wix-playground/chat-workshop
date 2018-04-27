const storageFactory = require('./storage');
const {defaultIdGenerator, defaultTimeService} = require('./defaults');

function storageDriver() {
  let idGenerator = defaultIdGenerator;
  let timeService = defaultTimeService;

  return {
    withIdGenerator(value) {
      idGenerator = value;
      return this;
    },
    withTimeService(value) {
      timeService = value;
      return this;
    },
    get() {
      return storageFactory({idGenerator, timeService})();
    }
  };
}

module.exports = storageDriver;
