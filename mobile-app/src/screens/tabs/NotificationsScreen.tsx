import React from 'react';
import { View, Text, StyleSheet,
  Platform} from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const NotificationsScreen: React.FC = () => {
  const notifications = [
    { id: 1, title: 'New message', time: '2m ago', read: false },
    { id: 2, title: 'Update available', time: '1h ago', read: false },
    { id: 3, title: 'Welcome!', time: '2d ago', read: true },
  ];

  return (
    <ScreenLayout
      header={{
        title: 'Notifications',
        rightAction: {
          label: 'Mark all',
          onPress: () => console.log('Mark all pressed'),
        },
      }}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No notifications</Text>
              <Text style={styles.emptyStateSubtext}>
                You're all caught up!
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationItem,
                  notification.read && styles.notificationItemRead,
                ]}
              >
                <View style={styles.notificationContent}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      notification.read && styles.notificationTitleRead,
                    ]}
                  >
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
            ))
          )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
  notificationItem: {
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
  notificationItemRead: {
    opacity: 0.6,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationTitleRead: {
    fontWeight: '400',
  },
  notificationTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 12,
  },
});

