import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { PayUButton } from './PayUButton';
import { usePayUPayment } from '../../hooks/usePayUPayment';

/**
 * Example component demonstrating PayU payment integration
 *
 * This shows how to:
 * - Use PayUButton component
 * - Use usePayUPayment hook
 * - Handle different payment states
 * - Provide proper UX feedback
 */
export const PayUPaymentExample: React.FC = () => {
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failed' | 'cancelled' | null;
    txnid?: string;
    message?: string;
  }>({ status: null });

  // Get access token (in real app, this would come from auth context/store)
  const accessToken = localStorage.getItem('accessToken') || '';

  // Example booking data
  const bookingId = 'BK123456789';
  const amount = 150.00;

  // Using the hook approach
  const {
    initiatePayment: hookInitiatePayment,
    loading: hookLoading,
    error: hookError,
    clearError: clearHookError,
  } = usePayUPayment({
    onSuccess: (txnid) => {
      setPaymentResult({
        status: 'success',
        txnid,
        message: 'Payment completed successfully!',
      });
    },
    onFailure: (error) => {
      setPaymentResult({
        status: 'failed',
        message: error,
      });
    },
    onCancel: () => {
      setPaymentResult({
        status: 'cancelled',
        message: 'Payment was cancelled.',
      });
    },
  });

  const handleComponentSuccess = (txnid: string) => {
    setPaymentResult({
      status: 'success',
      txnid,
      message: 'Payment completed successfully via component!',
    });
  };

  const handleComponentFailure = (error: string) => {
    setPaymentResult({
      status: 'failed',
      message: error,
    });
  };

  const handleComponentCancel = () => {
    setPaymentResult({
      status: 'cancelled',
      message: 'Payment was cancelled via component.',
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        PayU Payment Integration Example
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        This example demonstrates PayU checkout opening as an in-page popup/modal
      </Typography>

      {/* Payment Result Display */}
      {paymentResult.status && (
        <Alert
          severity={
            paymentResult.status === 'success' ? 'success' :
            paymentResult.status === 'failed' ? 'error' : 'warning'
          }
          icon={
            paymentResult.status === 'success' ? <SuccessIcon /> :
            paymentResult.status === 'failed' ? <ErrorIcon /> : <CancelIcon />
          }
          sx={{ mb: 4, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Payment {paymentResult.status === 'success' ? 'Successful' :
                     paymentResult.status === 'failed' ? 'Failed' : 'Cancelled'}
          </Typography>
          {paymentResult.message && (
            <Typography variant="body2">{paymentResult.message}</Typography>
          )}
          {paymentResult.txnid && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Transaction ID: {paymentResult.txnid}
            </Typography>
          )}
        </Alert>
      )}

      {/* Hook Error Display */}
      {hookError && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={clearHookError}>
          {hookError}
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Method 1: Using PayUButton Component */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Method 1: PayUButton Component
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Simple drop-in component with built-in error handling and loading states
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <PayUButton
                bookingId={bookingId}
                amount={amount}
                accessToken={accessToken}
                onSuccess={handleComponentSuccess}
                onFailure={handleComponentFailure}
                onCancel={handleComponentCancel}
                variant="contained"
                size="large"
                buttonText={`Pay ₹${amount.toFixed(2)} with PayU Button`}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              <strong>Features:</strong> Loading states, error handling, success callbacks, disabled state management
            </Typography>
          </CardContent>
        </Card>

        {/* Method 2: Using usePayUPayment Hook */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Method 2: usePayUPayment Hook
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Custom hook for more control over payment flow and UI
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <PayUButton
                bookingId={bookingId}
                amount={amount}
                accessToken={accessToken}
                onSuccess={handleComponentSuccess}
                onFailure={handleComponentFailure}
                onCancel={handleComponentCancel}
                disabled={hookLoading}
                variant="outlined"
                buttonText={hookLoading ? 'Processing...' : `Pay ₹${amount.toFixed(2)} with Hook`}
              />
            </Box>

            {/* Custom UI with hook data */}
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Chip
                  label={hookLoading ? 'Processing' : 'Ready'}
                  color={hookLoading ? 'warning' : 'success'}
                  size="small"
                />
                <Chip
                  label="PayU Available"
                  color="info"
                  size="small"
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              <strong>Features:</strong> State management, loading indicators, error states, PayU availability checking
            </Typography>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              PayU checkout opens as an in-page popup/modal without redirecting to a new page:
            </Typography>

            <Stack spacing={1}>
              <Typography variant="body2" component="div">
                <strong>1. Script Loading:</strong> Dynamically loads PayU checkout script once
              </Typography>
              <Typography variant="body2" component="div">
                <strong>2. Payment Creation:</strong> Backend generates hash and PayU config
              </Typography>
              <Typography variant="body2" component="div">
                <strong>3. Popup Opening:</strong> Uses <code>window.PayUCheckout.open(config)</code>
              </Typography>
              <Typography variant="body2" component="div">
                <strong>4. Event Handling:</strong> Handles success, failure, and cancel callbacks
              </Typography>
              <Typography variant="body2" component="div">
                <strong>5. Verification:</strong> Backend verifies payment before confirming
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default PayUPaymentExample;
