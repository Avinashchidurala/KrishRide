import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Logo } from './Logo';

interface BrandedHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  rightAction?: {
    icon?: string;
    label?: string;
    onPress: () => void;
  };
  backgroundColor?: string;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  title,
  showBack = false,
  showLogo = true,
  rightAction,
  backgroundColor = '#FFFFFF',
}) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        )}
        {showLogo && !title && (
          <View style={styles.logoContainer}>
            <Logo width={120} height={40} />
          </View>
        )}
        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.rightButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {rightAction.icon && (
            <MaterialIcons name={rightAction.icon as any} size={24} color="#FF6B35" />
          )}
          {rightAction.label && (
            <Text style={styles.rightButtonText}>{rightAction.label}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  rightButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
});

