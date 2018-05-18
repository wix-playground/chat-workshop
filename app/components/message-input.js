import React, {PureComponent} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';

class MessageInput extends PureComponent {
  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.inputBox}
          multiline
          underlineColorAndroid="transparent"
          placeholder="Type a message..."
          value={this.props.text}
          onChangeText={this.props.onChangeText}
        />
        {this.props.text.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.button}
            onPress={this.props.onPressSend}
          >
            <Text style={styles.buttonLabel}>Send</Text>
          </TouchableOpacity>) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#b2b2b2',
    flexDirection: 'row',
    backgroundColor: 'white'
  },
  inputBox: {
    flex: 1,
    backgroundColor: 'white',
    fontSize: 17,
    marginLeft: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  button: {
    justifyContent: 'flex-start',
  },
  buttonLabel: {
    color: '#0084ff',
    fontWeight: '600',
    fontSize: 17,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
  }
});

export default MessageInput;
