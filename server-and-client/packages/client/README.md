## Chat workshop client

### Usage
```js
import {chatClientFactory} from 'wix-chat-workshop-client';
// WebSocket being either window.WebSocket or global.WebSocket
const chatClient = chatClientFactory(WebSocket)();
```

### API methods
#### connect(host, port, user_name, password): Promise  
`host` - String. host of chat server ""  
`port` - Number. port of chat server  
`user_name` - String. name/nickname of the user shown to others  
`password` - String. password for given user name


#### getMessages(channel): Promise<Message[]>  
`channel` - String. Channel name, `main` is default and is always available


#### getChannels(): Promise<String[]>
Returns array of channel names


#### send(channel, message_text): Promise<Message>  
Returns the same message with id and timestamp  
`channel` - String. Channel name, `main` is default and is always available  
`message_text` - String. Text of the message  


#### onEvent(type, callback): void  
`type` - String. Type of event, `message` type represents chat message  
`callback` - Func. Executed with `Message` as an argument  


### Interfaces
#### Message
`id`: String. uuid  
`content`: String. Text of the message  
`from`: String. User name  
`to`: String. Channel name  

