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
import { Phone as PhoneIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, clearError } from '../features/auth/authSlice';
import Logo from '../components/Logo';
import PublicLayout from '../components/layouts/PublicLayout';
import { clearPostLoginAction } from '../utils/postLoginAction';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [mobile, setMobile] = useState('');

  // Get redirect URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect');

  // Clear stored intent if user navigates away or cancels login
  useEffect(() => {
    // Clear on component unmount (user navigates away)
    return () => {
      clearPostLoginAction();
    };
  }, []);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  dispatch(clearError());

  try {
    // Wait for backend response
    await dispatch(login({ mobile })).unwrap();

    //  Navigate ONLY if OTP was sent successfully
    navigate('/verify-otp', { 
      state: { 
        mobile,
        redirect: redirect || null,
        source: 'login',
      } 
    });
  } catch {
    
  }
};


  return (
    <PublicLayout>
      <Box sx={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
        <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Logo size="lg" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Login
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Enter your mobile number to continue
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

                {error && error.includes('not registered') && (
                <Button
                 variant="contained"
                 fullWidth
                 onClick={() => navigate('/signup', { state: { mobile } })}
                 sx={{ 
                 textTransform: 'none',
                 borderRadius: 2,
                 fontWeight: 600
              }}
  >
                 Sign Up with {mobile}
               </Button>
                )}


                <TextField
                  label="Mobile Number"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ color: 'primary.main', mr: 1 }} />,
                  }}
                  helperText="Enter your 10-digit mobile number"
                  error={mobile.length > 0 && mobile.length < 10}
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
                  disabled={mobile.length !== 10 || loading}
                  sx={{ 
                    textTransform: 'none',
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600
                  }}
                  startIcon={loading && <CircularProgress size={20} sx={{ color: 'white' }} />}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Don't have an account?{' '}
                    <Button
                      variant="text"
                      onClick={() => navigate('/signup')}
                      sx={{ 
                        textTransform: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        '&:hover': { color: 'primary.dark' }
                      }}
                    >
                      Sign up
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
        </Container>
      </Box>
    </PublicLayout>
  );
}

