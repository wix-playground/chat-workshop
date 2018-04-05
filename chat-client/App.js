import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WS_URL } from './config'

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {message: 'before connection'}
  }

  componentDidMount() {
    const ws = new WebSocket(WS_URL);
    ws.addEventListener('open', () => console.log('connopen'))
    ws.addEventListener('message', (m) => this.setState({message: m.data}))
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
