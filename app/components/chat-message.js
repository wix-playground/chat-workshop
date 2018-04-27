import React, {PureComponent} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

class ChatMessage extends PureComponent {
  render() {
    const index = this.props.index;
    const item = this.props.message;
    const messages = this.props.allMessages;

    const myMessage = item.from === this.props.currentUser;

    const previousMessageSame = messages[index + 1] && messages[index + 1].from === item.from;

    const showAuthor = !myMessage && !previousMessageSame;

    const messageMargin = myMessage ? (previousMessageSame ? 10 : 18) : previousMessageSame ? 10 : 0;

    return (
      <Animatable.View animation="fadeIn" style={{
        flexDirection: 'row',
        justifyContent: myMessage ? 'flex-end' : 'flex-start',
        marginTop: showAuthor ? 18 : 0,
      }}>
        {showAuthor &&
        <View style={styles.authorContainer}>
          <Text style={styles.authorLabel}>{item.from[0].toUpperCase()}</Text>
        </View>
        }
        <View>
          {showAuthor &&
          <View>
            <Text style={styles.author}>
              {item.from}
            </Text>
          </View>
          }
          <View
            style={[styles.content, {
              backgroundColor: myMessage ? 'white' : '#7671bc',
              marginTop: messageMargin,
              marginHorizontal: myMessage || showAuthor ? 10 : 60,
              marginBottom: index === 0 ? 15 : 0,
            }]}
          >
            <Text
              style={{
                color: myMessage ? 'black' : 'white'
              }}
            >{item.content}</Text>
          </View>
        </View>
      </Animatable.View>
    );
  }
}

const styles = StyleSheet.create({
  authorContainer: {
    marginLeft: 10,
    marginTop: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7671bc',
  },
  authorLabel: {
    fontSize: 24,
    textAlign: 'center',
    color: 'white'
  },
  author: {
    marginHorizontal: 10,
    fontSize: 13,
    marginBottom: 3,
    color: '#333333',
  },
  content: {
    padding: 8,
    paddingHorizontal: 12,
    shadowRadius: 2,
    shadowOpacity: 1,
    shadowColor: '#b3b3b3',
    shadowOffset: {width: 3, height: 3},
    alignSelf: 'flex-start'
  },
})

export default ChatMessage;
