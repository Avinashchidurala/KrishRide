import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  margin = 'none',
  variant = 'default',
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`${padding}Padding`],
    styles[`${margin}Margin`],
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  // Variants
  default: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  // Padding
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },

  // Margin
  noneMargin: {},
  smallMargin: {
    margin: 8,
  },
  mediumMargin: {
    margin: 16,
  },
  largeMargin: {
    margin: 24,
  },
});
