import { useState, useCallback } from 'react';
import { initiatePayUPayment, isPayUAvailable } from '../utils/payuCheckout';

interface UsePayUPaymentOptions {
  onSuccess?: (txnid: string) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

interface UsePayUPaymentReturn {
  initiatePayment: (bookingId: string, amount: number, accessToken: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  isPayUReady: boolean;
  clearError: () => void;
}

/**
 * Custom hook for managing PayU payment state and operations
 *
 * Provides:
 * - Payment initiation with loading states
 * - Error handling
 * - PayU availability checking
 * - Clean API for components
 */
export const usePayUPayment = (
  options: UsePayUPaymentOptions = {}
): UsePayUPaymentReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initiatePayment = useCallback(async (
    bookingId: string,
    amount: number,
    accessToken: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      await initiatePayUPayment(
        bookingId,
        amount,
        accessToken,
        // Success callback
        (txnid) => {
          setLoading(false);
          options.onSuccess?.(txnid);
        },
        // Failure callback
        (errorMessage) => {
          setLoading(false);
          setError(errorMessage);
          options.onFailure?.(errorMessage);
        },
        // Cancel callback
        () => {
          setLoading(false);
          options.onCancel?.();
        }
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate payment';
      setLoading(false);
      setError(errorMessage);
      options.onFailure?.(errorMessage);
    }
  }, [options]);

  return {
    initiatePayment,
    loading,
    error,
    isPayUReady: isPayUAvailable(),
    clearError,
  };
};
