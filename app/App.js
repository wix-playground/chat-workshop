import React, {PureComponent} from 'react';
import {StyleSheet, KeyboardAvoidingView, Text, View, TextInput, TouchableOpacity, FlatList} from 'react-native';
import {chatClientFactory} from 'wix-chat-workshop-client';
import {Constants} from 'expo';

const chatClient = chatClientFactory(WebSocket)();
const MAIN_CHANNEL = 'main';

const USER_NAME = 'gytis';

class MessageInput extends PureComponent {
  render() {
    return (
      <View style={{
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#b2b2b2',
        flexDirection: 'row',
        backgroundColor: 'white'
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

export default class App extends PureComponent {
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
    await chatClient.connect('192.168.132.19', 8881, USER_NAME, '123');
    const channels = await chatClient.getChannels();
    this.setState({connected: true, channels});
    chatClient.onEvent('message', this.onMessageReceived);
    const messages = await chatClient.getMessages(MAIN_CHANNEL);
    this.setState({
      chatMessages: {[MAIN_CHANNEL]: messages},
    });
  }

  sendMessage = async () => {
    const msg = await chatClient.send(MAIN_CHANNEL, this.state.text.trim());
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
  };

  renderItem = ({item}) => {

    const myMessage = item.from === USER_NAME;

    return (
      <View
        style={{
          flex: 1,
          alignSelf: myMessage ? 'flex-end' : 'flex-start',
          backgroundColor: myMessage ? 'white' : '#C2185B',
          padding: 8,
          paddingHorizontal: 12,
          marginBottom: 18,
          marginHorizontal: 10,
          minWidth: 30,
          justifyContent: 'center',
          shadowRadius: 2,
          shadowOpacity: 1,
          shadowColor: '#b3b3b3',
          shadowOffset: {width: 3, height: 3},
        }}
      >
        <Text
          style={{
            color: myMessage ? 'black' : 'white'
          }}
        >{item.content}</Text>
      </View>
    );
  };

  keyExtractor = (item, index) => index.toString();

  render() {
    return (
      <View style={{flex: 1, backgroundColor: '#e9e9e9'}}>
        <View style={{
          backgroundColor: "#C2185B",
          height: Constants.statusBarHeight,
        }}/>
        <KeyboardAvoidingView testID="welcome" style={styles.container} behavior="padding">
          <FlatList
            ListHeaderComponent={this.renderHeader}
            data={this.state.chatMessages['main']}
            renderItem={this.renderItem}
            keyExtractor={this.keyExtractor}
            style={{width: '100%'}}
          />
          <MessageInput text={this.state.text} onPressSend={this.sendMessage} onChangeText={this.onChangeText}/>
        </KeyboardAvoidingView>
      </View>
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
  };

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
  },
});
