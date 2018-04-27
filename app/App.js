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
  FlatList,
  Modal
} from 'react-native';
import {chatClientFactory} from 'wix-chat-workshop-client';
import {DangerZone, Constants} from 'expo';
import * as Animatable from 'react-native-animatable';
import MessageInput from './components/message-input';
import ChatMessage from './components/chat-message';
import {WS_HOST, WS_PORT} from './config'

const {Lottie} = DangerZone;


const chatClient = chatClientFactory(WebSocket)();

const USER_NAME = 'gytis';

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      channels: [],
      currentChannel: 'main',
      chatMessages: {main: []},
      text: '',
      newChannel: '',
      modalVisible: false,
    };
  }

  async componentDidMount() {
    await chatClient.connect(WS_HOST, WS_PORT, USER_NAME, '123');
    const channels = await chatClient.getChannels();
    this.setState({connected: true, channels});
    this.animation.reset();
    this.animation.play();
    chatClient.onEvent('message', this.onMessageReceived);
    const messages = await chatClient.getMessages(this.state.currentChannel);
    this.setState({
      chatMessages: {[this.state.currentChannel]: messages.reverse()},
    });
  }

  sendMessage = async () => {
    const msg = await chatClient.send(this.state.currentChannel, this.state.text.trim());
    this.appendMessage(this.state.currentChannel, msg);
    this.setState({text: ''});
  };

  onChangeText = (text) => {
    this.setState({text});
  };

  renderItem = ({item, index}) => {
    const messages = this.state.chatMessages[this.state.currentChannel];
    return (
      <ChatMessage
        allMessages={messages}
        message={item}
        currentUser={USER_NAME}
        index={index}
      />
    );
  };

  keyExtractor = (item, index) => item.id;

  scrollToBottomOnLayout = (event) => {
    if (
      this.messageListRef &&
      event.nativeEvent.layout.height &&
      this.state.chatMessages[this.state.currentChannel] &&
      this.state.chatMessages[this.state.currentChannel].length
    ) {
      this.messageListRef.scrollToOffset({offset: 0, animated: true});
    }
  };

  scrollToBottomOnContentChange = (width, height) => {
    if (this.messageListRef && height) {
      this.messageListRef.scrollToOffset({offset: 0, animated: true});
    }
  };

  onCreateNewChannel = async () => {
    const channel = this.state.newChannel;
    await chatClient.join(channel);

    this.setState({
      newChannel: '',
      modalVisible: false,
      currentChannel: channel
    });


    const channels = await chatClient.getChannels();
    this.setState({channels});
    const messages = await chatClient.getMessages(channel);
    this.setState({
      chatMessages: {[channel]: messages.reverse()},
    });
  };

  onChangeChannel = async (channel) => {
    if (channel === this.state.currentChannel) {
      this.setState({
        modalVisible: false,
      });
      return;
    }
    const messages = await chatClient.getMessages(channel);
    this.setState({
      chatMessages: {[channel]: messages.reverse()},
    });

    this.setState({
      modalVisible: false,
      currentChannel: channel
    });
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
            inverted
            ref={(ref) => this.messageListRef = ref}
            onContentSizeChange={this.scrollToBottomOnContentChange}
            onLayout={this.scrollToBottomOnLayout}
            data={this.state.chatMessages[this.state.currentChannel]}
            renderItem={this.renderItem}
            keyExtractor={this.keyExtractor}
          />
          <MessageInput text={this.state.text} onPressSend={this.sendMessage} onChangeText={this.onChangeText}/>
        </KeyboardAvoidingView>
        <Modal
          transparent={true}
          visible={this.state.modalVisible}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => this.setState({modalVisible: false})} style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'}}>
            <Animatable.View duration={500} animation="fadeIn" style={{width: '80%', backgroundColor: 'white'}}>
              {this.state.channels.map(channel => (
                <TouchableOpacity style={{marginHorizontal: 10, marginVertical: 5}} key={channel} onPress={() => this.onChangeChannel(channel)}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '300'
                }}>#{channel}</Text>
                </TouchableOpacity>
              ))}

              <TextInput style={{padding: 3, paddingLeft: 10, borderTopColor: '#b2b2b2', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, fontSize: 24}} value={this.state.newChannel} onChangeText={(newChannel) => this.setState({newChannel})} placeholder="Enter new channel name" onSubmitEditing={this.onCreateNewChannel}/>

            </Animatable.View>
          </TouchableOpacity>
        </Modal>
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
        [channel]: [message, ...this.state.chatMessages[channel]]
      }
    });
  };

  renderOffline = () => {
    return (
      <Text>Offline</Text>
    );
  };

  renderChannels = () => {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <TouchableOpacity onPress={() => {this.setState({modalVisible: true})}}>
          <Text style={{
            marginLeft: 10,
            marginTop: 6,
            fontSize: 36,
            fontWeight: '200'
          }}>#{this.state.currentChannel}</Text>
        </TouchableOpacity>
        <View>
          <Lottie
            ref={animation => {
              this.animation = animation;
            }}
            style={{
              marginTop: -4,
              width: 80,
              marginRight: -10,
              height: 80,
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
