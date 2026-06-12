import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { bookingsApi } from '../../services/bookingsApi';
import RouteMap from '../../components/maps/RouteMap';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await bookingsApi.getBookingDetails(id!);
      setBooking(result.booking);
      // Debug: Log booking data to see what fields are available
      console.log('Booking data:', {
        ride: result.booking?.ride,
        hasStartLocation: !!result.booking?.ride?.start_location,
        hasEndLocation: !!result.booking?.ride?.end_location,
        hasStartCoords: !!(result.booking?.ride?.start_latitude && result.booking?.ride?.start_longitude),
        hasEndCoords: !!(result.booking?.ride?.end_latitude && result.booking?.ride?.end_longitude),
        startLatitude: result.booking?.ride?.start_latitude,
        startLongitude: result.booking?.ride?.start_longitude,
        endLatitude: result.booking?.ride?.end_latitude,
        endLongitude: result.booking?.ride?.end_longitude,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg" title="Booking Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error || !booking) {
    return (
      <PageContainer maxWidth="lg" title="Booking Details">
        <Alert severity="error">{error || 'Booking not found'}</Alert>
      </PageContainer>
    );
  }

  const isActive = booking.status === 'confirmed' || booking.status === 'started';

  return (
    <PageContainer maxWidth="lg" title="Booking Details" showBackButton onBack={() => navigate('/customer/my-bookings')}>
      <StandardCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              {booking.ride?.start_city 
                ? `${booking.ride?.start_city} (${booking.ride?.start_location})` 
                : ( booking.ride?.start_location)} 
              → 
              {booking.ride?.end_city 
                ? `${booking.ride?.end_city} (${booking.ride?.end_location})` 
                : (booking.ride?.end_location)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Booking ID: {booking.booking_number}
            </Typography>
          </Box>
          <Chip
            label={booking.status}
            color={
              booking.status === 'completed'
                ? 'success'
                : booking.status === 'cancelled'
                ? 'error'
                : 'primary'
            }
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(booking.ride?.scheduled_time).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Time
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(booking.ride?.scheduled_time).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Passengers
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {booking.passengerCount}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Total Amount
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ₹{typeof booking.total_fare === 'number' ? booking.total_fare.toFixed(2) : parseFloat(booking.total_fare || '0').toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </StandardCard>

      <StandardCard>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Route Map
        </Typography>
            <RouteMap
              startLocation={booking.pickup_location || booking.ride?.start_location}
              endLocation={booking.drop_location || booking.ride?.end_location}
              startCoords={
                (() => {
                  const lat = booking.pickup_latitude || booking.ride?.start_latitude;
                  const lng = booking.pickup_longitude || booking.ride?.start_longitude;
                  if (lat != null && lng != null) {
                    const latNum = typeof lat === 'number' ? lat : parseFloat(String(lat));
                    const lngNum = typeof lng === 'number' ? lng : parseFloat(String(lng));
                    if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
                      return { lat: latNum, lng: lngNum };
                    }
                  }
                  return undefined;
                })()
              }
              endCoords={
                (() => {
                  const lat = booking.drop_latitude || booking.ride?.end_latitude;
                  const lng = booking.drop_longitude || booking.ride?.end_longitude;
                  if (lat != null && lng != null) {
                    const latNum = typeof lat === 'number' ? lat : parseFloat(String(lat));
                    const lngNum = typeof lng === 'number' ? lng : parseFloat(String(lng));
                    if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
                      return { lat: latNum, lng: lngNum };
                    }
                  }
                  return undefined;
                })()
              }
              height="500px"
            />
      </StandardCard>
    </PageContainer>
  );
}

