import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'outlined',
  size = 'medium',
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const containerStyles = [
    styles.container,
    styles[variant],
    styles[size],
    error && styles.error,
    isFocused && styles.focused,
    containerStyle,
  ];

  const inputStyles = [
    styles.input,
    styles[`${variant}Input`],
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    inputStyle,
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}

      <View style={containerStyles}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={inputStyles}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#9CA3AF"
          {...props}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },

  // Variants
  outlined: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filled: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  underlined: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    minHeight: 40,
  },
  medium: {
    minHeight: 48,
  },
  large: {
    minHeight: 56,
  },

  // States
  focused: {
    borderColor: '#FF6B35',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  error: {
    borderColor: '#EF4444',
  },

  // Input
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  outlinedInput: {},
  filledInput: {},
  underlinedInput: {
    borderBottomWidth: 0,
  },

  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },

  // Icons
  leftIcon: {
    marginLeft: 12,
  },
  rightIcon: {
    marginRight: 12,
  },

  // Labels and text
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
