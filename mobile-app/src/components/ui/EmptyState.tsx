import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'information-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
  iconSize = 64,
  iconColor = '#E0E0E0',
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={iconSize}
        color={iconColor}
      />

      <Text style={styles.title}>{title}</Text>

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="outline"
            size="medium"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 200,
  },
});
