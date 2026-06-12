import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Linking,
  Platform} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { paymentApi } from '../services/paymentApi';
import { useAppSelector } from '../store/hooks';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId, amount } = route.params as { bookingId: string; amount: number };
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

  // Check payment status when screen is focused (after returning from payment gateway)
  useFocusEffect(
    React.useCallback(() => {
      checkPaymentStatus();
    }, [])
  );

  const checkPaymentStatus = async () => {
    try {
      // Check if payment was successful by checking booking status
      // This will be called when user returns from payment gateway
      const status = await paymentApi.getPaymentStatus(bookingId);
      if (status.paymentStatus === 'success') {
        setPaymentStatus('success');
        Alert.alert(
          'Payment Successful',
          'Your booking has been confirmed!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('BookingDetails' as never, { bookingId } as never),
            },
          ]
        );
      } else if (status.paymentStatus === 'failed') {
        setPaymentStatus('failed');
      }
    } catch (error) {
      // Silently fail - payment might still be processing
      console.log('Payment status check:', error);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('processing');

      // Get user details for PayU payment
      if (!user) {
        Alert.alert('Error', 'User information not available. Please login again.');
        setLoading(false);
        return;
      }

      const userName = user.first_name || 'Customer';
      const userEmail = user.email || `${user.mobile}@hushryd.com`;
      const userPhone = user.mobile || '';

      // Create PayU payment via backend
      const paymentData = await paymentApi.createPayUPayment(
        amount,
        userName,
        userEmail,
        userPhone
      );

      if (!paymentData.paymentUrl) {
        throw new Error('Payment URL not received from server');
      }

      // Open PayU payment URL in browser
      const supported = await Linking.canOpenURL(paymentData.paymentUrl);
      if (supported) {
        await Linking.openURL(paymentData.paymentUrl);
        // Note: User will complete payment in browser and be redirected back
        // Payment status will be checked when screen regains focus
        setPaymentStatus('processing');
      } else {
        Alert.alert('Error', 'Cannot open payment page');
        setPaymentStatus('pending');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initiate payment');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Payment</Text>
            <Text style={styles.subtitle}>Booking will be confirmed after successful payment</Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>₹{amount.toFixed(2)}</Text>
          </View>

          {paymentStatus === 'success' && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>✓ Payment Successful</Text>
              <Text style={styles.successSubtext}>Your booking has been confirmed</Text>
            </View>
          )}

          {paymentStatus === 'failed' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Payment Failed</Text>
              <Text style={styles.errorSubtext}>Please try again</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button, 
              (loading || paymentStatus === 'success') && styles.buttonDisabled
            ]}
            onPress={handlePayment}
            disabled={loading || paymentStatus === 'success'}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : paymentStatus === 'success' ? (
              <Text style={styles.buttonText}>Payment Completed</Text>
            ) : (
              <Text style={styles.buttonText}>Pay ₹{amount.toFixed(2)} with PayU</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • Booking will only be confirmed after successful payment{'\n'}
              • You will be redirected to PayU payment gateway{'\n'}
              • Complete payment in the browser{'\n'}
              • Return to app to see booking confirmation
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  amount: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#FF6B35',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  successSubtext: {
    fontSize: 14,
    color: '#66BB6A',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#E57373',
  },
  button: { 
    backgroundColor: '#FF6B35', 
    borderRadius: 12, 
    padding: 18, 
    width: '100%', 
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: { 
    opacity: 0.6,
    backgroundColor: '#4CAF50',
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
});

