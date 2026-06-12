import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { driverApi } from '../../services/driverApi';

interface Ride {
  id: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  price_per_seat: number;
  available_seats: number;
  vehicle_type: string;
  status: 'active' | 'completed' | 'cancelled';
  bookings_count?: number;
  bookings?: any[];
}

export default function MyRidesScreen() {
  const navigation = useNavigation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getMyRides();
      setRides(response.rides || []);
    } catch (error: any) {
      console.error('Load rides error:', error);
      Alert.alert('Error', 'Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const handleDeleteRide = (rideId: string) => {
    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRide(rideId),
        },
      ]
    );
  };

  const deleteRide = async (rideId: string) => {
    try {
      await driverApi.deleteRide(rideId);
      setRides(prev => prev.filter(ride => ride.id !== rideId));
      Alert.alert('Success', 'Ride deleted successfully');
    } catch (error: any) {
      console.error('Delete ride error:', error);
      Alert.alert('Error', 'Failed to delete ride');
    }
  };

  const filteredRides = rides.filter(ride => {
    switch (filter) {
      case 'active':
        return ride.status === 'active';
      case 'completed':
        return ride.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#28A745';
      case 'completed':
        return '#007AFF';
      case 'cancelled':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const renderRideItem = ({ item }: { item: Ride }) => {
    const bookingCount = item.bookings_count ?? item.bookings?.length ?? 0;

    return (
      <View style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {item.start_location} → {item.end_location}
            </Text>
            <Text style={styles.dateText}>
              {new Date(item.scheduled_time).toLocaleDateString()} at{' '}
              {new Date(item.scheduled_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>₹{item.price_per_seat}</Text>
            <Text style={styles.priceLabel}>per seat</Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="car-seat" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.available_seats} seats available
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="people" size={16} color="#666" />
            <Text style={styles.detailText}>
              {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="car" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.vehicle_type?.charAt(0).toUpperCase() + item.vehicle_type?.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.rideFooter}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status?.toUpperCase()}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {item.status === 'active' && (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    // Navigate to edit ride screen
                    Alert.alert('Edit Ride', 'Edit functionality coming soon!');
                  }}
                >
                  <MaterialIcons name="edit" size={16} color="#FF6B35" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteRide(item.id)}
                >
                  <MaterialIcons name="delete" size={16} color="#DC3545" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Rides</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rides</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PublishRide' as never)}
        >
          <MaterialIcons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(tab.key as any)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rides List */}
      <FlatList
        data={filteredRides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="car-off" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>
              {filter === 'all'
                ? 'No rides published yet'
                : `No ${filter} rides found`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'Start by publishing your first ride!'
                : `You don't have any ${filter} rides.`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.publishButton}
                onPress={() => navigation.navigate('PublishRide' as never)}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.publishButtonText}>Publish a Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {rides.filter(r => r.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {rides.filter(r => r.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {rides.reduce((sum, r) => sum + r.bookings_count, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
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
      default: {},
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space for stats footer
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
      default: {},
    }),
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  rideDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  rideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
