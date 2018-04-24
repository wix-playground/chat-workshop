import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList } from 'react-native';
import {chatClientFactory} from 'wix-chat-workshop-client';

const chatClient = chatClientFactory(WebSocket)();
const MAIN_CHANNEL = 'main'

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      channels: [],
      chatMessages: {},
    };
  }

  async componentDidMount() {
    await chatClient.connect('192.168.132.40', 8881, 'donatasp', '123');
    const channels = await chatClient.getChannels();
    this.setState({connected: true, channels});
    chatClient.onEvent('message', this.appendMessage);
    const messages = await chatClient.getMessages(MAIN_CHANNEL);
    this.setState({
      chatMessages: {[MAIN_CHANNEL]: messages},
    });
  }

  sendMessage = async () => {
    const msg = await chatClient.send(MAIN_CHANNEL, this.text);
    this.appendMessage(MAIN_CHANNEL, msg);
    this.text = '';
  }

  changeText = (text) => {
    this.text = text;
  }

  renderHeader = () => {
    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          {this.state.connected ? this.renderChannels() : this.renderOffline()}
        </View>
        <View style={{flex: 1}}>
          <TextInput style={{borderWidth: 1, borderColor: 'black', width: 200}} onChangeText={this.changeText}/>
          <TouchableOpacity onPress={this.sendMessage}>
            <Text>Send message</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  renderItem = ({item}) => {
    return <View><Text>{item.content}</Text></View>;
  }

  keyExtractor = (item, index) => index.toString()

  render() {
    return (
      <View style={styles.container}>
        <FlatList
          ListHeaderComponent={this.renderHeader}
          data={this.state.chatMessages['main']}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }

  appendMessage = (channel, message) => {
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
        { channels.length ?
          channels.map((channel, i) => <View key={i}><Text>Available channels:</Text><Text>#{channel}</Text></View>) :
          (<Text>No channels yet.</Text>)
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
