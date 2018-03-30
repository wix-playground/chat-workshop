const server = require('./server');

const serverInstance = server.create(8881);

serverInstance
  .start()
  .then(() => {
    console.log('server started');
  })
  .catch(e => {
    console.log('failed', e);
  })
;
