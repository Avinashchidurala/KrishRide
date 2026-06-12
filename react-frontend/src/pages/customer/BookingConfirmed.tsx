import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../app/hooks';
import PageContainer from '../../components/common/PageContainer';

export default function BookingConfirmed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const booking = location.state?.booking;

  useEffect(() => {
    if (!booking) {
      navigate('/customer/dashboard');
    }
  }, [booking, navigate]);

  if (!booking) {
    return null;
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Invalid Time';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Time';
      }
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckIcon sx={{ color: 'success.main', fontSize: 64, mb: 2, mx: 'auto', display: 'block' }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Booking Confirmed!
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Your ride has been booked successfully
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Booking ID: {booking.booking_number}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Confirmation sent via Email, WhatsApp, and SMS
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Pickup Location
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                { booking.ride?.start_city 
                  ? `${booking.ride?.start_city} (${booking.ride?.start_location})` 
                  : (booking.ride?.start_location)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Drop Location
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {booking.ride?.end_city 
                  ? `${booking.ride?.end_city} (${booking.ride?.end_location})` 
                  : (booking.ride?.end_location)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Date & Time
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {formatDate(booking.ride?.scheduled_time)} at {formatTime(booking.ride?.scheduled_time)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Passengers
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {booking.passengerCount} passenger(s)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Total Amount
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ₹{parseFloat(booking.total_fare || 0).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Payment Status
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                {booking.paymentStatus === 'success' ? 'Paid' : booking.paymentStatus}
              </Typography>
            </Grid>
          </Grid>

          {booking.utr_number && (
            <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                UTR Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {booking.utr_number}
              </Typography>
            </Paper>
          )}

          <Divider sx={{ my: 3 }} />

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Cancellation Policy:</strong> You can cancel your booking before the ride starts.
              Cancellation charges may apply.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.light',
                  borderColor: 'primary.main',
                }
              }}
              onClick={() => {
                // TODO: Download PDF invoice
                window.open(booking.invoice_url || '#', '_blank');
              }}
            >
              Download Invoice
            </Button>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/customer/dashboard')}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, boxShadow: 2, bgcolor: 'primary.light', border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            What's Next?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
            1. You'll receive a notification when the driver starts from their location
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
            2. Share the pickup OTP with the driver when you get picked up
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            3. Share the drop PIN with the driver when you reach your destination
          </Typography>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

