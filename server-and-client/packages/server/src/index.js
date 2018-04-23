const chatServerFactory = require('./chat-server');

const wixChat = chatServerFactory()(8881);

wixChat.addChannel('main');

module.exports = wixChat;
