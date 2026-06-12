import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { store } from '../../app/store';
import { verifyOTP, clearError, login } from '../../features/auth/authSlice';
import Logo from '../../components/Logo';
import { getPostLoginAction, clearPostLoginAction } from '../../utils/postLoginAction';
import { ridesApi } from '../../services/ridesApi';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { loading, error, user, isAuthenticated } = useAppSelector((state) => state.auth);

  const mobile = location.state?.mobile || '';
  const redirect = location.state?.redirect || null; // Get redirect URL from location state
  const source = location.state?.source || ''; // Track where user came from
  const [otp, setOtp] = useState('');
  const [processingLoginAction, setProcessingLoginAction] = useState(false);
  const [resending, setResending] = useState(false);

  // Prevent direct access - redirect to login if mobile is not provided or source is invalid
  useEffect(() => {
    if (!mobile || source !== 'login') {
      // No mobile number or invalid source means direct access - redirect to login
      navigate('/login', { replace: true });
      return;
    }
  }, [mobile, source, navigate]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else if (user.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Clear stored intent if user navigates away or cancels (e.g., goes back)
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearPostLoginAction();
    };

    // Clear on component unmount (user navigates away without completing login)
    return () => {
      // Only clear if user hasn't completed login
      // (We'll clear it after successful login in handleSubmit)
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (otp.length !== 6) {
      return;
    }

    setProcessingLoginAction(true);
    dispatch(verifyOTP({ mobile, otp }));
    // State will be updated by Redux reducer, navigation handled in useEffect
  };

  // Reset processing state if error occurs
  useEffect(() => {
    if (error && processingLoginAction) {
      setProcessingLoginAction(false);
    }
  }, [error, processingLoginAction]);

  const handleResend = async () => {
    if (!mobile) return;
    
    try {
      setResending(true);
      dispatch(clearError());
      await dispatch(login({ mobile })).unwrap();
      setOtp(''); // Clear OTP input
    } catch (error: any) {
      // Error is handled by Redux state
      console.error('Failed to resend OTP:', error);
    } finally {
      setResending(false);
    }
  };

  // Handle navigation after successful authentication
  useEffect(() => {
    if (!isAuthenticated || !user || !processingLoginAction) {
      return;
    }

    const handleNavigation = async () => {
      // Check for stored post-login action BEFORE navigation
      const { action, context } = getPostLoginAction();
      
      if (action === 'BOOK_RIDE' && context?.rideId) {
        // Fetch ride details and restore search context
        try {
          const rideDetails = await ridesApi.getRideDetails(context.rideId);
          
          // Navigate to booking page with ride details and search context
          navigate(`/customer/book-ride/${context.rideId}`, {
            state: {
              ride: rideDetails.ride,
              searchContext: {
                pickup: context.pickup,
                drop: context.drop,
                date: context.date,
                time: context.time,
                initialPricePerSeat: context.initialPricePerSeat,
                filters: context.filters,
              },
            },
          });
          
          // Clear stored intent after successful navigation
          clearPostLoginAction();
          setProcessingLoginAction(false);
          return;
        } catch (err: any) {
          // If fetching ride details fails, still navigate but let BookRide page handle the error
          console.error('Failed to fetch ride details:', err);
          navigate(`/customer/book-ride/${context.rideId}`, {
            state: {
              searchContext: {
                pickup: context.pickup,
                drop: context.drop,
                date: context.date,
                time: context.time,
                initialPricePerSeat: context.initialPricePerSeat,
                filters: context.filters,
              },
            },
          });
          clearPostLoginAction();
          setProcessingLoginAction(false);
          return;
        }
      }
      
      // Handle redirect URL if provided (e.g., from login?redirect=/book/:rideId)
      if (redirect) {
        navigate(redirect);
        setProcessingLoginAction(false);
        return;
      }
      
      // Default redirect based on role
      const role = user.role;
      if (role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.warn('Unknown user role, redirecting to home:', role);
        navigate('/', { replace: true });
      }
      setProcessingLoginAction(false);
    };

    handleNavigation();
  }, [isAuthenticated, user, navigate, redirect, processingLoginAction]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  // Don't render if mobile is not provided (will redirect)
  if (!mobile) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Logo size="lg" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Verify OTP
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Enter the 6-digit OTP sent to {mobile}
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {error && (
                  <Alert severity="error" onClose={() => dispatch(clearError())}>
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Enter OTP"
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  fullWidth
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } }}
                  helperText="Enter the 6-digit code sent to your mobile"
                  error={otp.length > 0 && otp.length < 6}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={otp.length !== 6 || loading || processingLoginAction}
                  sx={{ 
                    textTransform: 'none',
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600
                  }}
                  startIcon={(loading || processingLoginAction) && <CircularProgress size={20} sx={{ color: 'white' }} />}
                >
                  {processingLoginAction ? 'Loading...' : loading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Didn't receive OTP?{' '}
                    <Button
                      variant="text"
                      onClick={handleResend}
                      disabled={resending || loading}
                      sx={{ 
                        textTransform: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        '&:hover': { color: 'primary.dark' },
                        '&:disabled': { color: 'text.disabled' }
                      }}
                    >
                      {resending ? 'Resending...' : 'Resend'}
                    </Button>
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => {
                      clearPostLoginAction(); // Clear intent if user cancels
                      navigate('/');
                    }}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      mt: 1,
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

