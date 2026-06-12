import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ridesApi } from '../../services/ridesApi';

export default function RideRequestsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const rides = await ridesApi.getMyRides();
      
      const allBookings: any[] = [];
      rides.rides?.forEach((ride: any) => {
        if (ride.bookings && ride.status === 'active') {
          ride.bookings.forEach((booking: any) => {
            if (booking.status === 'confirmed' || booking.status === 'pending') {
              allBookings.push({ ...booking, ride });
            }
          });
        }
      });

      setBookings(allBookings);
    } catch (error: any) {
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

  const handleBookingPress = (booking: any) => {
    navigation.navigate('ActiveRide' as never, { bookingId: booking.id } as never);
  };

  const renderBookingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleBookingPress(item)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingRoute}>
          {item.ride?.start_location} → {item.ride?.end_location}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.bookingId}>Booking: {item.booking_number}</Text>
      <Text style={styles.customerName}>
        Passenger: {item.customer?.user?.first_name} {item.customer?.user?.last_name}
      </Text>
      <Text style={styles.detailText}>
        Passengers: {item.passengerCount} | Fare: ₹{item.total_fare ? Number(item.total_fare).toFixed(2) : '0.00'}
      </Text>
      <Text style={styles.detailText}>
        Time: {new Date(item.ride?.scheduled_time).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride Requests</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No ride requests</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FF9800';
    case 'confirmed':
      return '#4CAF50';
    default:
      return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bookingId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 14,
  },
});

