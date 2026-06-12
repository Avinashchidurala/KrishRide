import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import images from '../../assets/images';

export interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  rightAction?: {
    label?: string;
    icon?: string;
    onPress: () => void;
  };
  backgroundColor?: string;
  textColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showLogo = true,
  showBack = false,
  rightAction,
  backgroundColor = '#FFFFFF',
  textColor = '#1A1A1A',
}) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.backIcon, { color: textColor }]}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          {showLogo ? (
            <Image
              source={images.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : title ? (
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSection}>
          {rightAction ? (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {rightAction.icon && (
                <MaterialIcons name={rightAction.icon as any} size={24} color={textColor === '#1A1A1A' ? '#FF6B35' : textColor} />
              )}
              {rightAction.label && (
                <Text style={[styles.actionText, { color: textColor }]}>
                  {rightAction.label}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 80,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 80,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  logo: {
    height: 32,
    width: 120,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    width: 1,
  },
});

