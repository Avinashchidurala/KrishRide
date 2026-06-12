import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ridesApi } from '../../services/ridesApi';
import { bookingsApi } from '../../services/bookingsApi';

export default function ActiveRideScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as { bookingId: string };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const rides = await ridesApi.getMyRides();
      
      let foundBooking: any = null;
      rides.rides?.forEach((ride: any) => {
        const booking = ride.bookings?.find((b: any) => b.id === bookingId);
        if (booking) {
          foundBooking = { ...booking, ride };
        }
      });

      if (foundBooking) {
        setBooking(foundBooking);
      } else {
        Alert.alert('Error', 'Booking not found');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPickupOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }

    try {
      setSubmitting(true);
      await bookingsApi.verifyPickupOTP(bookingId, otp);
      Alert.alert('Success', 'Pickup verified. Ride started.');
      setOtp('');
      await loadBooking();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDropPIN = async () => {
    if (!pin || pin.length !== 4) {
      Alert.alert('Error', 'Please enter 4-digit PIN');
      return;
    }

    try {
      setSubmitting(true);
      await bookingsApi.verifyDropPIN(bookingId, pin);
      Alert.alert('Success', 'Drop verified. Ride completed.');
      setPin('');
      await loadBooking();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid PIN');
    } finally {
      setSubmitting(false);
    }
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

  const isConfirmed = booking.status === 'confirmed';
  const isStarted = booking.status === 'started';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.bookingId}>Booking: {booking.booking_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <Text style={styles.routeText}>{booking.ride?.start_location}</Text>
          <Text style={styles.routeText}>{booking.ride?.end_location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger</Text>
          <Text style={styles.detailText}>
            {booking.customer?.user?.first_name} {booking.customer?.user?.last_name}
          </Text>
          <Text style={styles.detailText}>Passengers: {booking.passengerCount}</Text>
          <Text style={styles.detailText}>Fare: ₹{booking.total_fare ? Number(booking.total_fare).toFixed(2) : '0.00'}</Text>
        </View>

        {isConfirmed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verify Pickup (Enter OTP)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
            />
            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleVerifyPickupOTP}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Pickup OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isStarted && (
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Complete Ride (Enter PIN)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 4-digit PIN"
                keyboardType="number-pad"
                maxLength={4}
                value={pin}
                onChangeText={(text) => setPin(text.replace(/\D/g, ''))}
              />
              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleVerifyDropPIN}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Drop PIN</Text>
                )}
              </TouchableOpacity>
            </View>
        )}

        {booking.status === 'completed' && (
          <View style={styles.section}>
            <Text style={styles.completedText}>Ride completed successfully</Text>
          </View>
        )}
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
  routeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '600',
  },
});

