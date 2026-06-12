import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { bookingsApi } from '../../services/bookingsApi';
import { useAppSelector } from '../../app/hooks';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';
import { getErrorMessage } from '../../utils/errorHandler';

export default function DriverMyBookings() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled'>('all');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const rides = await ridesApi.getMyRides();
      
      // Get all bookings from rides
      // IMPORTANT: Only show bookings that are confirmed after payment
      // Drivers should not see pending bookings - only confirmed bookings after customer payment
      const allBookings: any[] = [];
      rides.rides?.forEach((ride: any) => {
        if (ride.bookings) {
          ride.bookings.forEach((booking: any) => {
            // Only include bookings that are confirmed (payment completed)
            // Exclude pending bookings that haven't been paid yet
            if (booking.paymentStatus === 'success' && booking.status === 'confirmed') {
              allBookings.push(booking);
            } else if (booking.status === 'started' || booking.status === 'completed') {
              // Include started and completed bookings regardless of payment status check
              allBookings.push(booking);
            }
          });
        }
      });

      let filtered = allBookings;
      if (filter !== 'all') {
        filtered = allBookings.filter((b: any) => b.status === filter);
      }

      setBookings(filtered);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to load bookings');
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed accept/reject functionality
  // Bookings are automatically confirmed after customer payment
  // Drivers only see confirmed bookings (after payment is completed)

  const handleVerifyPickupOTP = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await bookingsApi.verifyPickupOTP(selectedBooking.id, otp);
      setOtpDialogOpen(false);
      setOtp('');
      await loadBookings();
      alert('Pickup verified successfully. Ride started.');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = getErrorMessage(error);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleVerifyDropPIN = async () => {
    if (!pin || pin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      await bookingsApi.verifyDropPIN(selectedBooking.id, pin);
      setPinDialogOpen(false);
      setPin('');
      await loadBookings();
      alert('Drop verified successfully. Ride completed.');
    } catch (error: any) {
      console.error('PIN verification error:', error);
      const errorMessage = getErrorMessage(error);
      alert(`Error: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'started':
        return 'info';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <PageContainer maxWidth="lg" title="My Bookings">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter Tabs */}
      <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
        <Tabs
          value={filter}
          onChange={(_, newValue) => setFilter(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" value="all" sx={{ textTransform: 'none' }} />
          <Tab label="Confirmed" value="confirmed" sx={{ textTransform: 'none' }} />
          <Tab label="Started" value="started" sx={{ textTransform: 'none' }} />
          <Tab label="Completed" value="completed" sx={{ textTransform: 'none' }} />
          <Tab label="Cancelled" value="cancelled" sx={{ textTransform: 'none' }} />
        </Tabs>
      </Card>

      {/* Bookings List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : bookings.length === 0 ? (
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
              No bookings found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} key={booking.id}>
              <StandardCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {booking.ride?.start_location} → {booking.ride?.end_location}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Booking ID: {booking.booking_number}
                    </Typography>
                  </Box>
                  <Chip
                    label={booking.status}
                    color={getStatusColor(booking.status) as any}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(booking.ride?.scheduled_time)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {booking.passengerCount} passenger(s)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Customer: {booking.customer?.user?.first_name} {booking.customer?.user?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ₹{parseFloat(booking.total_fare || 0).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                  {/* Accept/Reject buttons removed - bookings are automatically confirmed after payment */}

                  {booking.status === 'confirmed' && !booking.pickup_verified && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setOtpDialogOpen(true);
                      }}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Verify Pickup OTP
                    </Button>
                  )}

                  {booking.status === 'started' && !booking.drop_verified && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setPinDialogOpen(true);
                      }}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Verify Drop PIN
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhoneIcon />}
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
                      // TODO: Call masked number
                      window.location.href = `tel:${booking.masked_driver_phone || booking.customer?.user?.mobile}`;
                    }}
                  >
                    Contact
                  </Button>
                </Box>
              </StandardCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pickup OTP Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)}>
        <DialogTitle>Verify Pickup OTP</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Enter the OTP provided by the customer
          </DialogContentText>
          <TextField
            label="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
            inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyPickupOTP}
            disabled={otp.length !== 6}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drop PIN Dialog */}
      <Dialog open={pinDialogOpen} onClose={() => setPinDialogOpen(false)}>
        <DialogTitle>Verify Drop PIN</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Enter the constant PIN provided by the customer
          </DialogContentText>
          <TextField
            label="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            fullWidth
            inputProps={{ maxLength: 4, style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyDropPIN}
            disabled={pin.length !== 4}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

