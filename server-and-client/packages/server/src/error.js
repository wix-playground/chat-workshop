class ProtocolError extends Error {
  constructor(code, message) {
    super(code + ': ' + message);
    this.code = code;
  }
}

module.exports = ProtocolError;
