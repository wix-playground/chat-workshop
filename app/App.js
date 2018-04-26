import React, {PureComponent} from 'react';
import {
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList
} from 'react-native';
import {chatClientFactory} from 'wix-chat-workshop-client';
import {DangerZone, Constants} from 'expo';
const { Lottie } = DangerZone;


const chatClient = chatClientFactory(WebSocket)();
const MAIN_CHANNEL = 'main';

const USER_NAME = 'gytis';
const CURRENT_CHANNEL = 'main';

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
    );
  }
}

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      channels: [],
      chatMessages: {[MAIN_CHANNEL]: []},
      text: ''
    };
  }

  async componentDidMount() {
    await chatClient.connect('192.168.132.19', 8881, USER_NAME, '123');
    const channels = await chatClient.getChannels();
    this.setState({connected: true, channels});
    this.animation.reset();
    this.animation.play();
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

  renderItem = ({item, index}) => {
    const messages = this.state.chatMessages['main'];

    const myMessage = item.from === USER_NAME;

    const previousMessageSame = messages[index - 1] && messages[index - 1].from === item.from;

    const showAuthor = !myMessage && !previousMessageSame;

    const messageMargin = myMessage ? (previousMessageSame ? 10 : 18) : previousMessageSame ? 10 : 0;

    return (
      <View>
        {showAuthor &&
        <Text
          style={{
            marginTop: 18,
            marginHorizontal: 10,
            fontSize: 13,
            marginBottom: 3,
            color: '#333333'
          }}
        >{item.from}</Text>
        }
        <View
          style={{
            flex: 1,
            alignSelf: myMessage ? 'flex-end' : 'flex-start',
            backgroundColor: myMessage ? 'white' : '#7671bc',
            padding: 8,
            marginTop: messageMargin,
            paddingHorizontal: 12,
            marginHorizontal: 10,
            minWidth: 30,
            justifyContent: 'center',
            shadowRadius: 2,
            shadowOpacity: 1,
            shadowColor: '#b3b3b3',
            shadowOffset: {width: 3, height: 3},
            marginBottom: index === messages.length - 1 ? 15 : 0,
          }}
        >
          <Text
            style={{
              color: myMessage ? 'black' : 'white'
            }}
          >{item.content}</Text>
        </View>
      </View>
    );
  };

  keyExtractor = (item, index) => index.toString();

  scrollToBottomOnLayout = (event) => {
    if (
      this.messageListRef &&
      event.nativeEvent.layout.height &&
      this.state.chatMessages['main'] &&
      this.state.chatMessages['main'].length
    ) {
      this.messageListRef.scrollToEnd();
    }
  };

  scrollToBottomOnContentChange = (width, height) => {
    if (this.messageListRef && height) {
      this.messageListRef.scrollToEnd();
    }
  };

  render() {
    return (
      <View style={{flex: 1, backgroundColor: '#e9e9e9'}}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#C2185B"
        />
        {Platform.OS === 'ios' ? <View style={{
            backgroundColor: "#7671bc",
            height: Constants.statusBarHeight,
          }}/>
          : null}
        <View
          style={{
            backgroundColor: 'white',
            height: 60,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#b2b2b2'
          }}>
          {this.state.connected ? this.renderChannels() : this.renderOffline()}
        </View>
        <KeyboardAvoidingView
          testID="welcome"
          style={styles.container}
          behavior={(Platform.OS === 'ios') ? 'padding' : null}
        >
          <FlatList
            ref={(ref) => this.messageListRef = ref}
            onContentSizeChange={this.scrollToBottomOnContentChange}
            onLayout={this.scrollToBottomOnLayout}
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
      <View style={{flexDirection: 'row'}}>
        <View>
          <Text style={{
            marginLeft: 10,
            marginTop: 6,
            fontSize: 36,
            fontWeight: '200'
          }}>#{CURRENT_CHANNEL}</Text>
        </View>
        <View>
          <Lottie
            ref={animation => {
              this.animation = animation;
            }}
            style={{
              width: 60,
              height: 60,
            }}
            loop={false}
            source={require('./checked_done.json')}
          />
        </View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
