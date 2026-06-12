import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  message?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#FF6B35',
  message,
  style,
  textStyle,
  fullScreen = false,
}) => {
  const containerStyles = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ];

  return (
    <View style={containerStyles}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, textStyle]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
});
