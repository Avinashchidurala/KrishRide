import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Payment as PaymentIcon, Refresh as RefreshIcon, BugReport as DebugIcon } from '@mui/icons-material';
import { initiatePayUPayment, debugPayUStatus } from '../../utils/payuCheckout';
import { runPayUDiagnostic } from '../../utils/payuDebug';

interface PayUButtonProps {
  bookingId: string;
  amount: number;
  accessToken: string;
  onSuccess: (txnid: string) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children?: React.ReactNode;
  buttonText?: string;
}

/**
 * PayU Payment Button Component
 *
 * Handles the complete PayU payment flow:
 * - Loads PayU script dynamically
 * - Opens PayU checkout as in-page popup
 * - Handles success/failure/cancel states
 * - Provides proper UX feedback
 */
export const PayUButton: React.FC<PayUButtonProps> = ({
  bookingId,
  amount,
  accessToken,
  onSuccess,
  onFailure,
  onCancel,
  disabled = false,
  variant = 'contained',
  size = 'large',
  fullWidth = false,
  children,
  buttonText,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handlePayment = async () => {
    if (!bookingId || !amount || !accessToken) {
      setError('Missing required payment information');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Debug PayU status before attempting payment
      debugPayUStatus();

      await initiatePayUPayment(
        bookingId,
        amount,
        accessToken,
        // Success callback
        (txnid) => {
          console.log('PayU payment successful:', txnid);
          setLoading(false);
          setRetryCount(0); // Reset retry count on success
          onSuccess(txnid);
        },
        // Failure callback
        (errorMessage) => {
          console.error('PayU payment failed:', errorMessage);
          setLoading(false);
          setError(errorMessage);
          onFailure?.(errorMessage);
        },
        // Cancel callback
        () => {
          console.log('PayU payment cancelled');
          setLoading(false);
          onCancel?.();
        }
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate payment';
      console.error('PayU payment initiation error:', err);
      setLoading(false);
      setError(errorMessage);
      onFailure?.(errorMessage);
    }
  };

  const handleRetry = () => {
    if (retryCount >= 2) {
      setError('Maximum retry attempts reached. Please contact support or try again later.');
      return;
    }
    setRetryCount(prev => prev + 1);
    setError(null);
    handlePayment();
  };

  const displayText = buttonText || `Pay ₹${amount.toFixed(2)} with PayU`;
  const isDisabled = disabled || loading;

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {retryCount < 2 && (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                  disabled={loading}
                >
                  Retry
                </Button>
              )}
              <Button
                color="inherit"
                size="small"
                startIcon={<DebugIcon />}
                onClick={() => runPayUDiagnostic()}
              >
                Debug
              </Button>
            </Box>
          }
          onClose={() => setError(null)}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Payment Error
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          {retryCount > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Retry attempts: {retryCount}/3
            </Typography>
          )}
        </Alert>
      )}

      {/* Payment Button */}
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handlePayment}
        disabled={isDisabled}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <PaymentIcon />
          )
        }
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          py: 1.5,
          fontWeight: 600,
          fontSize: '1rem',
          minHeight: 48,
          background: variant === 'contained' ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' : undefined,
          '&:hover': {
            background: variant === 'contained' ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)' : undefined,
          },
          '&.Mui-disabled': {
            background: variant === 'contained' ? '#e0e0e0' : undefined,
          },
        }}
      >
                {loading ? (
                  retryCount > 0 ? `Retrying PayU... (${retryCount}/3)` : 'Opening PayU...'
                ) : (
                  children || displayText
                )}
      </Button>

      {/* Loading Indicator Description */}
      {loading && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block', textAlign: 'center' }}
        >
          Please wait while we open PayU checkout...
        </Typography>
      )}
    </Box>
  );
};

export default PayUButton;
