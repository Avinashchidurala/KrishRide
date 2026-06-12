import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ridesApi } from '../../services/ridesApi';
import { bookingsApi } from '../../services/bookingsApi';
import { initiateRazorpayPayment } from '../../services/razorpayService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BookRideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params as { rideId?: string }) || {};
  const rideId = params.rideId;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [fareSummaryExpanded, setFareSummaryExpanded] = useState(false);

  useEffect(() => {
    if (rideId) {
      loadRide();
    } else {
      Alert.alert('Error', 'No ride selected');
      navigation.goBack();
    }
  }, [rideId]);

  const loadRide = async () => {
    try {
      setLoading(true);
      const result = await ridesApi.getRideDetails(rideId);
      const rideData = result.ride || result;
      setRide(rideData);
    } catch (error: any) {
      console.error('❌ Error loading ride details:', error);
      Alert.alert('Error', error.message || 'Failed to load ride details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!ride) return;
    
    const totalSeats = ride.availableSeats || ride.seats_available || 0;
    const bookedSeats = ride.booked_seats || 0;
    const availableSeats = Math.max(0, totalSeats - bookedSeats);
    
    if (passengerCount > availableSeats) {
      Alert.alert('Error', `Not enough seats available. Only ${availableSeats} seat(s) left.`);
      return;
    }

    if (passengerCount < 1) {
      Alert.alert('Error', 'Please select at least 1 passenger');
      return;
    }

    try {
      setSubmitting(true);
      const result = await bookingsApi.createBooking({
        rideId: ride.id,
        passengerCount,
        paymentMethod: paymentMethod.toUpperCase(),
        initialPricePerSeat:ride.price_per_seat,
      });

      const totalFare = result.fareBreakdown?.totalFare || result.booking?.total_fare;
      const bookingId = result.booking?.id || result.bookingId || result.id;
      
      if (paymentMethod === 'razorpay') {
        // Get token (not accessToken)
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Error', 'Please login again');
          return;
        }

        await initiateRazorpayPayment(
          bookingId,
          totalFare,
          token,
          (paymentId, orderId) => {
            Alert.alert('Success', 'Payment successful! Your booking is confirmed.', [
              {
                text: 'OK',
                onPress: () => navigation.navigate('CustomerTabs' as any, {
         screen: 'MyBookings',
    }),
              },
            ]);
          },
          (error) => {
            Alert.alert('Payment Failed', error);
          },
          () => {
            Alert.alert('Payment Cancelled', 'Payment was cancelled. You can try again.');
          }
        );
      } else {
        navigation.navigate('CustomerTabs' as any, {
         screen: 'MyBookings',
    });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    let dayLabel = '';
    if (dateStr === todayStr) dayLabel = 'Today';
    else if (dateStr === tomorrowStr) dayLabel = 'Tomorrow';
    else {
      dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dayLabel} · ${time}`;
  };

  const calculateFare = () => {
    const baseFare = (ride?.price_per_seat || 0) * passengerCount;
    const platformFee = 10;
    const gst = baseFare * 0.18;
    const total = baseFare + platformFee + gst;
    return { baseFare, platformFee, gst, total };
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Your Ride</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loaderContainer}>
          <MaterialIcons name="error-outline" size={64} color="#DC3545" />
          <Text style={styles.errorTitle}>Ride Not Found</Text>
          <Text style={styles.errorText}>Unable to load ride details. Please try again.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { baseFare, platformFee, gst, total } = calculateFare();
    const totalSeats = ride.availableSeats || ride.seats_available || 0;
    const bookedSeats = ride.booked_seats || 0;
    const availableSeats = Math.max(0, totalSeats - bookedSeats);
  const driverName = `${ride.driver?.user?.first_name || ''} ${ride.driver?.user?.last_name || ''}`.trim() || 'Driver';
  const driverRating = ride.driver?.average_rating != null ? Number(ride.driver.average_rating).toFixed(1) : 'N/A';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Your Ride</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ride Summary Card */}
        <View style={styles.card}>
          {/* Route */}
          <View style={styles.routeContainer}>
            <View style={styles.routeLine}>
              <View style={styles.locationDot} />
              <Text style={styles.routeText} numberOfLines={1}>
                {ride.start_location}
              </Text>
            </View>
            <View style={styles.routeArrow}>
              <MaterialIcons name="arrow-forward" size={20} color="#999" />
            </View>
            <View style={styles.routeLine}>
              <View style={[styles.locationDot, styles.locationDotRed]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {ride.end_location}
              </Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Text style={styles.dateTimeText}>
              {formatDate(ride.scheduled_time)}
            </Text>
          </View>

          {/* Driver Info */}
          <View style={styles.driverRow}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={14} color="#FFB800" />
                <Text style={styles.ratingText}>{driverRating}</Text>
              </View>
            </View>
            <Text style={styles.pricePerSeat}>₹{ride.price_per_seat}/seat</Text>
          </View>
        </View>

        {/* Passengers Section */}
        <View style={styles.card}>
          <View style={styles.passengerSection}>
            <Text style={styles.sectionLabel}>Passengers</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                disabled={passengerCount <= 1}
                style={[styles.stepperButton, passengerCount <= 1 && styles.stepperButtonDisabled]}
              >
                <MaterialIcons 
                  name="remove" 
                  size={20} 
                  color={passengerCount <= 1 ? '#CCC' : '#FF6B35'} 
                />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{passengerCount}</Text>
              <TouchableOpacity
                onPress={() => setPassengerCount(Math.min(availableSeats, passengerCount + 1))}
                disabled={passengerCount >= availableSeats}
                style={[styles.stepperButton, passengerCount >= availableSeats && styles.stepperButtonDisabled]}
              >
                <MaterialIcons 
                  name="add" 
                  size={20} 
                  color={passengerCount >= availableSeats ? '#CCC' : '#FF6B35'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fare Summary (Collapsible) */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.fareSummaryHeader}
            onPress={() => setFareSummaryExpanded(!fareSummaryExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.fareSummaryLabel}>Fare Summary</Text>
            <View style={styles.fareSummaryRight}>
              <Text style={styles.fareSummaryTotal}>₹{total.toFixed(2)}</Text>
              <MaterialIcons
                name={fareSummaryExpanded ? 'expand-less' : 'expand-more'}
                size={24}
                color="#666"
              />
            </View>
          </TouchableOpacity>

          {fareSummaryExpanded && (
            <View style={styles.fareBreakdown}>
              <View style={styles.fareRow}>
                <Text style={styles.fareItemLabel}>Base Fare</Text>
                <Text style={styles.fareItemValue}>₹{baseFare.toFixed(2)}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareItemLabel}>Platform Fee</Text>
                <Text style={styles.fareItemValue}>₹{platformFee.toFixed(2)}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareItemLabel}>GST (18%)</Text>
                <Text style={styles.fareItemValue}>₹{gst.toFixed(2)}</Text>
              </View>
              <View style={styles.fareDivider} />
              <View style={styles.fareRow}>
                <Text style={styles.fareTotalLabel}>Total Amount</Text>
                <Text style={styles.fareTotalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <View style={styles.paymentRow}>
            <Text style={styles.sectionLabel}>Payment</Text>
            <View style={styles.paymentSelector}>
              <Text style={styles.paymentMethodText}>Razorpay</Text>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            </View>
          </View>
        </View>

        {/* Bottom Spacer for Sticky CTA */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyBottomBar}>
        <View style={styles.stickyContent}>
          <View style={styles.totalSection}>
            <Text style={styles.stickyTotalLabel}>Total</Text>
            <Text style={styles.stickyTotalAmount}>₹{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, submitting && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.bookButtonText}>Book Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
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
  // Ride Summary Styles
  routeContainer: {
    marginBottom: 16,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  locationDotRed: {
    backgroundColor: '#F44336',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  routeArrow: {
    alignItems: 'center',
    marginLeft: 11,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  pricePerSeat: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Passenger Section Styles
  passengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 4,
    height: 40,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 30,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  // Fare Summary Styles
  fareSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  fareSummaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  fareSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fareSummaryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  fareBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fareItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareItemValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  fareTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  fareTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  // Payment Method Styles
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  // Sticky Bottom Bar Styles
  stickyBottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stickyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalSection: {
    flex: 1,
  },
  stickyTotalLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  stickyTotalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
  },
  bookButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
  // Error State Styles
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
