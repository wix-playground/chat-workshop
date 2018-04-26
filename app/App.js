import React, {PureComponent} from 'react';
import {StyleSheet, KeyboardAvoidingView, Text, View, TextInput, TouchableOpacity, FlatList} from 'react-native';
import {chatClientFactory} from 'wix-chat-workshop-client';

const chatClient = chatClientFactory(WebSocket)();
const MAIN_CHANNEL = 'main';

class MessageInput extends PureComponent {
  render() {
    return (
      <View style={{
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#b2b2b2',
        flexDirection: 'row'
      }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: 'white',
            fontSize: 17,
            marginLeft: 10,
            marginTop: 6,
            marginBottom: 10,
          }}
          multiline
          underlineColorAndroid="transparent"
          placeholder="Type a message..."
          value={this.props.text}
          onChangeText={this.props.onChangeText}
        />
        {this.props.text.trim().length > 0 ? (
        <TouchableOpacity
          style={{
            justifyContent: 'flex-start',
          }}
          onPress={this.props.onPressSend}
        >
          <Text
            style={{
              color: '#0084ff',
              fontWeight: '600',
              fontSize: 17,
              marginTop: 10,
              marginLeft: 10,
              marginRight: 10,
            }}
          >Send</Text>
        </TouchableOpacity>) : null}
      </View>

    )
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      channels: [],
      chatMessages: {},
      text: ''
    };
  }

  async componentDidMount() {
    await chatClient.connect('192.168.132.19', 8881, 'gytis', '123');
    const channels = await chatClient.getChannels();
    this.setState({connected: true, channels});
    chatClient.onEvent('message', this.onMessageReceived);
    const messages = await chatClient.getMessages(MAIN_CHANNEL);
    this.setState({
      chatMessages: {[MAIN_CHANNEL]: messages},
    });
  }

  sendMessage = async () => {
    const msg = await chatClient.send(MAIN_CHANNEL, this.state.text);
    this.appendMessage(MAIN_CHANNEL, msg);
    this.setState({text: ''});
  };

  onChangeText = (text) => {
    this.setState({text});
  };

  renderHeader = () => {
    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          {this.state.connected ? this.renderChannels() : this.renderOffline()}
        </View>
        <View style={{flex: 1}}>
        </View>
      </View>
    )
  }

  renderItem = ({item}) => {
    return <View><Text>{item.content}</Text></View>;
  }

  keyExtractor = (item, index) => index.toString();

  render() {
    return (
      <KeyboardAvoidingView testID="welcome" style={styles.container} behavior="padding">
        <FlatList
          ListHeaderComponent={this.renderHeader}
          data={this.state.chatMessages['main']}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
        <MessageInput text={this.state.text} onPressSend={this.sendMessage} onChangeText={this.onChangeText}/>
      </KeyboardAvoidingView>
    );
  }

  onMessageReceived = (message) => {
    this.appendMessage(message.to, message);
  };

  appendMessage = (channel, message) => {
    console.log(channel, message);
    this.setState({
      chatMessages: {
        ...this.state.chatMessages,
        [channel]: [...this.state.chatMessages[channel], message]
      }
    });
  }

  renderOffline = () => {
    return (
      <Text>Offline</Text>
    );
  };

  renderChannels = () => {
    const {channels} = this.state;
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text>Connected!</Text>
        {channels.length ? channels.map((channel, i) => <View key={i}><Text>Available
          channels:</Text><Text>#{channel}</Text></View>) : (<Text>No channels yet.</Text>)
        }
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
