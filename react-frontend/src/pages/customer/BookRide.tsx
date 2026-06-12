import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme, 
  useMediaQuery,
   IconButton 
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  EventSeat as SeatIcon,
  ColorLens as ColorIcon,
  ConfirmationNumber as PlateIcon,
  Build as BuildIcon,
  PhotoCamera as PhotoIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { bookingsApi } from '../../services/bookingsApi';
import { uploadApi } from '../../services/uploadApi';
import PageContainer from '../../components/common/PageContainer';
import { getCityName } from '../../utils/locationHelpers';
import { initiateRazorpayPayment } from '../../utils/razorpayCheckout';

export default function BookRide() {

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  // Initialize loading state based on whether ride is pre-loaded
  const [loading, setLoading] = useState(!location.state?.ride);
  const [ride, setRide] = useState<any>(location.state?.ride || null);
  const [error, setError] = useState('');
  
  // Restore search context from location state if available
  const searchContext = location.state?.searchContext;

  console.log('BookRide searchContext:', searchContext);
  console.log('BookRide initial ride:', ride);

  const [bookingData, setBookingData] = useState({
    passengerCount: 1,
  });

  console.log('Current booking data:', bookingData);

  const [fareBreakdown, setFareBreakdown] = useState({
    baseFare: 0,
    platformFee: 0,
    totalFare: 0,
  });

  console.log('Current fare breakdown:', fareBreakdown);

  // Store initial fare to detect changes
  const [initialPricePerSeat, setInitialPricePerSeat] = useState<number | null>(null);
  const [fareChangeDialogOpen, setFareChangeDialogOpen] = useState(false);
  const [newFareBreakdown, setNewFareBreakdown] = useState(fareBreakdown);
  const [fullyBookedAfterLogin, setFullyBookedAfterLogin] = useState(false);
  const [isBookable, setIsBookable] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  console.log("newFareBreakdown:", newFareBreakdown);

  useEffect(() => {
    // Store initial price from search context if available
    if (searchContext?.initialPricePerSeat !== undefined) {
      setInitialPricePerSeat(searchContext.initialPricePerSeat);
    }
    
    // Always fetch ride details to ensure we have the latest data (validation)
    // Even if pre-loaded, refresh to check availability and status
    if (id) {
      loadRide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  console.log(initialPricePerSeat)

  useEffect(() => {
    if (ride) {
      calculateFare();
      // Update isBookable based on ride status and availability
      const availableSeats = ride.availableSeats ?? (ride.seats_available - (ride.seats_booked || 0));
      const scheduledTime = new Date(ride.scheduled_time);
      const isPast = scheduledTime < new Date();
      setIsBookable(ride.status === 'active' && availableSeats > 0 && !isPast);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData, ride, searchContext]);

  const loadRide = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await ridesApi.getRideDetails(id!);
      const rideData = result.ride;
      
      // Validate ride availability
      if (rideData.status !== 'active') {
        setError(`This ride is no longer available. Status: ${rideData.status}`);
        setIsBookable(false);
        setRide(null);
        return;
      }
      
      // Validate seat availability
      const availableSeats = rideData.seats_available ?? (rideData.seats_available - (rideData.seats_booked || 0));
      if (availableSeats <= 0) {
        // Check if this is after login (has search context) - show return to results message
        if (searchContext) {
          setFullyBookedAfterLogin(true);
        }
        setError('This ride is fully booked. No seats available.');
        setIsBookable(false);
        setRide(null);
        return;
      }
      
      // Check if ride is in the past
      const scheduledTime = new Date(rideData.scheduled_time);
      if (scheduledTime < new Date()) {
        setError('This ride has already departed. Please search for upcoming rides.');
        setIsBookable(false);
        setRide(null);
        return;
      }
      
      // Update ride first
      setRide({ ...rideData, availableSeats });
      
      // Validate ride is bookable
      setIsBookable(true);
      setError(''); // Clear any previous errors
      
      // Check if fare has changed (compare with initial price if stored)
      const currentPricePerSeat = Number(rideData.price_per_seat) || 0;
      const storedInitialPrice = initialPricePerSeat ?? searchContext?.initialPricePerSeat ?? null;
      
      if (storedInitialPrice !== null && storedInitialPrice !== currentPricePerSeat) {
        // Fare has changed - calculate new fare breakdown
        // Customer pays: price_per_seat + ₹10 platform fee per seat
        const newBaseFare = storedInitialPrice * bookingData.passengerCount;
        const newPlatformFee = 10 * bookingData.passengerCount; // ₹10 per seat (customer platform fee)
        const newTotalFare = newBaseFare + newPlatformFee; // Total = (price_per_seat + 10) * passengers
        
        setNewFareBreakdown({
          baseFare: newBaseFare,
          platformFee: newPlatformFee,
          totalFare: newTotalFare,
        });
        
        // Show fare change dialog
        setFareChangeDialogOpen(true);
      } else if (storedInitialPrice === null) {
        // First time loading - store initial price
        setInitialPricePerSeat(currentPricePerSeat);
      }
    } catch (err: any) {
        setError(err.message || 'Failed to load ride details');
      setRide(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = () => {
    if (!ride) return;

    const pricePerSeat = Number(initialPricePerSeat) || 0;
    
    // Customer pays: price_per_seat + ₹10 platform fee per seat
    // Driver receives: (price_per_seat - ₹20) per seat
    const baseFare = pricePerSeat * bookingData.passengerCount;
    const platformFee = 10 * bookingData.passengerCount; // ₹10 per seat (customer platform fee)
    const totalFare = baseFare + platformFee; // Total = (price_per_seat + 10) * passengers

    setFareBreakdown({
      baseFare,
      platformFee,
      totalFare,
    });
  };

  // Handle clicking on a photo filename to view with presigned URL
  const handlePhotoClick = async (photoUrl: string) => {
    try {
      setLoadingImage(true);
      // Extract S3 key from URL
      const s3Key = uploadApi.extractS3Key(photoUrl);
      if (!s3Key) {
        alert('Unable to extract photo key. Please try again.');
        return;
      }
      
      // Get presigned URL
      const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(photoUrl);
      setSelectedImage(presignedUrl);
    } catch (error: any) {
      console.error('Error loading photo:', error);
      alert(error.response?.data?.error || error.message || 'Failed to load photo');
    } finally {
      setLoadingImage(false);
    }
  };

  const handleBook = async () => {
    if (!ride) {
      setError('Ride details not available. Please refresh the page.');
      return;
    }

    // Validate seat availability again (double-check before booking)
    const availableSeats = ride.availableSeats ?? (ride.seats_available - (ride.seats_booked || 0));
    if (availableSeats <= 0) {
      setError('This ride is fully booked. No seats available.');
      // Refresh ride data
      loadRide();
      return;
    }

    if (bookingData.passengerCount > availableSeats) {
      setError(`Not enough seats available. Only ${availableSeats} seat(s) remaining.`);
      // Refresh ride data to get latest availability
      loadRide();
      return;
    }


    // Validate ride status again
    if (ride.status !== 'active') {
      setError(`This ride is no longer available. Status: ${ride.status}`);
      setIsBookable(false);
      loadRide();
      return;
    }
    
    if (!isBookable) {
      setError('This ride cannot be booked at this time.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare booking data
      const bookingPayload = {
        rideId: ride.id,
        passengerCount: bookingData.passengerCount,
        paymentMethod: 'razorpay',
        initialPricePerSeat: Number(initialPricePerSeat) || 20,
        startLatitude: searchContext.startLatitude,
        startLongitude: searchContext.startLongitude,
        endLatitude: searchContext.endLatitude,
        endLongitude: searchContext.endLongitude,
        pickupLocation: searchContext.pickupLocation,
        dropLocation: searchContext.dropLocation,
      };

      // Create pending booking - payment will be completed via Razorpay
      const result = await bookingsApi.createBooking(bookingPayload);

      // Update fare breakdown with backend response (more accurate)
      if (result.fareBreakdown) {
        setFareBreakdown({
          baseFare: Number(result.fareBreakdown.baseFare) || fareBreakdown.baseFare,
          platformFee: Number(result.fareBreakdown.platformFee) || fareBreakdown.platformFee,
          totalFare: Number(result.fareBreakdown.totalFare) || fareBreakdown.totalFare,
        });
      }

      // Get booking ID and total fare
      const bookingId = result.booking?.id || result.bookingId || result.id;
      const totalFareRaw = result.booking?.total_fare || result.fareBreakdown?.totalFare || fareBreakdown.totalFare;
      const totalFare = Number(totalFareRaw); // Convert Decimal/string to number

      console.log('Booking created:', { bookingId, totalFareRaw, totalFare, result });
      
      if (!bookingId || !totalFare || isNaN(totalFare) || totalFare <= 0) {
        console.error('Invalid booking response:', { bookingId, totalFareRaw, totalFare, result });
        throw new Error('Booking ID or valid amount not received from server');
      }

      // Get access token for payment
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Authentication required. Please login again.');
      }

      // Initiate Razorpay payment directly
      setInitiatingPayment(true);
      setError('');

      try {
        await initiateRazorpayPayment(
          bookingId,
          totalFare,
          accessToken,
          // Success callback
          (paymentId, orderId) => {
            console.log('Razorpay payment successful:', { paymentId, orderId });
            // Navigate to booking details page
            navigate(`/customer/booking/${bookingId}`, {
              state: { 
                paymentSuccess: true, 
                paymentId,
                orderId,
                message: 'Payment completed successfully!'
              },
            });
          },
          // Failure callback
          (errorMessage) => {
            setError(errorMessage || 'Payment failed. Please try again.');
            setInitiatingPayment(false);
          },
          // Cancel callback
          () => {
            setError('Payment was cancelled. Your booking is pending. You can complete payment from My Bookings.');
            setInitiatingPayment(false);
          }
        );
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate payment';
        setError(errorMessage);
        setInitiatingPayment(false);
        console.error('Payment initiation error:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ride) {
    return (
      <PageContainer maxWidth="lg" title="Book Ride">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  const handleReturnToSearch = () => {
    // Return to dashboard with search context restored
    navigate('/customer/dashboard', {
      state: {
        searchContext: searchContext,
      },
    });
  };

  const handleFareChangeConfirm = () => {
    // Update fare breakdown to new values
    setFareBreakdown(newFareBreakdown);
    // Update initial price to current price
    if (ride) {
      setInitialPricePerSeat(Number(searchContext.initialPricePerSeat) || 0);
    }
    
    setFareChangeDialogOpen(false);
  };

  const handleFareChangeCancel = () => {
    // User doesn't want to proceed with new fare - return to search
    handleReturnToSearch();
  };

  if (!ride && !loading) {
    return (
      <PageContainer maxWidth="lg" title="Book Ride">
        <Alert 
          severity={fullyBookedAfterLogin ? "warning" : "error"} 
          sx={{ mb: 3 }}
        >
          {fullyBookedAfterLogin 
            ? 'This ride became fully booked while you were logging in. Please select another ride.'
            : (error || 'Ride not found or no longer available')}
        </Alert>
        <Button
          variant="contained"
          onClick={handleReturnToSearch}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
        >
          {fullyBookedAfterLogin ? 'Return to Search Results' : 'Search for Other Rides'}
        </Button>
      </PageContainer>
    );
  }

  if (!ride) {
    return (
      <PageContainer maxWidth="lg" title="Book Ride">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }
  
  // Get available seats (use availableSeats if calculated, otherwise calculate)
  const availableSeats = ride.availableSeats ?? (ride.seats_available - (ride.seats_booked || 0));
  // resposnive
  const theme = useTheme(); 
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageContainer maxWidth="lg" title="Complete Your Booking" subtitle="Review your ride details and proceed to secure payment">

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Ride Details */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Ride Information */}
              <Card sx={{ borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.main', p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                    Route Details
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <LocationIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Pickup Location
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, color: 'text.primary' }}>
                       {ride.start_city || ride.start_location}
                        </Typography>
                          {ride.start_city && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {ride.start_location}
                            </Typography>
                          )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Pickup Address
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, color: 'text.primary' }}>
                          {ride?.start_location}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 3 }}>
                      <Box sx={{ width: 2, height: 20, bgcolor: 'divider', ml: 1.5 }} />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'error.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <LocationIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Drop Location
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, color: 'text.primary' }}>
                       {ride.end_city || ride.end_location}
                        </Typography>
                          {ride.end_city && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {ride.end_location}
                            </Typography>
                          )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Drop Address
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, color: 'text.primary' }}>
                          {ride?.end_location}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <EventIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Date
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {new Date(ride.scheduled_time).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <ScheduleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Time
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {new Date(ride.scheduled_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>

              {/* Driver Information */}
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PersonIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Driver Information
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: 'primary.main',
                        fontSize: 24,
                        fontWeight: 600
                      }}
                    >
                      {ride.driver?.user?.first_name?.[0]}{ride.driver?.user?.last_name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {ride.driver?.user?.first_name} {ride.driver?.user?.last_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Rating:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {ride.driver?.average_rating || 'N/A'} ⭐
                        </Typography>
                      </Box>
                      {ride.driver?.user?.mobile && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {/* {ride.driver.user.mobile} */}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              {ride.driver?.vehicles && ride.driver.vehicles.length > 0 && ride.vehicleId && (
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CarIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Vehicle Details
                      </Typography>
                    </Box>
                    {(() => {
                      const vehicle = ride.driver.vehicles.find((v: any) => v.id === ride.vehicleId) || ride.driver.vehicles[0];
                      
                      // Parse vehicle photos (JSON arrays)
                      const insidePhotos = vehicle.inside_photos 
                        ? (typeof vehicle.inside_photos === 'string' ? JSON.parse(vehicle.inside_photos) : vehicle.inside_photos)
                        : [];
                      const outsidePhotos = vehicle.outside_photos 
                        ? (typeof vehicle.outside_photos === 'string' ? JSON.parse(vehicle.outside_photos) : vehicle.outside_photos)
                        : [];
                      
                      // Extract filenames from S3 URLs
                      const extractFilename = (url: string): string => {
                        try {
                          // Extract filename from S3 URL (e.g., https://bucket.s3.region.amazonaws.com/vehicles/filename.jpg)
                          const urlParts = url.split('/');
                          return urlParts[urlParts.length - 1] || url;
                        } catch {
                          return url;
                        }
                      };
                      
                      const insidePhotoFilenames = Array.isArray(insidePhotos) 
                        ? insidePhotos.map(extractFilename)
                        : [];
                      const outsidePhotoFilenames = Array.isArray(outsidePhotos) 
                        ? outsidePhotos.map(extractFilename)
                        : [];
                      
                      // Store original URLs for presigned URL generation
                      const insidePhotoUrls = Array.isArray(insidePhotos) ? insidePhotos : [];
                      const outsidePhotoUrls = Array.isArray(outsidePhotos) ? outsidePhotos : [];
                      
                      return (
                        <>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <BuildIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.5, flexShrink: 0 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Model
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {vehicle.vehicle_make && vehicle.vehicle_model 
                                      ? `${vehicle.vehicle_make} ${vehicle.vehicle_model}` 
                                      : vehicle.vehicle_make || vehicle.vehicle_model || vehicle.model || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <ColorIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.5, flexShrink: 0 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Color
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {vehicle.vehicle_color || vehicle.color || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <PlateIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.5, flexShrink: 0 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Plate Number
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                    {vehicle.vehicle_plate_number || vehicle.plate_number || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                          
                          {/* Vehicle Photos - Show only filenames */}
                          {(insidePhotoFilenames.length > 0 || outsidePhotoFilenames.length > 0) && (
                            <Box sx={{ mt: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <PhotoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Vehicle Photos
                                </Typography>
                              </Box>
                              
                              {/* Outside Photos */}
                              {outsidePhotoFilenames.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                                    Outside Photos
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {outsidePhotoFilenames.map((filename: string, index: number) => (
                                      <Box
                                        key={index}
                                        onClick={() => handlePhotoClick(outsidePhotoUrls[index])}
                                        sx={{
                                          p: 1.5,
                                          bgcolor: 'grey.50',
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            bgcolor: 'grey.100',
                                            borderColor: 'primary.main',
                                            transform: 'translateX(4px)',
                                          },
                                        }}
                                      >
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontFamily: 'monospace', 
                                            color: 'text.secondary',
                                            '&:hover': {
                                              color: 'primary.main',
                                            },
                                          }}
                                        >
                                          {filename}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              
                              {/* Inside Photos */}
                              {insidePhotoFilenames.length > 0 && (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                                    Inside Photos
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {insidePhotoFilenames.map((filename: string, index: number) => (
                                      <Box
                                        key={index}
                                        onClick={() => handlePhotoClick(insidePhotoUrls[index])}
                                        sx={{
                                          p: 1.5,
                                          bgcolor: 'grey.50',
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            bgcolor: 'grey.100',
                                            borderColor: 'primary.main',
                                            transform: 'translateX(4px)',
                                          },
                                        }}
                                      >
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontFamily: 'monospace', 
                                            color: 'text.secondary',
                                            '&:hover': {
                                              color: 'primary.main',
                                            },
                                          }}
                                        >
                                          {filename}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Passenger Selection */}
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <SeatIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Passenger Details
                    </Typography>
                  </Box>
                  {isMobile?(
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <IconButton
                        disabled={bookingData.passengerCount <= 1 || !isBookable}
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            passengerCount: Math.max(1, bookingData.passengerCount - 1),
                          })
                        }
                      >
                        <RemoveIcon />
                      </IconButton>

                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {bookingData.passengerCount}
                      </Typography>

                      <IconButton
                        disabled={
                          bookingData.passengerCount >= availableSeats || !isBookable
                        }
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            passengerCount: Math.min(
                              bookingData.passengerCount + 1,
                              availableSeats
                            ),
                          })
                        }
                      >
                        <AddIcon />
                      </IconButton>
                  </Box>) :
                  (
                   <TextField
                    label="Number of Passengers"
                    type="number"
                    required
                    fullWidth
                    value={bookingData.passengerCount}
                    onChange={(e) =>{
                       const value = e.target.value

                        if (value === '') {
                            setBookingData({
                              ...bookingData,
                              passengerCount: '',
                            });
                            return;
                          }
                        const sanitized = value.replace(/^0+/, '');
                        const numericValue = Number(sanitized);  

                        if (numericValue > availableSeats) return;

                        setBookingData({
                          ...bookingData,
                          passengerCount: sanitized,
                        });

                      //  setBookingData({
                      //   ...bookingData,
                      //   passengerCount: Math.min(
                      //     parseInt(e.target.value) || 1,
                      //     availableSeats
                      //   ),
                      // })
                    }}
                    onBlur={() => {
                      if (!bookingData.passengerCount) {
                        setBookingData({
                          ...bookingData,
                          passengerCount: 1,
                        });
                      }
                    }}
                    inputProps={{ min: 1, max: availableSeats }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <SeatIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        </Box>
                      ),
                    }}
                    helperText={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {ride.seats_available - ride.seats_booked} seat(s) available
                        </Typography>
                      </Box>
                    }
                    error={bookingData.passengerCount > availableSeats}
                    disabled={!isBookable}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      } 
                    }}
                  
                  />
                  )}
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Column - Bill & Payment */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card 
              sx={{ 
                borderRadius: 3, 
                boxShadow: 3,
                position: 'sticky',
                top: 24,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ bgcolor: 'primary.main', p: 2.5, borderRadius: '12px 12px 0 0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  Payment Summary
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Base Fare
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      ₹{fareBreakdown.baseFare.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Platform Fee
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      ₹{fareBreakdown.platformFee.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      mt: 1
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                      ₹{fareBreakdown.totalFare.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {!isBookable && (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    {ride.status !== 'active' 
                      ? `This ride is ${ride.status}. It is no longer available for booking.`
                      : 'No seats available for this ride.'}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleBook}
                  disabled={loading || initiatingPayment || !isBookable || bookingData.passengerCount > availableSeats}
                  sx={{ 
                    textTransform: 'none',
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    }
                  }}
                  startIcon={(loading || initiatingPayment) ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                >
                  {initiatingPayment ? 'Opening Payment...' : loading ? 'Booking...' : isBookable ? `Book Ride - ₹${fareBreakdown.totalFare.toFixed(2)}` : 'Not Available'}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ✅ Payment will be completed automatically upon booking
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      {/* Fare Change Confirmation Dialog */}
      <Dialog open={fareChangeDialogOpen} onClose={handleFareChangeCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Fare Updated</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            The fare for this ride has changed. Please review the updated fare before proceeding.
          </DialogContentText>
          <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Previous Fare: ₹{ride.price_per_seat}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3 }}>
              Updated Fare: ₹{initialPricePerSeat}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Difference:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: newFareBreakdown.totalFare > fareBreakdown.totalFare ? 'error.main' : 'success.main'
                }}
              >
                {/* {ride.price_per_seat > initialPricePerSeat ?} */}
                {(initialPricePerSeat - ride.price_per_seat).toFixed(2)}₹
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleFareChangeCancel}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFareChangeConfirm}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Continue with Updated Fare
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Viewer Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', minHeight: '400px' }}>
          {loadingImage ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          ) : selectedImage ? (
            <img
              src={selectedImage}
              alt="Vehicle photo"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
              }}
            />
          ) : null}
          <Button
            onClick={() => setSelectedImage(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

