import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error') || 'Payment failed';
  const bookingId = searchParams.get('bookingId');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2, mx: 'auto', display: 'block' }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Payment Failed
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Your payment could not be processed
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your payment could not be processed. Please try again or contact support if the issue persists.
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
                  View Bookings
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

