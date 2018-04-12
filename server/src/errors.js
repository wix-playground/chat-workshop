const ProtocolError = require('./error');

class AuthError extends ProtocolError {
  constructor() {
    super(101, 'Wrong credentials');
  }
}

class PermissionError extends ProtocolError {
  constructor() {
    super(102, 'Not authorized');
  }
}

module.exports = {
  AuthError,
  PermissionError,
};
