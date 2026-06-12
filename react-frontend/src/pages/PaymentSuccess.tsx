import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { paymentApi } from '../services/paymentApi';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bookingId = searchParams.get('bookingId');
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'success' && bookingId) {
      // Payment successful
      setLoading(false);
    } else {
      setError('Payment verification failed');
      setLoading(false);
    }
  }, [status, bookingId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isSuccess = status === 'success';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {isSuccess ? (
            <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2, mx: 'auto', display: 'block' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2, mx: 'auto', display: 'block' }} />
          )}
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {isSuccess
              ? 'Your payment has been processed successfully'
              : 'Your payment could not be processed'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isSuccess && (
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your booking has been confirmed. You will receive a confirmation email and SMS shortly.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/customer/dashboard')}
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                >
                  Go to Dashboard
                </Button>
                {bookingId && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/customer/my-bookings`)}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                  >
                    View Booking
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {!isSuccess && (
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your payment could not be processed. Please try again or contact support if the issue persists.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/customer/dashboard')}
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

