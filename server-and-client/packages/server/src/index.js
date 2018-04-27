const logger = require('./logger');
const chatServerFactory = require('./chat-server');
const port = process.env.PORT || 8881;

const wixChat = chatServerFactory({logger})(port);
wixChat.setPrimaryChannel('main');

module.exports = wixChat;
