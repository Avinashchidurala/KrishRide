/**
 * Razorpay Service for React Native Mobile App
 * 
 * This service handles Razorpay payment integration for React Native
 */

import RazorpayCheckout from 'react-native-razorpay';
import { Platform } from 'react-native';

// Get API base URL from environment variable or fallback to defaults
// const getApiBaseUrl = (): string => {
//   if (process.env.EXPO_PUBLIC_API_URL) {
//     return process.env.EXPO_PUBLIC_API_URL;
//   }
//   if (__DEV__) {
//     if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:3000/api';
//     }
//     return 'http://localhost:3000/api';
//   }
//   return 'https://api.hushryd.com/api';
// };

const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000/api";
};


interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  keyId: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
}

/**
 * Create Razorpay order via backend API
 */
const createRazorpayOrder = async (
  bookingId: string,
  amount: number,
  accessToken: string
): Promise<RazorpayOrderResponse> => {
  const API_BASE_URL = getApiBaseUrl();
  
  const response = await fetch(`${API_BASE_URL}/payments/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      bookingId,
      amount,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create Razorpay order';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Verify Razorpay payment via backend API
 */
const verifyRazorpayPayment = async (
  orderId: string,
  paymentId: string,
  signature: string,
  accessToken: string
): Promise<{ success: boolean; verified: boolean }> => {
  const API_BASE_URL = getApiBaseUrl();
  
  const response = await fetch(`${API_BASE_URL}/payments/razorpay/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      orderId,
      paymentId,
      signature,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Payment verification failed';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Initiate Razorpay payment flow
 * 
 * @param bookingId - Booking ID
 * @param amount - Amount in rupees
 * @param accessToken - User's access token
 * @param onSuccess - Success callback
 * @param onFailure - Failure callback
 * @param onCancel - Cancel callback
 */
export const initiateRazorpayPayment = async (
  bookingId: string,
  amount: number,
  accessToken: string,
  onSuccess?: (paymentId: string, orderId: string) => void,
  onFailure?: (error: string) => void,
  onCancel?: () => void
): Promise<void> => {
  try {
    // Step 1: Create order via backend
    const orderData = await createRazorpayOrder(bookingId, amount, accessToken);

    // Step 2: Initialize Razorpay Checkout
    const options = {
      description: `Payment for booking ${orderData.receipt}`,
      image: 'https://your-logo-url.com/logo.png', // Optional: Add your app logo
      currency: orderData.currency,
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100), // Convert to paise
      name: 'HushRyd',
      order_id: orderData.orderId,
      prefill: {
        email: orderData.customer.email,
        contact: orderData.customer.contact,
        name: orderData.customer.name,
      },
      theme: { color: '#FF6B35' }, // HushRyd brand color
    };

    // Step 3: Open Razorpay Checkout
    const paymentResponse = await RazorpayCheckout.open(options);

    // Step 4: Verify payment signature via backend
    const verification = await verifyRazorpayPayment(
      paymentResponse.razorpay_order_id,
      paymentResponse.razorpay_payment_id,
      paymentResponse.razorpay_signature,
      accessToken
    );

    if (verification.verified) {
      // Payment verified successfully
      onSuccess?.(paymentResponse.razorpay_payment_id, paymentResponse.razorpay_order_id);
    } else {
      // Payment verification failed
      onFailure?.('Payment verification failed. Please contact support.');
    }
  } catch (error: any) {
    console.error('Razorpay payment error:', error);
    
    // Handle cancellation
    if (error.code === 'BAD_REQUEST_ERROR' && error.description === 'Payment cancelled by user') {
      onCancel?.();
    } else {
      const errorMessage = error.description || error.message || 'Payment failed';
      onFailure?.(errorMessage);
    }
    throw error;
  }
};

