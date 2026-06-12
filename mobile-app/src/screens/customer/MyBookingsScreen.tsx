import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { bookingsApi } from '../../services/bookingsApi';
import { SafeAreaView } from 'react-native-safe-area-context';

type BookingFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<BookingFilter>('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const result = await bookingsApi.getCustomerBookings();
      let filtered = result.bookings || [];
      
      if (filter !== 'all') {
        if (filter === 'upcoming') {
          // Upcoming includes: pending, confirmed, started
          filtered = filtered.filter((b: any) => 
            ['pending', 'confirmed', 'started'].includes(b.status?.toLowerCase())
          );
        } else {
          filtered = filtered.filter((b: any) => 
            b.status?.toLowerCase() === filter
          );
        }
      }
      
      setBookings(filtered);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#4CAF50';
      case 'started':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Pending';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const route = item.ride 
      ? `${item.ride.start_location} → ${item.ride.end_location}`
      : 'Route not available';
    const price = `₹${item.total_fare ? Number(item.total_fare).toFixed(2) : '0.00'}`;
    const dateTime = item.ride?.scheduled_time
      ? `${formatDate(item.ride.scheduled_time)} · ${formatTime(item.ride.scheduled_time)}`
      : '';
    const passengers = `${item.passengerCount || 1} ${(item.passengerCount || 1) === 1 ? 'passenger' : 'passengers'}`;

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingDetails' as never, { bookingId: item.id } as never)}
        activeOpacity={0.7}
      >
        {/* Top Row: Route + Price */}
        <View style={styles.bookingHeader}>
          <Text style={styles.routeText} numberOfLines={1}>
            {route}
          </Text>
          <Text style={styles.priceText}>{price}</Text>
        </View>

        {/* Middle Row: Date · Time · Passengers + Status */}
        <View style={styles.bookingMeta}>
          <Text style={styles.metaText}>
            {dateTime} · {passengers}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filterOptions: { label: string; value: BookingFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
      <SafeAreaView style={styles.container}>
      {/* Sticky Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.filterChip, filter === option.value && styles.filterChipActive]}
              onPress={() => setFilter(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === option.value && styles.filterTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-note" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'You haven\'t made any bookings yet'
                  : `No ${filter === 'upcoming' ? 'upcoming' : filter} bookings found`
                }
              </Text>
              {filter !== 'all' && (
                <TouchableOpacity
                  style={styles.resetFilterButton}
                  onPress={() => setFilter('all')}
                >
                  <Text style={styles.resetFilterText}>Show All Bookings</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Sticky Filter Chips
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  // Compact Booking Card
  bookingCard: {
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
    }),
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  routeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bookingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFilterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resetFilterText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
