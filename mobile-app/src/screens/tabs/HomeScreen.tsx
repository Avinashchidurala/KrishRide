import React from 'react';
import { View, Text, StyleSheet,
  Platform} from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const HomeScreen: React.FC = () => {
  return (
    <ScreenLayout
      header={{
        title: 'Home',
        rightAction: {
          label: 'Search',
          onPress: () => console.log('Search pressed'),
        },
      }}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Home</Text>
          <Text style={styles.subtitle}>
            This is your home screen. Add your content here.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Text style={styles.cardText}>
              Add your quick action buttons or cards here.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.cardText}>
              Display recent items or activities here.
            </Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});

