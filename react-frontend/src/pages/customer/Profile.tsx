import { useState, useEffect } from 'react';
import {
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
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { addressesApi } from '../../services/addressesApi';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { getProfile, updateProfile } from '../../features/user/userSlice';
import PageContainer from '../../components/common/PageContainer';
import GooglePlacesAutocomplete from '../../components/maps/GooglePlacesAutocomplete';

export default function CustomerProfile() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
  });

  const [newAddress, setNewAddress] = useState({
    addressType: 'home',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await dispatch(getProfile()).unwrap();
      setProfile(result);
      const emergencyContact = result.emergencyContacts?.[0];
      setFormData({
        firstName: result.firstName || '',
        lastName: result.lastName || '',
        email: result.email || '',
        gender: result.gender || '',
        emergencyContactName: emergencyContact?.name || '',
        emergencyContactMobile: (emergencyContact?.mobile || '').replace(/^\+91/, ''),
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const result = await addressesApi.getAddresses();
      setSavedAddresses(result.addresses || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const userMobile = (profile?.mobile || user?.mobile || '').replace(/\D/g, '').slice(-10);
    const emergencyMobile = formData.emergencyContactMobile.replace(/\D/g, '').slice(-10);
    if (userMobile && emergencyMobile && userMobile === emergencyMobile) {
      setError('Emergency contact number cannot be the same as your mobile number');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await dispatch(updateProfile(formData)).unwrap();
      setSuccess('Profile updated successfully');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate required fields
      if (!newAddress.address || !newAddress.address.trim()) {
        setError('Address is required');
        return;
      }

      if (!newAddress.latitude || !newAddress.longitude || newAddress.latitude === 0 || newAddress.longitude === 0) {
        setError('Please select an address from the suggestions to get location coordinates');
        return;
      }

      const addressData = {
        label: newAddress.addressType as 'home' | 'work' | 'other',
        displayName: `${newAddress.address}${newAddress.city ? ', ' + newAddress.city : ''}${newAddress.state ? ', ' + newAddress.state : ''}${newAddress.pincode ? ' - ' + newAddress.pincode : ''}`.trim(),
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      };

      await addressesApi.addAddress(addressData);
      setSuccess('Address saved successfully');
      setNewAddress({
        addressType: 'home',
        address: '',
        city: '',
        state: '',
        pincode: '',
        latitude: 0,
        longitude: 0,
      });
      await loadAddresses();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressLocationChange = (address: string, location?: { lat: number; lng: number }) => {
    setNewAddress((prev)=>({
      ...prev,
      address: address,
      latitude: location?.lat || 0,
      longitude: location?.lng || 0,
  }));
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg" title="Profile">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" title="My Profile" subtitle="Manage your personal information and saved addresses">

        {profile && (
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, opacity: 0.9 }}>
                    Profile Rating
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {profile.averageRating || 'N/A'} ⭐
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {profile.completedBookings || 0} trips completed
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 64, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
              }
            }}
          >
            <Tab label="Personal Information" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Saved Addresses" icon={<LocationIcon />} iconPosition="start" />
          </Tabs>

          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Profile Tab */}
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Personal Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Mobile Number"
                  value={profile?.mobile || user?.mobile || ''}
                  disabled
                  fullWidth
                  helperText="Contact support to change mobile number"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  required
                  error={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                  helperText={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Please enter a valid email address' : 'Email is required'}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <TextField
                  label="Gender"
                  select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  fullWidth
                 InputLabelProps={{ shrink: true }}
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Name"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  sx={{ textTransform: 'none', borderRadius: 2, mt: 3 }}
                  startIcon={saving && <CircularProgress size={20} sx={{ color: 'white' }} />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}

            {/* Saved Addresses Tab */}
            {tab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Saved Addresses
                </Typography>

                {/* Add New Address */}
                <Paper sx={{ p: 3, borderRadius: 2, border: '2px dashed', borderColor: 'divider', mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                    Add New Address
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Address Type"
                        select
                        value={newAddress.addressType}
                        onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
                        fullWidth
                        SelectProps={{ native: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <GooglePlacesAutocomplete
                        label="Address"
                        value={newAddress.address}
                        onChange={handleAddressLocationChange}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        fullWidth
                        inputProps={{ maxLength: 6 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        onClick={handleAddAddress}
                        disabled={saving || !newAddress.address || !newAddress.latitude || !newAddress.longitude || newAddress.latitude === 0 || newAddress.longitude === 0}
                        sx={{ 
                          textTransform: 'none',
                          borderRadius: 2,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.light',
                            borderColor: 'primary.main',
                          }
                        }}
                      >
                        Add Address
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Saved Addresses List */}
                {savedAddresses.length === 0 ? (
                  <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No saved addresses. Add your first address above.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {savedAddresses.map((address) => (
                      <Grid item xs={12} sm={6} md={4} key={address.id}>
                        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Chip
                              label={address.label}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Button
                              size="small"
                              sx={{ textTransform: 'none', minWidth: 'auto', color: 'error.main' }}
                              onClick={async () => {
                                try {
                                  await addressesApi.deleteAddress(address.id);
                                  await loadAddresses();
                                } catch (error) {
                                  console.error('Error deleting address:', error);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {address.displayName}
                          </Typography>
                          {/* {(address.city || address.state) && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {address.city} {address.state && `, ${address.state}`}
                            </Typography>
                          )} */}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
    </PageContainer>
  );
}

