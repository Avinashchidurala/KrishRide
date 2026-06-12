import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { bookingsApi } from '../../services/bookingsApi';

export default function BookingDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as { bookingId: string };
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const result = await bookingsApi.getBookingDetails(bookingId);
      setBooking(result.booking);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // const handleCancel = async () => {
  //   Alert.alert(
  //     'Cancel Booking',
  //     'Are you sure you want to cancel this booking?',
  //     [
  //       { text: 'No', style: 'cancel' },
  //       {
  //         text: 'Yes',
  //         onPress: async () => {
  //           try {
  //             // TODO: Implement cancel booking API
  //             Alert.alert('Success', 'Booking cancelled successfully');
  //             navigation.goBack();
  //           } catch (error: any) {
  //             Alert.alert('Error', error.message || 'Failed to cancel booking');
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };
  const handleCancel = () => {
  if (booking.status === 'confirmed') {
    Alert.alert(
      'Cancellation Not Allowed',
      'Please contact the support team to cancel your booking.'
    );
    return;
  }

  if (booking.status === 'started') {
    Alert.alert(
      'Ride Started',
      'Your ride has already started. You cannot cancel the ride.'
    );
    return;
  }

  Alert.alert(
    'Cancellation Not Allowed',
    'You are not allowed to cancel this booking.'
  );
};

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!booking) {
    return null;
  }

  const isActive = booking.status === 'confirmed' || booking.status === 'started';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.bookingId}>Booking ID: {booking.booking_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeText}>
            <MaterialIcons name="location-on" size={16} color="#4CAF50" />
            <Text style={styles.routeTextContent}>{booking.ride?.start_location}</Text>
          </View>
          <View style={styles.routeText}>
            <MaterialIcons name="flag" size={16} color="#F44336" />
            <Text style={styles.routeTextContent}>{booking.ride?.end_location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.detailText}>
            <MaterialIcons name="calendar-today" size={16} color="#666" />
            <Text style={styles.detailTextContent}>{new Date(booking.ride?.scheduled_time).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailText}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.detailTextContent}>{new Date(booking.ride?.scheduled_time).toLocaleTimeString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <View style={styles.detailText}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.detailTextContent}>{booking.ride?.driver?.user?.first_name} {booking.ride?.driver?.user?.last_name}</Text>
          </View>
          <View style={styles.detailText}>
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <Text style={styles.detailTextContent}>Rating: {booking.ride?.driver?.average_rating || 'N/A'}</Text>
          </View>
          {booking.ride?.driver?.user?.mobile && 
            (booking.status === 'started' || booking.status === 'confirmed') && (
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => {
                  const phoneNumber = booking.ride?.driver?.user?.mobile;
                  if (phoneNumber) {
                    Linking.openURL(`tel:${phoneNumber}`);
                  }
                }}
              >
                <MaterialIcons name="phone" size={16} color="#FFF" />
                <Text style={styles.contactButtonText}>Call Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smsButton}
                onPress={() => {
                  const phoneNumber = booking.ride?.driver?.user?.mobile;
                  if (phoneNumber) {
                    Linking.openURL(`sms:${phoneNumber}`);
                  }
                }}
              >
                <MaterialIcons name="message" size={16} color="#FFF" />
                <Text style={styles.contactButtonText}>SMS Driver</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          <View style={styles.detailText}>
            <MaterialIcons name="people" size={16} color="#666" />
            <Text style={styles.detailTextContent}>{booking.passengerCount} passenger(s)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.detailText}>
            <MaterialIcons name="payment" size={16} color="#666" />
            <Text style={styles.detailTextContent}>Total: ₹{booking.total_fare ? Number(booking.total_fare).toFixed(2) : '0.00'}</Text>
          </View>
          <View style={styles.detailText}>
            <MaterialIcons name="info" size={16} color="#666" />
            <Text style={styles.detailTextContent}>Status: {booking.paymentStatus}</Text>
          </View>
        </View>
        {/* OTP Section */}
          {['confirmed', 'started', 'completed'].includes(booking.status) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Codes</Text>
              {booking.pickup_otp && (
                <View style={styles.otpCard}>
                  <Text style={styles.otpLabel}>Start OTP</Text>
                  <Text style={styles.otpValue}>{booking.pickup_otp}</Text>
                  <Text style={styles.otpHint}>
                    {booking.pickup_verified
                      ? 'Pickup verified ✓'
                      : 'Share this OTP with the driver while boarding'}
                  </Text>
                </View>
              )}

              {/* End PIN */}
              {booking.drop_pin && (
                <View style={styles.otpCard}>
                  <Text style={styles.otpLabel}>End PIN</Text>
                  <Text style={styles.otpValue}>{booking.drop_pin}</Text>
                  <Text style={styles.otpHint}>
                    {booking.drop_verified
                      ? 'Drop verified ✓ Ride completed'
                      : 'Share this PIN with the driver at destination'}
                  </Text>
                </View>
              )}
            </View>
          )}


        {booking.status === 'started' && (
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => navigation.navigate('SOS' as never, { bookingId: booking.id } as never)}
          >
            <MaterialIcons name="warning" size={20} color="#FFF" />
            <Text style={styles.sosButtonText}>SOS Emergency</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'confirmed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => navigation.navigate('Payment' as never, { 
              bookingId: booking.id, 
              amount: booking.total_fare 
            } as never)}
          >
            <Text style={styles.payButtonText}>Complete Payment</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.shareButton}
          onPress={async () => {
            try {
              const shareText = `Booking Details\n\nBooking ID: ${booking.booking_number}\nRoute: ${booking.ride?.start_location} → ${booking.ride?.end_location}\nDate: ${new Date(booking.ride?.scheduled_time).toLocaleDateString()}\nTime: ${new Date(booking.ride?.scheduled_time).toLocaleTimeString()}\nAmount: ₹${booking.total_fare ? Number(booking.total_fare).toFixed(2) : '0.00'}\nStatus: ${booking.status}`;
              await Share.share({
                message: shareText,
                title: 'Booking Details',
              });
            } catch (error) {
              console.error('Error sharing:', error);
            }
          }}
        >
          <Text style={styles.shareButtonText}>📤 Share Booking Details</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return '#4CAF50';
    case 'started':
      return '#2196F3';
    case 'completed':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
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
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  smsButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpCard: {
  // backgroundColor: '#FFF3E0',
  padding: 14,
  borderRadius: 10,
  marginBottom: 12,
  borderWidth: 0,
  borderColor: '#FFB74D',
},
otpLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#555',
},
otpValue: {
  fontSize: 22,
  fontWeight: '700',
  letterSpacing: 4,
  marginVertical: 6,
  color: '#E65100',
},
otpHint: {
  fontSize: 12,
  fontWeight: '600',
  color: '#333',
},

  sosButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  routeText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTextContent: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1A1A1A',
  },
  detailText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTextContent: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
});

