import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Payment as PaymentIcon,
  CurrencyRupee as RupeeIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Wallet as WalletIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { paymentApi } from '../../services/paymentApi';
import { bookingsApi } from '../../services/bookingsApi';
import { initiateRazorpayPayment } from '../../utils/razorpayCheckout';
import PageContainer from '../../components/common/PageContainer';
import { getCityName } from '../../utils/locationHelpers';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const amountParam = searchParams.get('amount');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // Use booking's total_fare if available, otherwise use amount param
  const amount = booking?.total_fare 
    ? parseFloat(booking.total_fare) 
    : (amountParam ? parseFloat(amountParam) : 0);

  // Redirect if missing required params (only check amountParam, not computed amount)
  useEffect(() => {
    if (!bookingId) {
      navigate('/customer/my-bookings');
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    } else {
      setError('Booking ID is required');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const result = await bookingsApi.getBookingDetails(bookingId!);
      setBooking(result.booking);
      
      // Debug: Log booking data to verify intermediate route fields
      console.log('Payment page - Booking data:', {
        total_fare: result.booking?.total_fare,
        base_fare: result.booking?.base_fare,
        pickup_location: result.booking?.pickup_location,
        drop_location: result.booking?.drop_location,
        ride_start_location: result.booking?.ride?.start_location,
        ride_end_location: result.booking?.ride?.end_location,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load booking');
      console.error('Error loading booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) {
      setError('Booking ID is required');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Invalid payment amount. Please contact support.');
      return;
    }

    if (!booking) {
      setError('Booking details not loaded. Please refresh the page.');
      // Try to reload booking
      await loadBooking();
      return;
    }

    const user = booking.customer?.user;
    if (!user) {
      setError('User details not found in booking. Please contact support.');
      return;
    }

    if (!user.mobile) {
      setError('Mobile number is required for payment. Please update your profile.');
      return;
    }

    try {
      setInitiatingPayment(true);
      setError('');

      // Get access token
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Authentication required. Please login again.');
      }

      // Initiate Razorpay payment
      await initiateRazorpayPayment(
        bookingId!,
        amount,
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
          setError('Payment was cancelled.');
          setInitiatingPayment(false);
        }
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate payment';
      setError(errorMessage);
      setInitiatingPayment(false);
      console.error('Payment initiation error:', err);
    }
  };

  // Show loading state while redirecting if params are missing
  if (!bookingId || !amount) {
    return (
      <PageContainer maxWidth="md" title="Payment">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Redirecting to My Bookings...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading booking details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!booking) {
    return (
      <PageContainer maxWidth="md" title="Payment">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load booking details. Please try again.'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={async () => {
            // Cancel booking before navigating away if payment hasn't been completed
            if (bookingId && booking && booking.status === 'pending' && booking.paymentStatus === 'pending' && !isCancelling) {
              try {
                setIsCancelling(true);
                await bookingsApi.cancelBooking(bookingId);
              } catch (error) {
                console.error('Error cancelling booking:', error);
              } finally {
                setIsCancelling(false);
              }
            }
            
            if (bookingId) {
              navigate(`/customer/booking/${bookingId}`);
            } else {
              navigate('/customer/my-bookings');
            }
          }}
          disabled={isCancelling}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Go Back
        </Button>
      </PageContainer>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: { xs: 3, md: 4 } }}>
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          startIcon={<BackIcon />}
          onClick={async () => {
            // Cancel booking before navigating away if payment hasn't been completed
            if (bookingId && booking && booking.status === 'pending' && booking.paymentStatus === 'pending' && !isCancelling) {
              try {
                setIsCancelling(true);
                await bookingsApi.cancelBooking(bookingId);
              } catch (error) {
                console.error('Error cancelling booking:', error);
              } finally {
                setIsCancelling(false);
              }
            }
            
            if (bookingId) {
              navigate(`/customer/booking/${bookingId}`);
            } else {
              navigate('/customer/my-bookings');
            }
          }}
          disabled={isCancelling}
          sx={{
            mb: 3,
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          Back to Booking
        </Button>

        <Card 
          elevation={4}
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Enhanced Header */}
          <Box 
            sx={{ 
              bgcolor: 'primary.main',
              p: { xs: 3, md: 4 },
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <Box sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mb: 2,
              }}>
                <PaymentIcon sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                Complete Payment
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
                Secure payment powered by Razorpay
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 3, md: 4 } }}>

            {/* Enhanced Booking Details */}
            {booking && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  bgcolor: 'grey.50',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <LocationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Booking Details
                </Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <LocationIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {getCityName(booking.pickup_location) || getCityName(booking.ride?.start_location) || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 4, mb: 2 }}>
                      <Box sx={{ width: 2, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {getCityName(booking.drop_location) || getCityName(booking.ride?.end_location) || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  {booking.ride?.scheduled_time && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CalendarIcon sx={{ color: 'info.main', fontSize: 24 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Date
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDate(booking.ride.scheduled_time)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <TimeIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Time
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatTime(booking.ride.scheduled_time)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Booking ID:
                </Typography>
                      <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {booking.booking_number}
                </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Fare Breakdown */}
            {booking && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: 'grey.50',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Fare Breakdown
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Base Fare
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{parseFloat(booking.base_fare || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Platform Fee
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{parseFloat(booking.platform_fee || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Total Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ₹{parseFloat(booking.total_fare || amount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Enhanced Amount Display */}
            <Paper
              elevation={0}
              sx={{
                textAlign: 'center',
                mb: 4,
                p: 4,
                bgcolor: 'primary.light',
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'primary.main',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Total Amount to Pay
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, position: 'relative', zIndex: 1 }}>
                <RupeeIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
                  {(booking ? parseFloat(booking.total_fare || 0) : amount).toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                All taxes included
              </Typography>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Enhanced Payment Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePayment}
                disabled={loading || initiatingPayment || !booking || !booking.customer?.user}
                startIcon={initiatingPayment ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                sx={{ 
                  textTransform: 'none',
                  py: 2,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  boxShadow: 4,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    boxShadow: 6,
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    background: 'none',
                  }
                }}
              >
                {initiatingPayment ? 'Opening Payment...' : 'Pay ₹' + amount.toFixed(2) + ' with Razorpay'}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<BackIcon />}
                onClick={async () => {
                  // Cancel booking before navigating away if payment hasn't been completed
                  if (bookingId && booking && booking.status === 'pending' && booking.paymentStatus === 'pending' && !isCancelling) {
                    try {
                      setIsCancelling(true);
                      await bookingsApi.cancelBooking(bookingId);
                    } catch (error) {
                      console.error('Error cancelling booking:', error);
                    } finally {
                      setIsCancelling(false);
                    }
                  }
                  
                  if (bookingId) {
                    navigate(`/customer/booking/${bookingId}`);
                  } else {
                    navigate('/customer/my-bookings');
                  }
                }}
                disabled={isCancelling}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 1.5,
                  borderWidth: 2,
                  borderColor: 'text.secondary',
                  color: 'text.secondary',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'grey.100',
                    borderWidth: 2,
                    borderColor: 'text.secondary',
                  }
                }}
              >
                Cancel Payment
              </Button>
            </Box>

            {/* Enhanced Payment Methods */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'grey.50',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" sx={{ color: 'text.primary', mb: 2.5, fontWeight: 700, textAlign: 'center' }}>
                Payment Methods Supported
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item xs={6} sm={4}>
                  <Chip 
                    icon={<WalletIcon />}
                    label="UPI" 
                    sx={{ 
                      bgcolor: 'white',
                      width: '100%',
                      height: 40,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'divider',
                    }} 
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Chip 
                    icon={<CreditCardIcon />}
                    label="Credit Card" 
                    sx={{ 
                      bgcolor: 'white',
                      width: '100%',
                      height: 40,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'divider',
                    }} 
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Chip 
                    icon={<CreditCardIcon />}
                    label="Debit Card" 
                    sx={{ 
                      bgcolor: 'white',
                      width: '100%',
                      height: 40,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'divider',
                    }} 
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Chip 
                    icon={<BankIcon />}
                    label="Net Banking" 
                    sx={{ 
                      bgcolor: 'white',
                      width: '100%',
                      height: 40,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'divider',
                    }} 
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Chip 
                    icon={<WalletIcon />}
                    label="Wallets" 
                    sx={{ 
                      bgcolor: 'white',
                      width: '100%',
                      height: 40,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'divider',
                    }} 
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Enhanced Security Info */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'success.light',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'success.main',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1.5 }}>
                <SecurityIcon sx={{ color: 'success.main', fontSize: 24 }} />
                <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700 }}>
                  Secure Payment
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.primary', textAlign: 'center', lineHeight: 1.6 }}>
                Your payment is processed securely through Razorpay. All transactions are encrypted and PCI-DSS compliant.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2, pt: 2, borderTop: 1, borderColor: 'success.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    SSL Encrypted
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    PCI-DSS Compliant
                  </Typography>
                </Box>
            </Box>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

