/**
 * Razorpay Checkout Utility for React Web App
 * 
 * This utility handles:
 * 1. Dynamic loading of Razorpay Checkout JS
 * 2. Creating orders via backend API
 * 3. Opening Razorpay checkout
 * 4. Handling payment success/failure
 * 5. Verifying payments via backend
 */

import { VITE_API_BASE_URL } from './env';

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

interface RazorpayOptions {
  key: string;
  amount: number; // Amount in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal: {
    ondismiss: () => void;
  };
}

/**
 * Load Razorpay Checkout JS dynamically
 */
const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order via backend API
 */
const createRazorpayOrder = async (
  bookingId: string,
  amount: number,
  accessToken: string
): Promise<RazorpayOrderResponse> => {
  const response = await fetch(`${VITE_API_BASE_URL}/payments/razorpay/create-order`, {
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
      // If response is not JSON, use status text
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
  const response = await fetch(`${VITE_API_BASE_URL}/payments/razorpay/verify`, {
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
    // Step 1: Load Razorpay script
    await loadRazorpayScript();

    // Step 2: Create order via backend
    const orderData = await createRazorpayOrder(bookingId, amount, accessToken);

    // Step 3: Initialize Razorpay Checkout
    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100), // Convert to paise
      currency: orderData.currency,
      name: 'HushRyd',
      description: `Payment for booking ${orderData.receipt}`,
      order_id: orderData.orderId,
      prefill: {
        name: orderData.customer.name,
        email: orderData.customer.email,
        contact: orderData.customer.contact,
      },
      theme: {
        color: '#FF6B35', // HushRyd brand color
      },
      handler: async (response) => {
        try {
          // Step 4: Verify payment signature via backend
          const verification = await verifyRazorpayPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            accessToken
          );

          if (verification.verified) {
            // Payment verified successfully
            onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id);
          } else {
            // Payment verification failed
            onFailure?.('Payment verification failed. Please contact support.');
          }
        } catch (error: any) {
          console.error('Razorpay payment verification error:', error);
          onFailure?.(error.message || 'Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          // User closed the payment modal - just notify frontend, don't cancel booking
          // The booking should remain as "pending" so user can retry payment later
          onCancel?.();
        },
      },
    };

    // Step 5: Open Razorpay Checkout
    const razorpay = new (window as any).Razorpay(options);

    // Handle payment failure
    razorpay.on('payment.failed', async (response: any) => {
      try {
        // Notify backend about payment failure
        await fetch(`${VITE_API_BASE_URL}/payments/razorpay/failure`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_order_id: response.error.metadata?.order_id || orderData.orderId,
            razorpay_payment_id: response.error.metadata?.payment_id || '',
            error_description: response.error.description || 'Payment failed',
          }),
        });
      } catch (error) {
        console.error('Failed to notify backend about payment failure:', error);
      }

      onFailure?.(response.error.description || 'Payment failed');
    });

    // Open checkout
    razorpay.open();
  } catch (error: any) {
    console.error('Error initiating Razorpay payment:', error);
    const errorMessage = error?.message || error?.toString() || 'Failed to initiate payment';
    onFailure?.(errorMessage);
    throw error; // Re-throw to allow caller to handle
  }
};

