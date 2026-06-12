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
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  ContactEmergency as EmergencyIcon,
  AccountBalance as BankIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { addressesApi } from '../services/addressesApi';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { getProfile, updateProfile } from '../features/user/userSlice';
import PageContainer from '../components/common/PageContainer';
import StandardCard from '../components/common/StandardCard';

export default function Profile() {
  const navigate = useNavigate();
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
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    gender: user?.gender || '',
    emergencyContactName: '',
    emergencyContactMobile: '',
  });

  const [newAddress, setNewAddress] = useState({
    addressType: 'home',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const isCustomer = user?.role === 'customer';
  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Initialize formData with user data immediately so name displays right away
    setFormData(prev => ({
      ...prev,
      firstName: user?.firstName || user?.first_name || prev.firstName,
      lastName: user?.lastName || user?.last_name || prev.lastName,
      email: user?.email || prev.email,
      gender: user?.gender || prev.gender,
    }));
    loadProfile();
    if (isCustomer) {
      loadAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await dispatch(getProfile()).unwrap();
      
      if (isDriver) {
        const driverData = result.driver || result;
        const userData = driverData.user || driverData;
        const emergencyContact = userData.emergencyContacts?.[0];
        setProfile(driverData);
        setFormData({
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          email: userData.email || '',
          gender: userData.gender || '',
          emergencyContactName: emergencyContact?.name || '',
          emergencyContactMobile: emergencyContact?.mobile || '',
        });
      } else if (isCustomer) {
        const profileData = result.profile || result;
        const emergencyContact = profileData.emergencyContacts?.[0] || (profileData.user?.emergencyContacts?.[0]);
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName || profileData.first_name || user?.first_name || user?.firstName || '',
          lastName: profileData.lastName || profileData.last_name || user?.last_name || user?.lastName || '',
          email: profileData.email || user?.email || '',
          gender: profileData.gender || user?.gender || '',
          emergencyContactName: emergencyContact?.name || '',
          emergencyContactMobile: emergencyContact?.mobile || '',
        });
      } else if (isAdmin) {
        // Admin - use result from Redux thunk
        try {
          const profileData = result.profile || result;
          setProfile(profileData);
          setFormData({
            firstName: profileData.firstName || profileData.first_name || user?.first_name || user?.firstName || '',
            lastName: profileData.lastName || profileData.last_name || user?.last_name || user?.lastName || '',
            email: profileData.email || user?.email || '',
            gender: profileData.gender || user?.gender || '',
            emergencyContactName: '',
            emergencyContactMobile: '',
          });
        } catch (adminError) {
          // Fallback to user data from Redux if API fails
          setProfile({
            first_name: user?.first_name || user?.firstName,
            last_name: user?.last_name || user?.lastName,
            email: user?.email,
            mobile: user?.mobile,
            gender: user?.gender,
          });
          setFormData({
            firstName: user?.first_name || user?.firstName || '',
            lastName: user?.last_name || user?.lastName || '',
            email: user?.email || '',
            gender: user?.gender || '',
            emergencyContactName: '',
            emergencyContactMobile: '',
          });
        }
      } else {
        // Other roles - use basic user data
        setProfile({
          first_name: user?.first_name || user?.firstName,
          last_name: user?.last_name || user?.lastName,
          email: user?.email,
          mobile: user?.mobile,
          gender: user?.gender,
        });
        setFormData({
          firstName: user?.first_name || user?.firstName || '',
          lastName: user?.last_name || user?.lastName || '',
          email: user?.email || '',
          gender: user?.gender || '',
          emergencyContactName: '',
          emergencyContactMobile: '',
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load profile');
      // Fallback to user data from Redux if API fails
      if (user) {
        setFormData({
          firstName: user?.first_name || user?.firstName || '',
          lastName: user?.last_name || user?.lastName || '',
          email: user?.email || '',
          gender: user?.gender || '',
          emergencyContactName: '',
          emergencyContactMobile: '',
        });
      }
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
        setSaving(false);
        return;
      }
      
      // Build full address string
      const fullAddress = [
        newAddress.address,
        newAddress.city,
        newAddress.state,
        newAddress.pincode,
      ].filter(Boolean).join(', ');

      // Geocode address to get coordinates (if Google Maps is available)
      let latitude = 0;
      let longitude = 0;
      
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          await new Promise<void>((resolve) => {
            geocoder.geocode({ address: fullAddress }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                const location = results[0].geometry.location;
                latitude = location.lat();
                longitude = location.lng();
              }
              resolve();
            });
          });
        } catch (geocodeError) {
          console.warn('Geocoding failed, using default coordinates:', geocodeError);
        }
      }

      await addressesApi.addAddress({
        label: newAddress.addressType as 'home' | 'work' | 'other',
        displayName: fullAddress,
        latitude,
        longitude,
      });
      
      setSuccess('Address saved successfully');
      setNewAddress({
        addressType: 'home',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
      await loadAddresses();
    } catch (err: any) {
      console.error('Error saving address:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer>
        {/* Back Button */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        </Box>

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

        <StandardCard>
          {/* Tabs */}
          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)} 
            sx={{ 
              px: 2, 
              pt: 0.5, 
              pb: 0,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Tab label="Personal Information" icon={<PersonIcon />} iconPosition="start" />
            {isCustomer && <Tab label="Saved Addresses" icon={<LocationIcon />} iconPosition="start" />}
            {isDriver && <Tab label="Bank Details" icon={<BankIcon />} iconPosition="start" />}
          </Tabs>

          <Box sx={{ p: 2 }}>
            {/* Personal Information Tab */}
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          fullWidth
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
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
                      value={profile?.mobile || profile?.user?.mobile || user?.mobile || ''}
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
                      error={false}
                      helperText=""
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </TextField>

                    {(isCustomer || isDriver) && (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmergencyIcon />
                          Emergency Contact
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Contact Name"
                              value={formData.emergencyContactName}
                              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                              fullWidth
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
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
                      </>
                    )}

                    <Button
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      sx={{ 
                        textTransform: 'none', 
                        maxWidth: '200px',
                        borderRadius: 2,
                        fontWeight: 600,
                        mt: 3
                      }}
                      startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                )}

                {/* Saved Addresses Tab (Customer only) */}
                {tab === 1 && isCustomer && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Add New Address */}
                    <Paper sx={{ p: 3, borderRadius: 2, border: '2px dashed', borderColor: 'divider', mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                        Add New Address
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
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
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            label="Address"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                            required
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="State"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Pincode"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            fullWidth
                            inputProps={{ maxLength: 6 }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button
                            variant="outlined"
                            onClick={handleAddAddress}
                            disabled={saving || !newAddress.address}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                          >
                            Add Address
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Saved Addresses List */}
                    {savedAddresses.length === 0 ? (
                      <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
                        No saved addresses. Add your first address above.
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {savedAddresses.map((address) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={address.id}>
                            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Chip
                                  label={address.address_type}
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
                                      setSuccess('Address deleted successfully');
                                    } catch (error: any) {
                                      setError(error.message || 'Failed to delete address');
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {address.address}
                              </Typography>
                              {(address.city || address.state) && (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {address.city} {address.state && `, ${address.state}`}
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Bank Details Tab (Driver only) */}
                {tab === 1 && isDriver && profile && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {(profile.bank_details || profile.bankName || profile.bank_name) ? (
                      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              Bank Name
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {profile.bank_details?.bankName || profile.bankName || profile.bank_name || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              IFSC Code
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {profile.bank_details?.ifscCode || profile.bankIfscCode || profile.bank_ifsc_code || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              Account Number
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {(profile.bank_details?.accountNumber || profile.bankAccountNumber || profile.bank_account_number)
                                ? `****${(profile.bank_details?.accountNumber || profile.bankAccountNumber || profile.bank_account_number).toString().slice(-4)}`
                                : 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
                        No bank details available.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </StandardCard>
    </PageContainer>
  );
}

