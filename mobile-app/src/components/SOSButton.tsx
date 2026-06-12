import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface SOSButtonProps {
  style?: any;
}

export default function SOSButton({ style }: SOSButtonProps) {
  const navigation = useNavigation();
  const [pressing, setPressing] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressing(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressing(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    Alert.alert(
      'Emergency / SOS',
      'Do you want to open the emergency assistance screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open SOS',
          style: 'destructive',
          onPress: () => navigation.navigate('SOS' as never),
        },
      ]
    );
  };

  return (
    <Animated.View style={[styles.container, style, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.button}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        delayLongPress={500}
      >
        <MaterialIcons name="emergency" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#F44336',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});

