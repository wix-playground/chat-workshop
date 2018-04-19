import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WS_HOST, WS_PORT } from './config'
import getWebSocketClient from 'wix-chat-workshop-server/client';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {message: 'before connection'}
  }

  componentDidMount() {
    const ws = getWebSocketClient()
    ws.connect(WS_HOST, WS_PORT, 'martynas', 'whoa').then(() => this.setState({message: 'connected'}))
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Init screen of chat client app!</Text>
        <Text>ws status: {this.state.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
