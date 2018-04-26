const chatServerFactory = require('./chat-server');

const wixChat = chatServerFactory()(8881);

wixChat.setPrimaryChannel('main');

module.exports = wixChat;
