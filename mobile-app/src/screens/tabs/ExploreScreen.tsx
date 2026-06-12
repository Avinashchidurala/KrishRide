import React from 'react';
import { View, Text, StyleSheet,
  Platform} from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const ExploreScreen: React.FC = () => {
  return (
    <ScreenLayout
      header={{
        title: 'Explore',
        rightAction: {
          label: 'Filter',
          onPress: () => console.log('Filter pressed'),
        },
      }}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>
            Discover new content and features.
          </Text>

          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View key={item} style={styles.gridItem}>
                <View style={styles.gridItemContent}>
                  <Text style={styles.gridItemText}>Item {item}</Text>
                </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  gridItemContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    aspectRatio: 1,
    justifyContent: 'center',
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
  gridItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});

