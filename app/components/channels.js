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
import {DangerZone} from 'expo';
const {Lottie} = DangerZone;

class Channels extends PureComponent {
  constructor(props) {
    super(props);
    this.animation = null
  }

  playAnimation = () => {
    this.animation.reset();
    this.animation.play();
  }

  render() {
    const {onShowChannels, currentChannel} = this.props;
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onShowChannels}>
          <Text style={styles.channelLabel}>#{currentChannel}</Text>
        </TouchableOpacity>
        <View>
          <Lottie
            ref={animation => {
              this.animation = animation;
            }}
            style={styles.animation}
            loop={false}
            source={require('../checked_done.json')}
          />
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  channelLabel: {
    marginLeft: 10,
    marginTop: 6,
    fontSize: 36,
    fontWeight: '200'
  },
  animation: {
    marginTop: -4,
    width: 80,
    marginRight: -10,
    height: 80,
  },
})

export default Channels;
