import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  MenuItem,
  Switch,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import { uploadApi } from '../../services/uploadApi';

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const [isEdit,setIsEdit] = useState(false)
  const [form,setForm] = useState<any>(null)

  // const [Driver,setDriver] = useState<any>(null)
  const [driverForm,setDriverForm] = useState<any>(null)
  const [driverEdit,setDriverEdit] = useState(false)

  useEffect(() => {
    if (id) {
      loadUserDetails();
    }
  }, [id]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUserDetails(id!);
      console.log('User details received:', data);
      console.log('Driver data:', data.user?.driver);
      console.log('DriverVerifications:', data.user?.driver?.driverVerifications);
      console.log('KYC Documents:', data.user?.driver?.kyc_documents);
      setUser(data.user);
      setForm(data.user)
      setDriverForm(data.user?.driver)

      // const driverData = await adminApi.GetDriverDetailsByUserId(id!);
      // setDriver(driverData.driver);
      // setDriverForm(driverData.driver);

      // console.log('Driver details received:', driverData);

    } catch (err: any) {
      console.error('Error loading user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

    const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDriverChange = (key: string, value: any) => {
    setDriverForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (id: string) => {
    // onSave(form); // API call
    await adminApi.EditUserDetails(id!, form);
    setIsEdit(false);
    await loadUserDetails();
  };

  const handleDriverSave = async (id: string) => {
          // Step 3: Bank Details - All fields required
      if (!driverForm.bank_name || !driverForm.bank_ifsc_code || !driverForm.bank_account_number) {
        alert('Please provide all bank account details');
        return;
      }
      
      // Validate IFSC code format
      const cleanIFSC = driverForm.bank_ifsc_code.replace(/\s/g, '').toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
        alert('Invalid IFSC code format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)');
        return;
      }
      
      // Validate account number (should be numeric)
      const cleanAccountNumber = driverForm.bank_account_number.replace(/\s/g, '');
      if (cleanAccountNumber.length < 9 || cleanAccountNumber.length > 18) {
        alert('Invalid account number. Must be 9-18 digits.');
        return;
      }
      
      if (!/^\d+$/.test(cleanAccountNumber)) {
        alert('Account number must contain only digits');
        return;
      }

        // Update form with cleaned values before saving
        const updatedForm = {
          ...driverForm,
          bank_ifsc_code: cleanIFSC,
          bank_account_number: cleanAccountNumber,
        };
    await adminApi.EditDriverDetails(id!, updatedForm);
    setDriverEdit(false);
    await loadUserDetails();
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      await adminApi.updateUserStatus(user.id, !user.is_active);
      await loadUserDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleViewDocument = async (url: string) => {
    if (!url) {
      console.error('No URL provided for document viewing');
      setError('No document URL provided');
      return;
    }

    setPreviewLoading(true);
    setPreviewDialogOpen(true);
    setPreviewUrl(null);
    setError('');
    
    try {
      console.log('Attempting to view document with URL:', url);
      // Get presigned URL for viewing the document
      const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
      console.log('Presigned URL generated successfully');
      setPreviewUrl(presignedUrl);
    } catch (err: any) {
      console.error('Error getting presigned URL:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        url: url,
      });
      
      // Show error to user
      setError(err.response?.data?.error || err.message || 'Failed to load document. Please try again.');
      
      // Fallback to direct URL if presigned URL fails (might work for public URLs)
      try {
        setPreviewUrl(url);
      } catch (fallbackError) {
        console.error('Fallback URL also failed:', fallbackError);
        setError('Unable to load document. Please check if the document exists and try again.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      aadhar: 'Aadhar Card',
      pan: 'PAN Card',
      driving_license: 'Driving License',
      selfie: 'Selfie',
    };
    return labels[type] || type;
  };

  const isImage = (url: string) => {
    if (!url) return false;
    const urlWithoutParams = url.split('?')[0];
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(urlWithoutParams) || url.includes('image');
  };

  const isPdf = (url: string) => {
    if (!url) return false;
    const urlWithoutParams = url.split('?')[0];
    return /\.pdf$/i.test(urlWithoutParams) || url.includes('pdf');
  };

  // Extract document name from URL
  const getDocumentName = (url: string): string => {
    if (!url) return 'Document';
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      const nameWithoutParams = fileName.split('?')[0];
      // Decode URL encoding
      return decodeURIComponent(nameWithoutParams);
    } catch (error) {
      return 'Document';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/users')} sx={{ mb: 2 }}>
          Back to Users
        </Button>
        <Alert severity="error">{error || 'User not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/users')} sx={{ mr: 2 }}>
          Back to Users
        </Button>
        <Typography variant="h4" fontWeight="bold">
          User Details
        </Typography>
      </Box>

      {/* Basic Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Basic Information
          </Typography>
          

          <Stack direction="row" justifyContent="flex-end" mb={2} spacing={1}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={user.is_active ? 'outlined' : 'contained'}
              color={user.is_active ? 'error' : 'success'}
              startIcon={user.is_active ? <BlockIcon /> : <CheckIcon />}
              onClick={handleToggleStatus}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </Box>
        {!isEdit ? (
          <Button variant="outlined" onClick={() => setIsEdit(true)}>
            Edit
          </Button>
        ) : (
          <>
            <Button variant="contained" onClick={() => handleSave(user.id)}>
              Save
            </Button>
            <Button variant="text" onClick={() => setIsEdit(false)}>
              Cancel
            </Button>
          </>
        )}
      </Stack>
        </Box>



        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {user.first_name} {user.last_name}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Mobile
            </Typography>
            
            {isEdit ? (
            <TextField
              fullWidth
              size="small"
              value={form.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
            />
          ) : (
            <Typography fontWeight="medium">{user.mobile}</Typography>
          )}

          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Email
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {user.email || '-'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Role
            </Typography>
            <Chip label={user.role} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip
              label={user.is_active ? 'Active' : 'Inactive'}
              color={user.is_active ? 'success' : 'default'}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created At
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {new Date(user.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          {user.gender && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Gender
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {user.gender}
              </Typography>
            </Grid>
          )}
          {user.age && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Age
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {user.age}
              </Typography>
            </Grid>
          )}
        </Grid>

      </Paper>

      {/* Driver Bank Details */}
      {user.driver && (
        <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Bank Details
          </Typography>

            <Stack direction="row" justifyContent="flex-end" mb={2} spacing={1}>
        {!driverEdit ? (
          <Button variant="outlined" onClick={() => setDriverEdit(true)}>
            Edit
          </Button>
        ) : (
          <>
            <Button variant="contained" onClick={() => handleDriverSave(user.id)}>
              Save
            </Button>
            <Button variant="text" onClick={() => setDriverEdit(false)}>
              Cancel
            </Button>
          </>
        )}
      </Stack>
        </Box>

       <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Bank Name
            </Typography>
            {driverEdit ? (
            <TextField
              fullWidth
              size="small"
              value={driverForm.bank_name}
              onChange={(e) => handleDriverChange('bank_name', e.target.value)}
            />
            ) : (<Typography variant="body1" fontWeight="medium">
              {user.driver?.bank_name || '-'}
            </Typography>)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              IFSC Code
            </Typography>

            {driverEdit ? (
            <TextField
              fullWidth
              size="small"
              value={driverForm.bank_ifsc_code}
              onChange={(e) => handleDriverChange('bank_ifsc_code', e.target.value)}
            />
          ) : (
            <Typography fontWeight="medium">{user.driver?.bank_ifsc_code || '-'}</Typography>
          )}

          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Account Number
            </Typography>

            {driverEdit ? (
            <TextField
              fullWidth
              size="small"
              value={driverForm.bank_account_number}
              onChange={(e) => handleDriverChange('bank_account_number', e.target.value)}
            />
          ) : (
            <Typography variant="body1" fontWeight="medium">
              {user.driver?.bank_account_number || '-'}
            </Typography>
          )}
          </Grid>
        </Grid>
        </Paper>
        )}
      {/* Customer Information */}
      {user.customer && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Customer Information
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {user.customer.total_bookings || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Wallet Balance
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    ₹{Number(user.customer.wallet_balance || 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed Bookings
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {user.customer.completed_bookings || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {Number(user.customer.average_rating || 0).toFixed(1)} ⭐
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Driver Information */}
      {user.driver && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Driver Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Rides
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {user.driver.total_rides || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    ₹{Number(user.driver.total_earnings || 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Vehicles
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {user.driver.vehicles?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {Number(user.driver.average_rating || 0).toFixed(1)} ⭐
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    KYC Status
                  </Typography>
                  <Chip
                    label={user.driver.kyc_status || 'pending'}
                    color={
                      user.driver.kyc_status === 'approved'
                        ? 'success'
                        : user.driver.kyc_status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Driver Status
                    </Typography>
                    <Chip
                      label={user.driver.is_driver_approved ? 'Approved' : 'Pending'}
                      color={user.driver.is_driver_approved ? 'success' : 'warning'}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* KYC Documents */}
          {(user.driver.driverVerifications && user.driver.driverVerifications.length > 0) || 
           (user.driver.kyc_documents && Object.keys(user.driver.kyc_documents).length > 0) || 
           user.driver.selfie_url ? (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                KYC Documents
              </Typography>
              {user.driver.driverVerifications && user.driver.driverVerifications.length > 0 ? (
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell>Document Number</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Submitted At</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {user.driver.driverVerifications.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {getDocumentTypeLabel(doc.document_type)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {doc.document_number || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doc.status || 'pending'}
                              color={
                                doc.status === 'approved'
                                  ? 'success'
                                  : doc.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {doc.document_url && (
                              <Typography
                                variant="body2"
                                onClick={() => handleViewDocument(doc.document_url)}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(doc.document_url)}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    {/* Aadhar */}
                    {user.driver.kyc_documents?.aadhar && (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Aadhar Card
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Number: {user.driver.aadhar_number || 'N/A'}
                            </Typography>
                            {user.driver.kyc_documents.aadhar && (
                              <Typography
                                variant="body2"
                                onClick={() => handleViewDocument(user.driver.kyc_documents.aadhar)}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  mt: 1,
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(user.driver.kyc_documents.aadhar)}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* PAN */}
                    {user.driver.kyc_documents?.pan && (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              PAN Card
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Number: {user.driver.pan_number || 'N/A'}
                            </Typography>
                            {user.driver.kyc_documents.pan && (
                              <Typography
                                variant="body2"
                                onClick={() => handleViewDocument(user.driver.kyc_documents.pan)}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  mt: 1,
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(user.driver.kyc_documents.pan)}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Driving License */}
                    {user.driver.kyc_documents?.drivingLicense && (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Driving License
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Number: {user.driver.license_number || 'N/A'}
                            </Typography>
                            {user.driver.license_expiry && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Expires: {new Date(user.driver.license_expiry).toLocaleDateString()}
                              </Typography>
                            )}
                            {user.driver.kyc_documents.drivingLicense && (
                              <Typography
                                variant="body2"
                                onClick={() => handleViewDocument(user.driver.kyc_documents.drivingLicense)}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  mt: 1,
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(user.driver.kyc_documents.drivingLicense)}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Selfie */}
                    {user.driver.selfie_url && (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Selfie
                            </Typography>
                            <Typography
                              variant="body2"
                              onClick={() => handleViewDocument(user.driver.selfie_url)}
                              sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                mt: 1,
                                '&:hover': {
                                  color: 'primary.dark',
                                },
                              }}
                            >
                              {getDocumentName(user.driver.selfie_url)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {(!user.driver.kyc_documents || Object.keys(user.driver.kyc_documents).length === 0) && 
                     !user.driver.selfie_url && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="info">No KYC documents found for this driver.</Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                KYC Documents
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                No KYC documents submitted yet.
              </Alert>
            </Paper>
          )}

          {/* Vehicles */}
          {user.driver.vehicles && user.driver.vehicles.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Vehicles
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {user.driver.vehicles.map((vehicle: any) => (
                  <Grid size={{ xs: 12, md: 6 }} key={vehicle.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {vehicle.vehicle_make || vehicle.vehicle_model || vehicle.model || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {vehicle.vehicle_color || vehicle.color || 'N/A'} • {vehicle.vehicle_plate_number || vehicle.plate_number || 'N/A'}
                            </Typography>
                          </Box>
                          <Chip
                            label={vehicle.is_active ? 'Active' : 'Inactive'}
                            color={vehicle.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        {vehicle.outside_photos && vehicle.outside_photos.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Outside Photos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {vehicle.outside_photos.map((photo: string, index: number) => (
                                <Typography
                                  key={index}
                                  variant="body2"
                                  onClick={() => handleViewDocument(photo)}
                                  sx={{
                                    color: 'primary.main',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                      color: 'primary.dark',
                                    },
                                  }}
                                >
                                  {getDocumentName(photo)}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                        {vehicle.inside_photos && vehicle.inside_photos.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Inside Photos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {vehicle.inside_photos.map((photo: string, index: number) => (
                                <Typography
                                  key={index}
                                  variant="body2"
                                  onClick={() => handleViewDocument(photo)}
                                  sx={{
                                    color: 'primary.main',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                      color: 'primary.dark',
                                    },
                                  }}
                                >
                                  {getDocumentName(photo)}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </>
      )}

      {/* Document Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Document Preview</Typography>
            <IconButton
              onClick={() => setPreviewDialogOpen(false)}
              size="small"
              sx={{ ml: 2 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {previewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewUrl ? (
            <Box sx={{ mt: 2 }}>
              {isPdf(previewUrl) ? (
                <Box sx={{ width: '100%' }}>
                  <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px' }}
                    title="Document Preview"
                  />
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Open in new tab
                    </Button>
                  </Box>
                </Box>
              ) : isImage(previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'contain', borderRadius: '8px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.error-fallback')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'error-fallback';
                      errorDiv.style.textAlign = 'center';
                      errorDiv.style.padding = '16px';
                      const errorText = document.createElement('p');
                      errorText.textContent = 'Unable to preview document. The file may be corrupted or the URL is invalid.';
                      errorText.style.color = '#666';
                      errorText.style.marginBottom = '8px';
                      const button = document.createElement('button');
                      button.textContent = 'Open in new tab';
                      button.style.color = '#1976d2';
                      button.style.textDecoration = 'underline';
                      button.style.border = 'none';
                      button.style.background = 'transparent';
                      button.style.cursor = 'pointer';
                      button.style.padding = '8px 16px';
                      button.onclick = () => window.open(previewUrl, '_blank', 'noopener,noreferrer');
                      errorDiv.appendChild(errorText);
                      errorDiv.appendChild(button);
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Preview not available.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Open in new tab
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No document selected
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {previewUrl && (
            <Button
              variant="contained"
              onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Open in New Tab
            </Button>
          )}
          <Button
            onClick={() => {
              setPreviewDialogOpen(false);
              setPreviewUrl('');
              setError('');
            }}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

