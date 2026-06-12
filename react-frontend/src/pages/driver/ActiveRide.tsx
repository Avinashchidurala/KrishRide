import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { bookingsApi } from '../../services/bookingsApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';
import MapComponent from '../../components/maps/MapComponent';
import { getErrorMessage } from '../../utils/errorHandler';

export default function ActiveRide() {
  const navigate = useNavigate();
  const { rideId } = useParams<{ rideId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ride, setRide] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [otpInputs, setOtpInputs] = useState<{ [key: string]: string }>({});
  const [pinInputs, setPinInputs] = useState<{ [key: string]: string }>({});
  const [verifying, setVerifying] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (rideId) {
      loadRide();
      startLocationTracking();
      // Refresh ride data every 10 seconds
      const interval = setInterval(() => {
        loadRide();
      }, 10000);
      return () => {
        clearInterval(interval);
        stopLocationTracking();
      };
    }
  }, [rideId]);

  const watchIdRef = useRef<number | null>(null);

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      // Watch position changes for continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const loadRide = async () => {
    if (!rideId) return;
    try {
      setLoading(true);
      setError('');
      const result = await ridesApi.getRideDetails(rideId);
      setRide(result.ride);
      
      // Get bookings for this ride
      const myRides = await ridesApi.getMyRides();
      const currentRide = myRides.rides?.find((r: any) => r.id === rideId);
      if (currentRide?.bookings) {
        // Filter only confirmed, started, and completed bookings (exclude cancelled)
        const confirmedBookings = currentRide.bookings.filter(
          (b: any) => b.status === 'confirmed' || b.status === 'started' || b.status === 'completed'
        );
        setBookings(confirmedBookings);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load ride');
      console.error('Error loading ride:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPickupOTP = async (bookingId: string) => {
    const otp = otpInputs[bookingId];
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifying({ ...verifying, [bookingId]: true });
      await bookingsApi.verifyPickupOTP(bookingId, otp);
      setOtpInputs({ ...otpInputs, [bookingId]: '' });
      await loadRide();
      alert('Pickup verified successfully. Ride started.');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = getErrorMessage(err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setVerifying({ ...verifying, [bookingId]: false });
    }
  };

  const handleVerifyDropPIN = async (bookingId: string) => {
    const pin = pinInputs[bookingId];
    if (!pin || pin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setVerifying({ ...verifying, [`pin-${bookingId}`]: true });
      await bookingsApi.verifyDropPIN(bookingId, pin);
      setPinInputs({ ...pinInputs, [bookingId]: '' });
      await loadRide();
      alert('Drop verified successfully. Ride completed.');
    } catch (err: any) {
      console.error('PIN verification error:', err);
      const errorMessage = getErrorMessage(err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setVerifying({ ...verifying, [`pin-${bookingId}`]: false });
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg" title="Active Ride">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!ride) {
    return (
      <PageContainer maxWidth="lg" title="Active Ride">
        <Alert severity="error">Ride not found</Alert>
        <Button onClick={() => navigate('/driver/my-rides')} sx={{ mt: 2 }}>
          Back to My Rides
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" title="Active Ride">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Map */}
        <Grid size={{ xs: 12, md: 7 }}>
          <StandardCard>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Current Location
            </Typography>
            {currentLocation ? (
              <MapComponent
                center={currentLocation}
                zoom={15}
                height="400px"
                showCurrentLocation={true}
                onLocationChange={(location) => {
                  setCurrentLocation(location);
                }}
                markers={[
                  {
                    position: currentLocation,
                    label: 'Your Location',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  },
                  {
                    position: {
                      lat: parseFloat(ride.start_latitude || 0),
                      lng: parseFloat(ride.start_longitude || 0),
                    },
                    label: 'Pickup',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  },
                  {
                    position: {
                      lat: parseFloat(ride.end_latitude || 0),
                      lng: parseFloat(ride.end_longitude || 0),
                    },
                    label: 'Drop',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  },
                ]}
              />
            ) : (
              <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress />
                <Typography>Requesting location permission...</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', px: 2 }}>
                  Please allow location access to see your current position on the map
                </Typography>
              </Box>
            )}
          </StandardCard>

          {/* Ride Details */}
          <StandardCard sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Ride Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  From
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {ride.start_location}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {ride.end_location}
                </Typography>
              </Box>
              {ride.scheduled_time && (
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Scheduled Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(ride.scheduled_time).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </StandardCard>
        </Grid>

        {/* Right Column - Bookings */}
        <Grid size={{ xs: 12, md: 5 }}>
          <StandardCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Bookings ({bookings.length})
              </Typography>
              {ride.status === 'started' && bookings.length > 0 && (() => {
                // Only check bookings that are started (have been picked up)
                const startedBookings = bookings.filter((b) => b.status === 'started' || b.status === 'completed');
                const allDropVerified = startedBookings.length > 0 && startedBookings.every((b) => b.drop_verified === true);
                const verifiedCount = startedBookings.filter((b) => b.drop_verified).length;
                const totalStarted = startedBookings.length;
                
                return allDropVerified && totalStarted > 0 ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to end this ride? All bookings will be marked as completed.')) {
                        try {
                          await ridesApi.endRide(rideId!);
                          await loadRide();
                          alert('Ride completed successfully!');
                          navigate('/driver/my-rides');
                        } catch (err: any) {
                          alert(err.response?.data?.error || err.message || 'Failed to end ride');
                        }
                      }
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    End Ride
                  </Button>
                ) : totalStarted > 0 ? (
                  <Chip
                    label={`${verifiedCount}/${totalStarted} drop verified`}
                    color="warning"
                    size="small"
                  />
                ) : null;
              })()}
            </Box>
            {bookings.length === 0 ? (
              <Alert severity="info">No bookings for this ride</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {bookings.map((booking) => (
                  <Card key={booking.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {booking.customer?.user?.first_name} {booking.customer?.user?.last_name}
                        </Typography>
                        <Chip
                          label={booking.status.toUpperCase()}
                          color={
                            booking.status === 'completed'
                              ? 'success'
                              : booking.status === 'started'
                              ? 'primary'
                              : 'default'
                          }
                          size="small"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Passengers: {booking.passengerCount}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Booking: {booking.booking_number}
                        </Typography>
                      </Box>

                      {/* Pickup OTP Verification */}
                      {!booking.pickup_verified && booking.status === 'confirmed' && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Verify Pickup OTP
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Enter 6-digit OTP"
                              value={otpInputs[booking.id] || ''}
                              onChange={(e) =>
                                setOtpInputs({ ...otpInputs, [booking.id]: e.target.value.replace(/\D/g, '').slice(0, 6) })
                              }
                              inputProps={{ maxLength: 6 }}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleVerifyPickupOTP(booking.id)}
                              disabled={!otpInputs[booking.id] || otpInputs[booking.id].length !== 6 || verifying[booking.id]}
                            >
                              {verifying[booking.id] ? <CircularProgress size={20} /> : 'Verify'}
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* Drop PIN Verification */}
                      {booking.pickup_verified && !booking.drop_verified && booking.status === 'started' && (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Verify Drop PIN
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Enter 4-digit PIN"
                              value={pinInputs[booking.id] || ''}
                              onChange={(e) =>
                                setPinInputs({ ...pinInputs, [booking.id]: e.target.value.replace(/\D/g, '').slice(0, 4) })
                              }
                              inputProps={{ maxLength: 4 }}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              onClick={() => handleVerifyDropPIN(booking.id)}
                              disabled={!pinInputs[booking.id] || pinInputs[booking.id].length !== 4 || verifying[`pin-${booking.id}`]}
                            >
                              {verifying[`pin-${booking.id}`] ? <CircularProgress size={20} /> : 'Verify'}
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* Status Indicators */}
                      {booking.pickup_verified && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                          <CheckIcon fontSize="small" />
                          <Typography variant="body2">Pickup verified</Typography>
                        </Box>
                      )}
                      {booking.drop_verified && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                          <CheckIcon fontSize="small" />
                          <Typography variant="body2">Drop verified - Ride completed</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </StandardCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

