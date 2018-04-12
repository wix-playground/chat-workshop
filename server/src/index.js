const server = require('./chat-server')();
const client = require('./chat-client');

module.exports = {
  server,
  client
}
