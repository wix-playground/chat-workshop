const uuid = require('uuid');

function webSocketClientFactory(WebSocket) {
  return function webSocketClient(url) {
    const STATUS = {
      CONNECTED: 'connected',
    };

    let inFlight = {};
    let client;
    let listeners = {};

    function onMessage(event) {
      const [type, data] = JSON.parse(event.data);
      if (type === 'response') {
        const {id, result, error} = data;
        const {resolve, reject} = inFlight[id];
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
        delete inFlight[id];
      } else if (type === 'event') {
        const [eventType, args] = data;
        if (listeners[eventType]) {
          listeners[eventType].forEach((fn) => {
            fn.apply(null, args);
          });
        }
      }
    }

    return {
      STATUS,
      send(type) {
        const data = [].slice.call(arguments, 1);
        return new Promise((resolve, reject) => {
          const id = uuid.v4();
          inFlight[id] = {resolve, reject};
          client.send(JSON.stringify([type, data, id]));
        });
      },
      addEventListener(type, fn) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      connect() {
        return new Promise((resolve, reject) => {
          client = new WebSocket(url);
          client.addEventListener('open', () => resolve(STATUS.CONNECTED));
          client.addEventListener('message', onMessage);
        });
      }
    };
  };
};

module.exports = webSocketClientFactory;
