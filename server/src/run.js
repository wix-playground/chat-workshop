const chatServer = require('./chat-server');

const serverInstance = chatServer()(8881);

serverInstance
  .start()
  .then(() => {
    console.log('server started');
  })
  .catch(e => {
    console.log('failed', e);
  })
;
