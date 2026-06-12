import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Close as CloseIcon } from '@mui/icons-material';
import { userApi } from '../../services/userApi';
import Logo from '../../components/Logo';
import PublicLayout from '../../components/layouts/PublicLayout';
import TermsPrivacyDialog from '../../components/dialogs/TermsPrivacyDialog';
import { useAppDispatch } from '../../app/hooks';
import { fetchUser } from '../../features/auth/authSlice';

export default function CustomerSignup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Basic info, 2: OTP verification
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'terms' | 'privacy'>('terms');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Get referral code from URL parameter
  const referralCodeFromUrl = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
    referralCode: referralCodeFromUrl,
    agreeTerms: false,
  });

  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Update referral code if URL parameter changes
  useEffect(() => {
    if (referralCodeFromUrl) {
      setFormData(prev => ({ ...prev, referralCode: referralCodeFromUrl }));
    }
  }, [referralCodeFromUrl]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field === 'mobile' || field === 'emergencyContactMobile') {
      setFormData({ ...formData, [field]: e.target.value.replace(/\D/g, '').slice(0, 10) });
    } else if (field === 'agreeTerms') {
      setFormData({ ...formData, [field]: e.target.checked });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const userMobile = formData.mobile.replace(/\D/g, '').slice(-10);
    const emergencyMobile = formData.emergencyContactMobile.replace(/\D/g, '').slice(-10);
    
    if (userMobile && emergencyMobile && userMobile === emergencyMobile) {
      setError('Emergency contact number cannot be the same as your mobile number');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to Terms & Conditions and Privacy Policy');
      return;
    }

    try {
      setLoading(true);
      await userApi.signup(formData);
      setStep(2);
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || resending) return;

    try {
      setResending(true);
      setError('');
      await userApi.signup(formData);
      setResendCooldown(60); // Reset cooldown to 60 seconds
      // Show success message
      setError(''); // Clear any previous errors
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const result = await userApi.signupVerify({ ...formData, otp });
      
      // Fetch user data to update Redux auth state
      await dispatch(fetchUser()).unwrap();
      
      // Show success dialog briefly, then navigate to dashboard
      setSuccessDialogOpen(true);
      
      // Auto-navigate to dashboard after 2 seconds
      setTimeout(() => {
        setSuccessDialogOpen(false);
        navigate('/customer/dashboard', { replace: true });
      }, 2000);
    } catch (err: any) {
      const errMsg = err.message || 'OTP verification failed';
      setError(errMsg);
      if (errMsg.includes('Too many failed attempts')) {
        setOtp('');
        setTimeout(() => {
          setStep(1);
          setError('');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <PublicLayout>
        <Box sx={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
          <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Logo size="lg" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Verify OTP
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Enter the 6-digit OTP sent to {formData.mobile}
              </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                <form onSubmit={handleStep2Submit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      fullWidth
                      error={otp.length > 0 && otp.length < 6}
                      helperText={otp.length > 0 && otp.length < 6 ? 'OTP must be 6 digits' : 'Enter the 6-digit code sent to your mobile'}
                      inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={otp.length !== 6 || loading}
                      sx={{ 
                        textTransform: 'none',
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                      startIcon={loading && <CircularProgress size={20} sx={{ color: 'white' }} />}
                    >
                      {loading ? 'Verifying...' : 'Verify & Create Account'}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Didn't receive OTP?
                      </Typography>
                      <Button
                        variant="text"
                        onClick={handleResendOTP}
                        disabled={resendCooldown > 0 || resending}
                        sx={{ 
                          textTransform: 'none',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': { color: 'primary.dark' },
                          '&:disabled': { color: 'text.disabled' }
                        }}
                      >
                        {resending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                      </Button>
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

  return (
    <PublicLayout>
      <Box sx={{ minHeight: 'calc(100vh - 200px)', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
        <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Logo size="lg" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            User Signup
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Create your account and start booking rides
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <form onSubmit={handleStep1Submit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {error && <Alert severity="error">{error}</Alert>}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      required
                      fullWidth
                      error={formData.firstName.length > 0 && formData.firstName.trim().length === 0}
                      helperText={formData.firstName.length > 0 && formData.firstName.trim().length === 0 ? 'First name cannot be empty' : ''}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      required
                      fullWidth
                      error={formData.lastName.length > 0 && formData.lastName.trim().length === 0}
                      helperText={formData.lastName.length > 0 && formData.lastName.trim().length === 0 ? 'Last name cannot be empty' : ''}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={handleInputChange('mobile')}
                  required
                  fullWidth
                  inputProps={{ maxLength: 10 }}
                  error={formData.mobile.length > 0 && formData.mobile.length < 10}
                  helperText={formData.mobile.length > 0 && formData.mobile.length < 10 ? 'Mobile number must be 10 digits' : '10-digit mobile number'}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  fullWidth
                  required
                  error={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                  helperText={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Please enter a valid email address' : 'Email is required'}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <TextField
                  label="Gender"
                  select
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                  error={false}
                  SelectProps={{ native: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </TextField>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                  Emergency Contact
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Contact Name"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange('emergencyContactName')}
                      required
                      fullWidth
                      error={formData.emergencyContactName.length > 0 && formData.emergencyContactName.trim().length === 0}
                      helperText={formData.emergencyContactName.length > 0 && formData.emergencyContactName.trim().length === 0 ? 'Contact name cannot be empty' : ''}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Contact Mobile"
                      value={formData.emergencyContactMobile}
                      onChange={handleInputChange('emergencyContactMobile')}
                      required
                      fullWidth
                      inputProps={{ maxLength: 10 }}
                      error={formData.emergencyContactMobile.length > 0 && formData.emergencyContactMobile.length < 10}
                      helperText={formData.emergencyContactMobile.length > 0 && formData.emergencyContactMobile.length < 10 ? 'Mobile number must be 10 digits' : '10-digit mobile number'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Referral Code"
                  value={formData.referralCode}
                  onChange={handleInputChange('referralCode')}
                  fullWidth
                  disabled={!!referralCodeFromUrl}
                  helperText={referralCodeFromUrl 
                    ? "Referral code from signup link - You'll earn ₹100 after your first ride!" 
                    : "Enter referral code to earn ₹100"}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeTerms}
                      onChange={handleInputChange('agreeTerms')}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Button 
                        variant="text" 
                        size="small" 
                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto', color: 'primary.main' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDialogType('terms');
                          setDialogOpen(true);
                        }}
                      >
                        Terms & Conditions
                      </Button>{' '}
                      and{' '}
                      <Button 
                        variant="text" 
                        size="small" 
                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto', color: 'primary.main' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDialogType('privacy');
                          setDialogOpen(true);
                        }}
                      >
                        Privacy Policy
                      </Button>
                    </Typography>
                  }
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !formData.agreeTerms}
                  sx={{ 
                    textTransform: 'none',
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    mt: 3
                  }}
                  startIcon={loading && <CircularProgress size={20} sx={{ color: 'white' }} />}
                >
                  {loading ? 'Sending OTP...' : 'Continue'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Already have an account?{' '}
                    <Button
                      variant="text"
                      onClick={() => navigate('/login')}
                      sx={{ 
                        textTransform: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        '&:hover': { color: 'primary.dark' }
                      }}
                    >
                      Login
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
        </Container>
      </Box>

      <TermsPrivacyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={dialogType}
      />

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          navigate('/customer/dashboard', { replace: true });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Account Created
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setSuccessDialogOpen(false);
              navigate('/customer/dashboard', { replace: true });
            }}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', color: 'text.primary', textAlign: 'center', py: 2 }}>
            Your account has been created successfully! Redirecting to your dashboard...
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setSuccessDialogOpen(false);
              navigate('/customer/dashboard', { replace: true });
            }}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </PublicLayout>
  );
}

