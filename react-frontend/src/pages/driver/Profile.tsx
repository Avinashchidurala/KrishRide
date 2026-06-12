import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { getProfile, updateProfile } from '../../features/user/userSlice';
import PageContainer from '../../components/common/PageContainer';

export default function DriverProfile() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    gender: user?.gender || '',
    emergencyContactName: '',
    emergencyContactMobile: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Initialize formData with user data immediately
    setFormData(prev => ({
      ...prev,
      firstName: user?.firstName || user?.first_name || prev.firstName,
      lastName: user?.lastName || user?.last_name || prev.lastName,
      email: user?.email || prev.email,
      gender: user?.gender || prev.gender,
    }));
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await dispatch(getProfile()).unwrap();
      const driverData = result.driver || result;
      setProfile(driverData);
      const userData = driverData.user || driverData;
      const emergencyContact = userData.emergencyContacts?.[0];
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || userData.first_name || prev.firstName,
        lastName: userData.lastName || userData.last_name || prev.lastName,
        email: userData.email || prev.email,
        gender: userData.gender || prev.gender,
        emergencyContactName: emergencyContact?.name || prev.emergencyContactName,
        emergencyContactMobile: (emergencyContact?.mobile || '').replace(/^\+91/, '') || prev.emergencyContactMobile,
      }));
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const driverMobile = (user?.mobile || '').replace(/\D/g, '').slice(-10);
      const emergencyMobile = formData.emergencyContactMobile.replace(/\D/g, '').slice(-10);
      if (driverMobile && emergencyMobile && driverMobile === emergencyMobile) {
        setError('Emergency contact number cannot be the same as your mobile number');
        return;
      }

      setSaving(true);
      setError('');
      await dispatch(updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactMobile: formData.emergencyContactMobile,
      })).unwrap();
      setSuccess('Profile updated successfully');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <PageContainer maxWidth="lg" title="Profile">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Loading profile...
            </Typography>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" title="My Profile" subtitle="Manage your personal information">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              px: 3,
              pt: 2,
            }}
          >
            <Tab label="Personal Information" />
            <Tab label="Bank Details" />
          </Tabs>

          <CardContent sx={{ p: 4 }}>
            {/* Personal Information Tab */}
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Mobile Number"
                        value={user?.mobile || ''}
                        disabled
                        fullWidth
                        helperText="Contact support to change mobile number"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        fullWidth
                        required
                        error={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                        helperText={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Please enter a valid email address' : 'Email is required'}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Gender"
                        select
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{ native: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </TextField>
                    </Grid>
                    {profile && profile.driving_license_number && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Driving License Number"
                          value={profile.driving_license_number}
                          disabled
                          fullWidth
                          helperText="Set during KYC submission"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                    Emergency Contact
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Contact Name"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Contact Mobile"
                        value={formData.emergencyContactMobile}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactMobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        fullWidth
                        inputProps={{ maxLength: 10 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                    Vehicle Management
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/driver/vehicles')}
                    sx={{ 
                      textTransform: 'none',
                      borderRadius: 2,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        bgcolor: 'primary.light',
                      }
                    }}
                  >
                    Manage Vehicles
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={saving || loading}
                    sx={{ 
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                    }}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Bank Details Tab */}
            
            {tab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                  Bank Account Details
                </Typography>
                
                {profile && (profile.bank_name || profile.bank_ifsc_code || profile.bank_account_number || profile.bank_details) ? (
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2, 
                      border: 1, 
                      borderColor: 'divider',
                      bgcolor: 'grey.50'
                    }}
                  >
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                          Bank Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {profile.bank_details?.bankName || profile.bank_name || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                          IFSC Code
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {profile.bank_details?.ifscCode || profile.bank_ifsc_code || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                          Account Number
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                          {(profile.bank_details?.accountNumber || profile.bank_account_number)
                            ? `****${(profile.bank_details?.accountNumber || profile.bank_account_number).toString().slice(-4)}`
                            : 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                      Bank details are set during KYC submission and cannot be edited here. Contact support for changes.
                    </Alert>
                  </Paper>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <BankIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      No bank details available. Bank details are set during KYC submission.
                    </Typography>
                  </Box>
                )}
              </Box>
            )
        }
          </CardContent>
        </Card>
    </PageContainer>
  );
}

