import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'confirmed':
    case 'completed':
    case 'success':
      return {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
      };
    case 'pending':
    case 'processing':
      return {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
        textColor: '#E65100',
      };
    case 'cancelled':
    case 'failed':
    case 'error':
      return {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
        textColor: '#C62828',
      };
    case 'started':
    case 'in-progress':
      return {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
        textColor: '#0D47A1',
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        borderColor: '#9E9E9E',
        textColor: '#424242',
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'filled',
  size = 'medium',
  style,
  textStyle,
}) => {
  const config = getStatusConfig(status);

  const badgeStyles = [
    styles.base,
    styles[size],
    variant === 'outlined' ? styles.outlined : styles.filled,
    { borderColor: config.borderColor },
    variant === 'filled' && { backgroundColor: config.backgroundColor },
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    { color: config.textColor },
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filled: {},
  outlined: {
    backgroundColor: 'transparent',
  },

  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 20,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 24,
  },

  text: {
    fontWeight: '600',
    textAlign: 'center',
  },

  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
});
