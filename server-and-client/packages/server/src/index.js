const chatServerFactory = require('./chat-server');
const port = process.env.PORT || 8881

const wixChat = chatServerFactory()(port);

wixChat.setPrimaryChannel('main');

module.exports = wixChat;
