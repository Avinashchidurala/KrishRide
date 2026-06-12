import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { bookingsApi } from '../../services/bookingsApi';
import LiveTrackingMap from '../../components/maps/LiveTrackingMap';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function LiveTracking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
      getCustomerLocation();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookings = await bookingsApi.getMyBookings();
      const found = bookings.bookings?.find((b: any) => b.id === bookingId);
      if (found) {
        setBooking(found);
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg" title="Live Tracking">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error || !booking) {
    return (
      <PageContainer maxWidth="lg" title="Live Tracking">
        <Alert severity="error" sx={{ mb: 3 }}>{error || 'Booking not found'}</Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/customer/my-bookings')}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Back to Bookings
        </Button>
      </PageContainer>
    );
  }

  const isActive = booking.status === 'confirmed' || booking.status === 'started';

  if (!isActive) {
    return (
      <PageContainer maxWidth="lg" title="Live Tracking">
        <Alert severity="warning" sx={{ mb: 3 }}>
          Live tracking is only available for active bookings (confirmed or started).
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate(`/customer/booking/${bookingId}`)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          View Booking Details
        </Button>
      </PageContainer>
    );
  }

  const driverLocation =
    booking.ride?.driver?.current_latitude && booking.ride?.driver?.current_longitude
      ? {
          lat: parseFloat(booking.ride.driver.current_latitude),
          lng: parseFloat(booking.ride.driver.current_longitude),
        }
      : undefined;

  return (
    <PageContainer maxWidth="lg" title="Live Tracking" showBackButton onBack={() => navigate(`/customer/booking/${bookingId}`)}>
      <StandardCard>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {booking.ride?.start_location} → {booking.ride?.end_location}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Booking ID: {booking.booking_number}
          </Typography>
        </Box>
      </StandardCard>

      <Paper sx={{ borderRadius: 2, boxShadow: 2, height: '600px', mb: 3 }}>
        <Box sx={{ p: 3, height: '100%' }}>
          <LiveTrackingMap
            bookingId={booking.id}
            driverLocation={driverLocation}
            customerLocation={customerLocation || undefined}
            pickupLocation={
              booking.ride?.start_latitude && booking.ride?.start_longitude
                ? {
                    lat: parseFloat(booking.ride.start_latitude),
                    lng: parseFloat(booking.ride.start_longitude),
                  }
                : undefined
            }
            dropLocation={
              booking.ride?.end_latitude && booking.ride?.end_longitude
                ? {
                    lat: parseFloat(booking.ride.end_latitude),
                    lng: parseFloat(booking.ride.end_longitude),
                  }
                : undefined
            }
            routePolyline={booking.ride?.route_polyline || undefined}
            height="100%"
          />
        </Box>
      </Paper>

      <StandardCard>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Booking Information
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CarIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Driver
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {booking.ride?.driver?.user?.first_name} {booking.ride?.driver?.user?.last_name}
                </Typography>
                {booking.ride?.driver?.user?.mobile && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {booking.ride.driver.user.mobile}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocationIcon sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Status
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {booking.status}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate(`/customer/booking/${bookingId}`)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          View Full Booking Details
        </Button>
      </StandardCard>
    </PageContainer>
  );
}

