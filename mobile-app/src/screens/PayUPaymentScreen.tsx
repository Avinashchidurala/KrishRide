import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PayUPaymentScreenProps {
  bookingId: string;
  amount: number;
}

export default function PayUPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef<WebView>(null);

  const params = route.params as PayUPaymentScreenProps;
  const { bookingId, amount } = params;

  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Generate PayU payment URL
  React.useEffect(() => {
    const generatePaymentUrl = async () => {
      try {
        // Here you would call your backend API to create PayU payment
        // For now, we'll create a sample payment URL structure
        const baseUrl = __DEV__
          ? 'http://10.0.2.2:3000' // Android emulator
          : 'https://your-api-domain.com';

        const paymentUrl = `${baseUrl}/api/payments/payu/payment-page?bookingId=${bookingId}&amount=${amount}`;
        setPaymentUrl(paymentUrl);
      } catch (error) {
        console.error('Error generating payment URL:', error);
        Alert.alert('Error', 'Failed to initialize payment');
        navigation.goBack();
      }
    };

    if (bookingId && amount) {
      generatePaymentUrl();
    }
  }, [bookingId, amount]);

  const handleMessage = (event: any) => {
    const message = event.nativeEvent.data;

    if (message === 'PAYMENT_SUCCESS') {
      // Payment successful
      Alert.alert(
        'Payment Successful',
        'Your booking has been confirmed!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyBookings' as never),
          },
        ]
      );
    } else if (message === 'PAYMENT_FAILED') {
      // Payment failed
      Alert.alert(
        'Payment Failed',
        'Payment was not completed. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => webViewRef.current?.reload(),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } else if (message.startsWith('PAYMENT_SUCCESS:')) {
      // Payment successful with transaction ID
      const txnid = message.split(':')[1];
      Alert.alert(
        'Payment Successful',
        `Your booking has been confirmed!\nTransaction ID: ${txnid}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyBookings' as never),
          },
        ]
      );
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setLoading(false);
    Alert.alert(
      'Connection Error',
      'Unable to load payment page. Please check your internet connection.',
      [
        {
          text: 'Retry',
          onPress: () => webViewRef.current?.reload(),
        },
        {
          text: 'Cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (!paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Preparing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Cancel Payment',
              'Are you sure you want to cancel this payment?',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => navigation.goBack() },
              ]
            );
          }}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webView}
          onMessage={handleMessage}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
          }
        />
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <MaterialIcons name="security" size={16} color="#28A745" />
        <Text style={styles.securityText}>
          Your payment information is secured with SSL encryption
        </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerPlaceholder: {
    width: 40,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
  },
  securityText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 8,
    textAlign: 'center',
  },
});
