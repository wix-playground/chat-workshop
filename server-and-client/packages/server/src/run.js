require('./index')
  .start()
  .then(() => {
    console.log('server started');
  })
  .catch(e => {
    console.log('failed', e);
  })
;
