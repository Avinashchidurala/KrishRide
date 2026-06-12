import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform} from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingsApi } from '../../services/bookingsApi';
import LiveTrackingMap from '../../components/maps/LiveTrackingMap';

interface RouteParams {
  bookingId: string;
}

export default function LiveTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await bookingsApi.getMyBookings();
      const found = response.bookings?.find((b: any) => b.id === bookingId);

      if (found) {
        setBooking(found);
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      console.error('Failed to load booking:', err);
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const getDriverLocation = () => {
    if (booking?.ride?.driver?.current_latitude && booking?.ride?.driver?.current_longitude) {
      return {
        latitude: parseFloat(booking.ride.driver.current_latitude),
        longitude: parseFloat(booking.ride.driver.current_longitude),
      };
    }
    return undefined;
  };

  const getPickupLocation = () => {
    if (booking?.ride?.start_latitude && booking?.ride?.start_longitude) {
      return {
        latitude: parseFloat(booking.ride.start_latitude),
        longitude: parseFloat(booking.ride.start_longitude),
      };
    }
    return undefined;
  };

  const getDropLocation = () => {
    if (booking?.ride?.end_latitude && booking?.ride?.end_longitude) {
      return {
        latitude: parseFloat(booking.ride.end_latitude),
        longitude: parseFloat(booking.ride.end_longitude),
      };
    }
    return undefined;
  };

  const isActiveBooking = () => {
    return booking?.status === 'confirmed' || booking?.status === 'started';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#DC3545" />
          <Text style={styles.errorTitle}>Unable to Load Booking</Text>
          <Text style={styles.errorMessage}>{error || 'Booking not found'}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadBooking}
            >
              <MaterialIcons name="refresh" size={20} color="#FF6B35" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Back to Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!isActiveBooking()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inactiveContainer}>
          <MaterialIcons name="schedule" size={64} color="#FFB800" />
          <Text style={styles.inactiveTitle}>Live Tracking Unavailable</Text>
          <Text style={styles.inactiveMessage}>
            Live tracking is only available for active bookings (confirmed or started).
          </Text>

          <View style={styles.bookingStatus}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <View style={[styles.statusBadge, getStatusStyle(booking.status)]}>
              <Text style={styles.statusText}>{booking.status?.toUpperCase()}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('BookingDetails', { bookingId })}
          >
            <Text style={styles.detailsButtonText}>View Booking Details</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Route Info Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeText}>
              {booking.ride?.start_location} → {booking.ride?.end_location}
            </Text>
            <Text style={styles.bookingId}>ID: {booking.booking_number}</Text>
          </View>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <LiveTrackingMap
            bookingId={booking.id}
            driverLocation={getDriverLocation()}
            pickupLocation={getPickupLocation()}
            dropLocation={getDropLocation()}
            routePolyline={booking.ride?.route_polyline}
            height={300}
          />
        </View>

        {/* Driver Info Card */}
        <View style={styles.driverCard}>
          <Text style={styles.sectionTitle}>Driver Information</Text>

          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <MaterialIcons name="account-circle" size={40} color="#666" />
            </View>

            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {booking.ride?.driver?.user?.first_name} {booking.ride?.driver?.user?.last_name}
              </Text>
              {booking.ride?.driver?.user?.mobile && (
                <Text style={styles.driverPhone}>
                  {booking.ride.driver.user.mobile}
                </Text>
              )}
              {booking.ride?.driver?.vehicle_number && (
                <Text style={styles.vehicleNumber}>
                  {booking.ride.driver.vehicle_number}
                </Text>
              )}
            </View>

            <View style={[styles.statusBadge, getStatusStyle(booking.status)]}>
              <Text style={styles.statusText}>{booking.status?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {
              // Handle call driver
              Alert.alert('Call Driver', 'Feature coming soon!');
            }}
          >
            <MaterialIcons name="call" size={20} color="white" />
            <Text style={styles.callButtonText}>Call Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('BookingDetails', { bookingId })}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { backgroundColor: '#28A745' };
    case 'started':
      return { backgroundColor: '#007AFF' };
    case 'completed':
      return { backgroundColor: '#28A745' };
    case 'cancelled':
      return { backgroundColor: '#DC3545' };
    default:
      return { backgroundColor: '#6C757D' };
  }
};

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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  retryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inactiveTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  inactiveMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookingStatus: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
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
  routeHeader: {
    alignItems: 'center',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  bookingId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vehicleNumber: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    borderRadius: 8,
    padding: 12,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
