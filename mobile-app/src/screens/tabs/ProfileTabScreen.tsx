import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const ProfileTabScreen: React.FC = () => {
  const menuItems = [
    { id: 1, label: 'Settings', icon: 'settings' },
    { id: 2, label: 'Help & Support', icon: 'help' },
    { id: 3, label: 'About', icon: 'info' },
    { id: 4, label: 'Logout', icon: 'logout', danger: true },
  ];

  return (
    <ScreenLayout
      header={{
        title: 'Profile',
        rightAction: {
          label: 'Edit',
          onPress: () => console.log('Edit pressed'),
        },
      }}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={40} color="#8E8E93" />
            </View>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
          </View>

          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.menuItem,
                  item.danger && styles.menuItemDanger,
                ]}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={item.danger ? '#FF3B30' : '#8E8E93'}
                  style={styles.menuItemIcon}
                />
                <Text
                  style={[
                    styles.menuItemLabel,
                    item.danger && styles.menuItemLabelDanger,
                  ]}
                >
                  {item.label}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#8E8E93" />
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#8E8E93',
  },
  menuSection: {
    marginTop: 24,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItemDanger: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  menuItemLabelDanger: {
    color: '#FF3B30',
  },
});

