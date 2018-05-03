function makeLoggingFn(type, fn) {
  return function () {
    const args = slice.call(arguments, 0);
    console[fn || type].apply(
      console,
      ['[' + new Date().toISOString() + ']', '[' + type.toUpperCase() + ']'].concat(args)
    );
  };
}

const slice = [].slice;
const logger = {
  log: makeLoggingFn('info', 'log'),
  warn: makeLoggingFn('warn'),
  error: makeLoggingFn('error'),
  debug: makeLoggingFn('debug'),
};

module.exports = logger;
