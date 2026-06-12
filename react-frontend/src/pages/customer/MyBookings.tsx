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
  Alert,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Badge,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  GpsFixed as GpsFixedIcon,
  Payment as PaymentIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  CurrencyRupee as RupeeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { bookingsApi } from '../../services/bookingsApi';
import { useAppSelector } from '../../app/hooks';
import PageContainer from '../../components/common/PageContainer';
import { getCityName } from '../../utils/locationHelpers';
import { RatingForm } from '../../components/RatingForm';
import { Star as StarIcon } from '@mui/icons-material';

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled'>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any>(null);

  const getRefundMessage = (booking: any) => {
  if (booking.status !== 'cancelled') return null;

  switch (booking.paymentStatus) {
    case 'refund_pending':
      return '⏳ Refund is pending. Amount will be credited back.';
    case 'refund_initiated':
      return '🔄 Refund initiated. Amount will be credited back within 5-7 business days.';
    case 'refunded':
      return '✅ Refund completed. Amount has been credited back.';
    case 'failed':
      return '❌ Payment failed. No amount was debited.';
    default:
      return null;
  }
};

  useEffect(() => {
    loadBookings();
  }, [filter]);

  // Filter bookings client-side when search query changes
  useEffect(() => {
    let filtered = allBookings;

    if (filter !== 'all') {
      filtered = filtered.filter((b: any) => b.status === filter);
    }

    if (searchQuery) {
      filtered = filtered.filter((b: any) => 
        b.booking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.ride?.start_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.ride?.end_location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setBookings(filtered);
  }, [searchQuery, filter, allBookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await bookingsApi.getMyBookings();
      const allBookingsData = result.bookings || [];
      setAllBookings(allBookingsData);

      let filtered = allBookingsData;

      if (filter !== 'all') {
        filtered = filtered.filter((b: any) => b.status === filter);
      }

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter((b: any) => 
          b.booking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.ride?.start_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.ride?.end_location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setBookings(filtered);
    } catch (error: any) {
      setError(error.message || 'Failed to load bookings');
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('Bookings:', bookings);

  const getFilterCount = (status: string) => {
    if (status === 'all') return allBookings.length;
    return allBookings.filter((b: any) => b.status === status).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'started':
        return 'info';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckIcon />;
      case 'cancelled':
        return <CancelIcon />;
      default:
        return null;
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

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Time';
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      setError('');
      setSuccessMessage('');

      const result = await bookingsApi.cancelBooking(selectedBooking.id);
      
      setSuccessMessage(
        result.refunded 
          ? `Booking cancelled successfully. Amount refunded to your wallet.`
          : `Booking cancelled successfully.`
      );
      
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      
      // Reload bookings to reflect the cancellation
      await loadBookings();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    } finally {
      setCancelling(false);
    }
  };
  // responsive tabs
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageContainer maxWidth="lg" title="My Bookings" subtitle="View and manage all your ride bookings">

        {/* Enhanced Search Section */}
        <Card 
          elevation={2}
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <TextField
              fullWidth
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchQuery('');
                      loadBookings();
                    }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Enhanced Filter Tabs */}
        {/* MOBILE: Dropdown filter instead of tabs */}
          {isMobile && (
            <Card
              elevation={2}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Filter Bookings"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  {['all', 'pending', 'confirmed', 'started', 'completed', 'cancelled'].map(
                    (status) => (
                      <MenuItem key={status} value={status}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <Typography sx={{ textTransform: 'capitalize' }}>
                            {status}
                          </Typography>
                          <Chip
                            size="small"
                            label={getFilterCount(status)}
                            color={getStatusColor(status) as any}
                          />
                        </Box>
                      </MenuItem>
                    )
                  )}
                </TextField>
              </CardContent>
            </Card>
          )}
        {!isMobile && (
        <Card 
          elevation={2}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={filter}
            onChange={(_, newValue) => setFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 72,
                fontSize: '0.95rem',
                px: 3,
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={getFilterCount('all')} color="primary" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <CarIcon />
                    <span>All</span>
                  </Box>
                </Badge>
              }
              value="all"
            />
            <Tab 
              label={
                <Badge badgeContent={getFilterCount('pending')} color="warning" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <TimeIcon />
                    <span>Pending</span>
                  </Box>
                </Badge>
              }
              value="pending"
            />
            <Tab 
              label={
                <Badge badgeContent={getFilterCount('confirmed')} color="success" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <CheckIcon />
                    <span>Confirmed</span>
                  </Box>
                </Badge>
              }
              value="confirmed"
            />
            <Tab 
              label={
                <Badge badgeContent={getFilterCount('started')} color="info" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <GpsFixedIcon />
                    <span>Started</span>
                  </Box>
                </Badge>
              }
              value="started"
            />
            <Tab 
              label={
                <Badge badgeContent={getFilterCount('completed')} color="primary" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <CheckIcon />
                    <span>Completed</span>
                  </Box>
                </Badge>
              }
              value="completed"
            />
            <Tab 
              label={
                <Badge badgeContent={getFilterCount('cancelled')} color="error" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <CancelIcon />
                    <span>Cancelled</span>
                  </Box>
                </Badge>
              }
              value="cancelled"
            />
          </Tabs>
        </Card>
        )}

        {/* Bookings List */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Loading your bookings...
            </Typography>
          </Box>
        ) : bookings.length === 0 ? (
          <Card 
            elevation={2}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 8, textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 3,
                opacity: 0.5,
              }}>
                <CarIcon sx={{ fontSize: 100, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                No bookings found
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                {filter === 'all'
                  ? 'You haven\'t made any bookings yet. Start by searching for a ride!'
                  : `No ${filter} bookings found. Try a different filter.`}
              </Typography>
              {filter === 'all' && (
              <Button
                variant="contained"
                  size="large"
                  onClick={() => navigate('/customer/book-ride')}
                  startIcon={<SearchIcon />}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    // px: 4,
                    // py: 1.5,
                    fontWeight: 600,
                      px: { xs: 3, sm: 4 },       
                      py: { xs: 1, sm: 1.5 },     
                      fontSize: { xs: '0.9rem', sm: '1rem' }, 
                      width: { xs: '100%', sm: 'auto' },   
                      maxWidth: { xs: '400px', sm: 'none' },
                  }}
              >
                Find a Ride
              </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {bookings.map((booking) => (
                <Card 
                key={booking.id}
                elevation={2}
                  sx={{
                  borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    },
                  }}
                >
                <CardContent sx={{ p: 4 }}>
                  {/* Enhanced Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3,flexDirection:{xs:'column'},gap:{xs:1.5,md:0} }}>
                    <Chip
                        icon={getStatusIcon(booking.status)}
                        label={booking.status}
                        color={getStatusColor(booking.status) as any}
                      sx={{ 
                        textTransform: 'capitalize', 
                        fontWeight: 600,
                        height: 32,
                        fontSize: '0.875rem',
                        alignSelf: { xs: 'flex-start', sm: 'flex-end' },
                        order:{xs:-1,sm:0}
                      }}
                      />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,minWidth: 0}}>
                        <LocationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                            {booking.ride?.start_city || booking.ride?.start_location}
                        </Typography>
                        {booking.ride?.start_city && (
                             <Typography variant="body2" sx={{ color: 'text.secondary'}}>
                                    {booking.ride?.start_location}
                              </Typography>
                          )}
                          </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, ml: 4 }}>
                        <Box sx={{ width: 2, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                            {booking.ride?.end_city || booking.ride?.end_location}
                        </Typography>
                        {booking.ride?.end_city && (
                             <Typography variant="body2" sx={{ color: 'text.secondary'}}>
                                    {booking.ride?.end_location}
                              </Typography>
                          )}
                          </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Booking ID:
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          {booking.booking_number}
                        </Typography>
                      </Box>
                      </Box>
                    </Box>

                  <Divider sx={{ my: 3 }} />

                    {/* OTP Information */}
                    {(booking.status === 'confirmed' || booking.status === 'started' || booking.status === 'completed') && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 3,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'warning.main',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'warning.dark' }}>
                          Verification Codes
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Start OTP - Always show if available */}
                          {booking.pickup_otp && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  Start OTP:
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'warning.dark',
                                    fontFamily: 'monospace',
                                    letterSpacing: 2,
                                  }}
                                >
                                  {booking.pickup_otp}
                                </Typography>
                                {booking.pickup_verified && (
                                  <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ color: 'text.primary', display: 'block', mt: 0.5,fontWeight:600 }}>
                                {booking.pickup_verified 
                                  ? 'Pickup verified ✓' 
                                  : 'Share this OTP with the driver when boarding'}
                              </Typography>
                            </Grid>
                          )}
                          {/* End PIN - Always show if available */}
                          {booking.drop_pin && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  End PIN:
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'warning.dark',
                                    fontFamily: 'monospace',
                                    letterSpacing: 2,
                                  }}
                                >
                                  {booking.drop_pin}
                                </Typography>
                                {booking.drop_verified && (
                                  <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ color: 'text.primary', display: 'block', mt: 0.5,fontWeight:600 }}>
                                {booking.drop_verified 
                                  ? 'Drop verified ✓' 
                                  : 'Share this PIN with the driver when reaching destination'}
                              </Typography>
                            </Grid>
                          )}
                          {/* Status Summary */}
                          {(booking.pickup_verified || booking.drop_verified) && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                {booking.pickup_verified && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                                    <CheckIcon fontSize="small" />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      Pickup verified
                                    </Typography>
                                  </Box>
                                )}
                                {booking.drop_verified && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                                    <CheckIcon fontSize="small" />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      Drop verified - Ride completed
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    )}

                    {/* Enhanced Details Grid */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'primary.light',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <CalendarIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                              Date
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {formatDate(booking.ride?.scheduled_time)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'info.light',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'info.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <TimeIcon sx={{  fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{display: 'block', fontWeight: 500 }}>
                              Time
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {formatTime(booking.ride?.scheduled_time)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'success.light',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <PersonIcon sx={{ color: 'success.main', fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{  display: 'block', fontWeight: 500 }}>
                              Passengers
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {booking.passengerCount || 1}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'warning.light',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'warning.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <RupeeIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                              Total Fare
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700,  }}>
                              {parseFloat(booking.total_fare || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Enhanced Driver Info */}
                    {booking.ride?.driver && (
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          bgcolor: 'grey.50',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 56,
                              height: 56,
                              fontSize: 20,
                              fontWeight: 600,
                            }}
                          >
                            {booking.ride.driver.user?.first_name?.[0] || 'D'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                              {booking.ride.driver.user?.first_name} {booking.ride.driver.user?.last_name}
                            </Typography>
                            <Box sx={{display:'flex',gap:2,alignItems:'center'}}>
                            {booking.ride.driver.user?.mobile && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, }}>
                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary',fontSize:16,fontWeight:600}}>
                                {booking.ride.driver.user.mobile}
                              </Typography>
                              </Box>
                            )}
                            {booking.ride.driver.vehicles?.[0]?.vehicle_plate_number && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize:16, fontWeight: 600,mb:0.2}}>
                                  {booking.ride.driver.vehicles[0].vehicle_plate_number}
                                </Typography>
                              </Box>
                            )}
                            </Box>
                            
                          </Box>
                        </Box>
                      </Paper>
                    )}

                    {/* Payment Status Alert */}
                    {/* {booking.paymentStatus === 'failed' || booking.paymentStatus === 'initiated' ? (
                      <Alert 
                        severity="warning" 
                        icon={<PaymentIcon />}
                        sx={{ mb: 3, borderRadius: 2 }}
                      >
                        <Typography variant="body2">
                          In case your money has been debited, it will be credited to your source bank account within 5-7 business days.
                          If anything further, please feel free to reach support.
                        </Typography>
                      </Alert>
                    ) : null} */}
                    {/* Refund / Payment Status Message for Cancelled Bookings */}
                    {booking.status === 'cancelled' && getRefundMessage(booking) && (
                      <Alert
                        severity={
                          booking.paymentStatus === 'refunded'
                            ? 'success'
                            : booking.paymentStatus === 'failed'
                            ? 'error'
                            : 'warning'
                        }
                        icon={<PaymentIcon />}
                        sx={{ mb: 3, borderRadius: 2 }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getRefundMessage(booking)}
                        </Typography>
                      </Alert>
                    )}

                    {booking.utr_number && (
                      <Alert 
                        severity="info" 
                        sx={{ mb: 3, borderRadius: 2 }}
                      >
                        <Typography variant="body2">
                          <strong>UTR Number:</strong> {booking.utr_number}
                        </Typography>
                      </Alert>
                    )}

                    {/* Cancelled By Info */}
                    {booking.cancelledBy && (
                      <Alert 
                        severity="info" 
                        sx={{ mb: 3, borderRadius: 2 }}
                      >
                        <Typography variant="body2">
                          <strong>Cancelled By:</strong> {booking.cancelledBy}
                        </Typography>
                      </Alert>
                    )}

                    {/* Enhanced Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>  
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/customer/booking/${booking.id}`)}
                        sx={{ 
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          fontWeight: 600,
                        }}
                      >
                        View Details
                      </Button>
                      {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<PaymentIcon />}
                          onClick={async () => {
                            try {
                              const accessToken = localStorage.getItem('accessToken');
                              if (!accessToken) {
                                setError('Authentication required. Please login again.');
                                return;
                              }
                              
                              const { initiateRazorpayPayment } = await import('../../utils/razorpayCheckout');
                              const totalFare = parseFloat(booking.total_fare || 0);
                              
                              await initiateRazorpayPayment(
                                booking.id,
                                totalFare,
                                accessToken,
                                // Success callback
                                (paymentId, orderId) => {
                                  console.log('Razorpay payment successful:', { paymentId, orderId });
                                  // Reload bookings to show updated status
                                  loadBookings();
                                  // Navigate to booking details
                                  navigate(`/customer/booking/${booking.id}`, {
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
                                },
                                // Cancel callback
                                () => {
                                  setError('Payment was cancelled.');
                                }
                              );
                            } catch (err: any) {
                              setError(err.message || 'Failed to initiate payment');
                            }
                          }}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            borderWidth: 2,
                            borderColor: 'success.main',
                            color: 'success.main',
                            '&:hover': {
                              borderWidth: 2,
                              bgcolor: 'success.light',
                            },
                          }}
                        >
                          Pay Now
                        </Button>
                         
                      )}

                      {(booking.status === 'confirmed' || booking.status === 'started') && (
                      
                      /* {booking.status === 'confirmed' && (
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            alert("Please contact the support team to cancel your booking.");
                          }}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            borderWidth: 2,
                            borderColor: 'error.main',
                            color: 'error.main',
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )} */
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setSelectedBooking(booking);
                             if (booking.status === 'confirmed') {
                                alert("Please contact the support team to cancel your booking.");
                              } else if (booking.status === 'started') {
                                alert("Your ride has already started. You cannot cancel the ride.");
                              }
                          }}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            borderWidth: 2,
                            borderColor: 'error.main',
                            color: 'error.main',
                            '&:hover': {
                              borderWidth: 2,
                              bgcolor: 'error.light',
                            },
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<StarIcon />}
                          onClick={() => {
                            setRatingBooking(booking);
                            setRatingDialogOpen(true);
                          }}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            bgcolor: 'warning.main',
                            '&:hover': {
                              bgcolor: 'warning.dark',
                            },
                          }}
                        >
                          Rate Driver
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
        )}

        {/* Enhanced Cancel Dialog */}
        <Dialog 
          open={cancelDialogOpen} 
          onClose={() => setCancelDialogOpen(false)}
          PaperProps={{
            sx: { 
              borderRadius: 3,
              minWidth: { xs: '90%', sm: 400 },
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>
            Cancel Booking
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <DialogContentText sx={{ mb: 3, color: 'text.primary' }}>
              Are you sure you want to cancel this booking? {selectedBooking?.paymentStatus === 'success' ? 'The amount will be refunded to your wallet.' : 'Cancellation charges may apply as per our policy.'}
            </DialogContentText>
            {selectedBooking && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                  {getCityName(selectedBooking.pickup_location || selectedBooking.ride?.start_location)} → {getCityName(selectedBooking.drop_location || selectedBooking.ride?.end_location)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Booking ID: {selectedBooking.booking_number}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
            <Button 
              onClick={() => {
                if (!cancelling) {
                  setCancelDialogOpen(false);
                  setSelectedBooking(null);
                  setError('');
                }
              }}
              disabled={cancelling}
              variant="outlined"
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              Keep Booking
            </Button>
            <Button
              onClick={handleCancelBooking}
              disabled={cancelling}
              variant="contained"
              startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : null}
              color="error"
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rating Dialog */}
        <Dialog
          open={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            }
          }}
        >
          <DialogContent sx={{ p: 3, pt: 2 }}>
            {ratingBooking && (
              <RatingForm
                bookingId={ratingBooking.id}
                driverName={`${ratingBooking.ride?.driver?.user?.first_name || 'Driver'} ${ratingBooking.ride?.driver?.user?.last_name || ''}`}
                driverPhoto={ratingBooking.ride?.driver?.user?.profile_photo_url}
                rideRoute={`${ratingBooking.ride?.start_location || 'Pickup'} → ${ratingBooking.ride?.end_location || 'Drop'}`}
                onRatingSubmitted={() => {
                  setSuccessMessage('Thank you for rating the driver!');
                  loadBookings();
                }}
                onClose={() => setRatingDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
    </PageContainer>
  );
}
