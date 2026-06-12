/**
 * PayU India Web Checkout Utility for React
 *
 * Implementation: Popup Window with postMessage Communication
 * 
 * Flow:
 * 1. User clicks "Pay Now" → popup opens (user gesture required)
 * 2. Popup loads PayU checkout
 * 3. PayU redirects to backend surl/furl
 * 4. Backend returns HTML that sends postMessage and closes popup
 * 5. Parent window receives message and verifies payment with backend
 * 6. Parent UI shows success/failure
 *
 * Security:
 * - Validates event.origin on frontend
 * - Never trusts popup message blindly
 * - Always re-verifies payment via backend API
 */

import { VITE_API_BASE_URL } from './env';

// PayU configuration interface (matches backend response)
interface PayUConfig {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  service_provider?: string;
  paymentUrl: string;
}

// Popup reference storage (prevents multiple popups)
let activePopup: Window | null = null;
let isPaymentInProgress = false;

/**
 * Create PayU payment via backend API
 */
const createPayUPayment = async (
  bookingId: string,
  amount: number,
  accessToken: string
): Promise<PayUConfig> => {
  const response = await fetch(`${VITE_API_BASE_URL}/payments/payu/create-payment`, {
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
    let errorMessage = 'Failed to create PayU payment';
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
 * Verify PayU payment via backend API
 */
const verifyPayUPayment = async (
  txnid: string,
  bookingId: string,
  accessToken: string
): Promise<{ success: boolean; verified: boolean; bookingId?: string }> => {
  const response = await fetch(`${VITE_API_BASE_URL}/payments/payu/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      txnid,
      bookingId,
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
 * Validate message origin for security
 */
const isValidOrigin = (origin: string): boolean => {
  // Get current origin
  const currentOrigin = window.location.origin;
  const currentHostname = window.location.hostname;
  
  // Allow messages from:
  // 1. Same origin (backend callbacks on same domain)
  // 2. Backend API origin (if different from frontend)
  // 3. Localhost/127.0.0.1 for development
  const allowedOrigins = [
    currentOrigin,
    currentHostname,
    'localhost',
    '127.0.0.1',
    // Add your backend domain if different from frontend
    // e.g., 'api.yourdomain.com'
  ];

  return allowedOrigins.some(allowed => 
    origin.includes(allowed) || 
    origin === `http://${allowed}` || 
    origin === `https://${allowed}`
  );
};

/**
 * Open PayU payment form in a popup window
 * 
 * IMPORTANT: This must be called directly from a click handler (user gesture)
 * to avoid popup blockers.
 */
const openPayUPopup = (
  paymentData: PayUConfig,
  onMessage: (result: { success: boolean; txnid?: string; error?: string }) => void
): void => {
  // Prevent double clicks / multiple popups
  if (isPaymentInProgress || activePopup) {
    console.warn('Payment already in progress');
    return;
  }

  // Create form
  const form = document.createElement('form');
  form.method = 'post';
  form.action = paymentData.paymentUrl;
  form.target = 'PayUCheckout';
  form.style.display = 'none';

  // Add form fields
  Object.entries(paymentData).forEach(([key, value]) => {
    if (key !== 'paymentUrl' && value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  });

  // Append form to body
  document.body.appendChild(form);

  // Open popup window (MUST be called from user gesture)
  const popupWidth = 800;
  const popupHeight = 700;
  const left = (window.screen.width - popupWidth) / 2;
  const top = (window.screen.height - popupHeight) / 2;

  const popup = window.open(
    '',
    'PayUCheckout',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
  );

  if (!popup) {
    document.body.removeChild(form);
    onMessage({ success: false, error: 'Popup blocked. Please allow popups for this site and try again.' });
    return;
  }

  // Store popup reference
  activePopup = popup;
  isPaymentInProgress = true;

  // Submit form to open PayU in popup
  form.submit();

  // Remove form from DOM
  document.body.removeChild(form);

  // Listen for postMessage from popup
  // Backend success/failure pages send postMessage when payment completes
  const handleMessage = (event: MessageEvent) => {
    // SECURITY: Validate origin
    if (!isValidOrigin(event.origin)) {
      console.warn('Rejected message from invalid origin:', event.origin);
      return;
    }

    // Check if message is from PayU payment flow
    // PayU sends: { status: "success"|"failure", source: "payu", txnid: "..." }
    if (event.data && typeof event.data === 'object') {
      // Check for PayU message format
      if (event.data.source === 'payu' && event.data.status === 'success') {
        // Cleanup
        cleanup();
        
        // Close popup if still open
        if (popup && !popup.closed) {
          popup.close();
        }

        // Call callback with success
        onMessage({ 
          success: true, 
          txnid: event.data.txnid || paymentData.txnid 
        });
      } else if (event.data.source === 'payu' && event.data.status === 'failure') {
        // Cleanup
        cleanup();
        
        // Close popup if still open
        if (popup && !popup.closed) {
          popup.close();
        }

        // Call callback with failure
        onMessage({ 
          success: false, 
          error: 'Payment failed' 
        });
      }
      // Also support legacy format for backward compatibility
      else if (event.data.type === 'PAYU_PAYMENT_SUCCESS' || event.data.status === 'success') {
        cleanup();
        if (popup && !popup.closed) {
          popup.close();
        }
        onMessage({ 
          success: true, 
          txnid: event.data.txnid || paymentData.txnid 
        });
      } else if (event.data.type === 'PAYU_PAYMENT_FAILURE' || event.data.status === 'failure') {
        cleanup();
        if (popup && !popup.closed) {
          popup.close();
        }
        onMessage({ 
          success: false, 
          error: event.data.error || event.data.message || 'Payment failed' 
        });
      }
    }
  };

  // Listen for popup being closed manually by user
  const checkPopupClosed = setInterval(() => {
    try {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        cleanup();
        
        // User closed popup manually - treat as cancellation
        onMessage({ 
          success: false, 
          error: 'Payment window was closed' 
        });
      }
    } catch (e) {
      // Cross-origin access error - popup might be on PayU domain
      // This is expected, continue polling
    }
  }, 500);

  // Cleanup function
  const cleanup = () => {
    clearInterval(checkPopupClosed);
    window.removeEventListener('message', handleMessage);
    activePopup = null;
    isPaymentInProgress = false;
  };

  // Add message listener
  window.addEventListener('message', handleMessage);

  // Cleanup after 10 minutes (timeout)
  setTimeout(() => {
    if (popup && !popup.closed) {
      popup.close();
    }
    cleanup();
  }, 600000);
};

/**
 * Initiate PayU payment flow with popup checkout
 *
 * @param bookingId - Booking ID
 * @param amount - Amount in rupees
 * @param accessToken - User's access token
 * @param onSuccess - Success callback
 * @param onFailure - Failure callback
 * @param onCancel - Cancel callback
 * 
 * IMPORTANT: This function should be called directly from a click handler
 * to ensure popup opens (user gesture required).
 */
export const initiatePayUPayment = async (
  bookingId: string,
  amount: number,
  accessToken: string,
  onSuccess?: (txnid: string) => void,
  onFailure?: (error: string) => void,
  onCancel?: () => void
): Promise<void> => {
  // Prevent double clicks
  if (isPaymentInProgress) {
    console.warn('Payment already in progress');
    return;
  }

  try {
    // Step 1: Create payment via backend
    const payuConfig = await createPayUPayment(bookingId, amount, accessToken);

    // Step 2: Open PayU in popup window
    // This MUST be called synchronously from click handler (user gesture)
    openPayUPopup(payuConfig, async (result) => {
      if (result.success && result.txnid) {
        // Payment successful - verify with backend (SECURITY: Never trust popup message)
        try {
          const verification = await verifyPayUPayment(
            result.txnid,
            bookingId,
            accessToken
          );

          if (verification.verified) {
            onSuccess?.(result.txnid);
          } else {
            onFailure?.('Payment verification failed. Please contact support.');
          }
        } catch (error: any) {
          console.error('PayU payment verification error:', error);
          onFailure?.(error.message || 'Payment verification failed');
        }
      } else {
        // Payment failed or cancelled
        if (result.error === 'Payment window was closed') {
          onCancel?.();
        } else {
          onFailure?.(result.error || 'Payment failed');
        }
      }
    });

  } catch (error: any) {
    console.error('Error initiating PayU payment:', error);
    const errorMessage = error?.message || error?.toString() || 'Failed to initiate payment';
    onFailure?.(errorMessage);
    isPaymentInProgress = false;
    activePopup = null;
    throw error;
  }
};

/**
 * Check if PayU checkout is available
 */
export const isPayUAvailable = (): boolean => {
  return true; // PayU form-based checkout is always available
};

/**
 * Get PayU checkout version (for debugging)
 */
export const getPayUVersion = (): string | null => {
  return 'popup-form-based';
};

/**
 * Debug PayU loading status
 */
export const debugPayUStatus = () => {
  console.log('=== PayU Debug Info ===');
  console.log('PayU Type: Popup window with form-based submission');
  console.log('Payment URL: https://secure.payu.in/_payment (production) or https://test.payu.in/_payment (test)');
  console.log('Active Popup:', !!activePopup);
  console.log('Payment In Progress:', isPaymentInProgress);
  console.log('Network Online:', navigator.onLine);
  console.log('User Agent:', navigator.userAgent);
  console.log('======================');
};
