import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {chatClientFactory} from 'wix-chat-workshop-client';

const chatClient = chatClientFactory(WebSocket)();

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      channels: [],
    };
  }

  componentDidMount() {
    chatClient
      .connect('192.168.132.19', 8881, 'donatasp', '123')
      .then(() => chatClient.getChannels())
      .then((channels) => this.setState({connected: true, channels}));
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.connected ? this.renderChannels() : this.renderOffline()}
      </View>
    );
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
