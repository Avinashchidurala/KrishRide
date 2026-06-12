import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import { uploadApi } from '../../services/uploadApi';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';

export default function AdminKYC() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    loadPendingKYC();
  }, []);

  const loadPendingKYC = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getPendingKYC();
      setVerifications(data.verifications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (verification: any, action: 'approved' | 'rejected') => {
    setSelectedVerification(verification);
    setActionType(action);
    setRemarks('');
    setVerifyDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setVerifyDialogOpen(false);
    setSelectedVerification(null);
    setRemarks('');
  };

  const handleVerify = async () => {
    if (!selectedVerification) return;

    try {
      // For the new structure, we need to verify all pending documents for this driver
      // Since the backend expects individual verification IDs, we'll need to update the API
      // For now, let's verify the driver's KYC status directly
      await adminApi.verifyKYC(selectedVerification.driverId, actionType, remarks || undefined);
      handleCloseDialog();
      await loadPendingKYC();
    } catch (err: any) {
      alert(err.message || 'Failed to verify KYC');
    }
  };

  const handleViewDocument = async (url: string) => {
    if (!url) {
      console.error('No URL provided for document viewing');
      setError('No document URL provided');
      return;
    }

    setLoadingDocument(true);
    setViewDialogOpen(true);
    setSelectedDocumentUrl(null); // Clear previous URL while loading
    setError(''); // Clear any previous errors
    
    try {
      console.log('Attempting to view document with URL:', url);
      
      // Get presigned URL for viewing the document (only when clicked)
      const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
      console.log('Presigned URL generated successfully');
      setSelectedDocumentUrl(presignedUrl);
    } catch (error: any) {
      console.error('Error getting presigned URL:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        url: url,
      });
      
      // Show error to user
      setError(error.response?.data?.error || error.message || 'Failed to load document. Please try again.');
      
      // Fallback to direct URL if presigned URL fails (might work for public URLs)
      try {
        setSelectedDocumentUrl(url);
      } catch (fallbackError) {
        console.error('Fallback URL also failed:', fallbackError);
        setError('Unable to load document. Please check if the document exists and try again.');
      }
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedDocumentUrl(null);
    setLoadingDocument(false);
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

  const handleViewUserDetails = async (userId: string, verification?: any) => {
    try {
      setLoadingUserDetails(true);
      setUserDetailsDialogOpen(true);
      const data = await adminApi.getUserDetails(userId);
      setUserDetails(data.user);
      // Store verification data for showing KYC documents
      if (verification) {
        setSelectedVerification(verification);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user details');
      setUserDetailsDialogOpen(false);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleCloseUserDetailsDialog = () => {
    setUserDetailsDialogOpen(false);
    setUserDetails(null);
    // Don't clear selectedVerification here as it might be needed for actions
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="KYC Verification">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {verifications.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No pending KYC verifications
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Driver Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submitted Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Documents</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
          {verifications.map((verification) => (
                <TableRow
                  key={verification.driverId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    handleViewUserDetails(verification.driver?.user?.id, verification);
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {verification.driver?.user?.first_name} {verification.driver?.user?.last_name}
                      </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {verification.driver?.user?.mobile}
                      </Typography>
                  </TableCell>
                  <TableCell>
                    {verification.submittedAt ? (
                      <Typography variant="body2">
                        {new Date(verification.submittedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                          month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        N/A
                      </Typography>
                      )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {verification.documents?.aadhar && (
                        <Chip label="Aadhar" size="small" color="primary" variant="outlined" />
                          )}
                    {verification.documents?.pan && (
                        <Chip label="PAN" size="small" color="primary" variant="outlined" />
                          )}
                    {verification.documents?.driving_license && (
                        <Chip label="DL" size="small" color="primary" variant="outlined" />
                          )}
                    {verification.documents?.selfie && (
                        <Chip label="Selfie" size="small" color="primary" variant="outlined" />
                          )}
                  </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={verification.driver?.kyc_status?.toUpperCase() || 'PENDING'}
                      size="small"
                      color={
                        verification.driver?.kyc_status === 'approved' ? 'success' :
                        verification.driver?.kyc_status === 'rejected' ? 'error' : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      startIcon={<ApproveIcon />}
                      color="success"
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenDialog(verification, 'approved')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Approve
                    </Button>
                    <Button
                      startIcon={<RejectIcon />}
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog(verification, 'rejected')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Reject
                    </Button>
                  </Box>
                  </TableCell>
                </TableRow>
          ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approved' ? 'Approve' : 'Reject'} KYC Verification
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Driver: {selectedVerification?.driver?.user?.first_name} {selectedVerification?.driver?.user?.last_name}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={actionType === 'rejected' ? 'Rejection Reason' : 'Remarks'}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleVerify}
            variant="contained"
            color={actionType === 'approved' ? 'success' : 'error'}
          >
            {actionType === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog 
        open={userDetailsDialogOpen} 
        onClose={handleCloseUserDetailsDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">User Details</Typography>
            <Button
              onClick={handleCloseUserDetailsDialog}
              size="small"
              startIcon={<CloseIcon />}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingUserDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : userDetails ? (
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Personal Information
                </Typography>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userDetails.first_name} {userDetails.last_name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Mobile</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userDetails.mobile}
                      </Typography>
                    </Grid>
                    {userDetails.email && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {userDetails.email}
                        </Typography>
                      </Grid>
                    )}
                    {userDetails.gender && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Gender</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {userDetails.gender}
                        </Typography>
                      </Grid>
                    )}
                    {userDetails.age && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Age</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {userDetails.age}
                        </Typography>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Role</Typography>
                      <Chip 
                        label={userDetails.role?.toUpperCase() || 'N/A'} 
                        size="small" 
                        color={userDetails.role === 'driver' ? 'primary' : userDetails.role === 'customer' ? 'success' : 'default'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Status</Typography>
                      <Chip 
                        label={userDetails.is_active ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={userDetails.is_active ? 'success' : 'default'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Phone Verified</Typography>
                      <Chip 
                        label={userDetails.is_phone_verified ? 'Verified' : 'Not Verified'} 
                        size="small" 
                        color={userDetails.is_phone_verified ? 'success' : 'warning'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Profile Completed</Typography>
                      <Chip 
                        label={userDetails.profile_completed ? 'Yes' : 'No'} 
                        size="small" 
                        color={userDetails.profile_completed ? 'success' : 'default'}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Driver Information */}
              {userDetails.driver && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Driver Information
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>KYC Status</Typography>
                        <Chip 
                          label={userDetails.driver.kyc_status?.toUpperCase() || 'N/A'} 
                          size="small" 
                          color={
                            userDetails.driver.kyc_status === 'approved' ? 'success' :
                            userDetails.driver.kyc_status === 'pending' ? 'warning' :
                            userDetails.driver.kyc_status === 'rejected' ? 'error' : 'default'
                          }
                        />
                      </Grid>
                      {userDetails.driver.license_number && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>License Number</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {userDetails.driver.license_number}
                          </Typography>
                        </Grid>
                      )}
                      {userDetails.driver.license_expiry && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>License Expiry</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(userDetails.driver.license_expiry).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      )}
                      {userDetails.driver.kyc_submitted_at && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>KYC Submitted At</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(userDetails.driver.kyc_submitted_at).toLocaleString()}
                          </Typography>
                        </Grid>
                      )}
                      {userDetails.driver.kyc_verified_at && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>KYC Verified At</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(userDetails.driver.kyc_verified_at).toLocaleString()}
                          </Typography>
                        </Grid>
                      )}
                      {userDetails.driver.rides && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total Rides</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {userDetails.driver.rides?.length || 0}
                          </Typography>
                        </Grid>
                      )}
                      {userDetails.driver.vehicles && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total Vehicles</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {userDetails.driver.vehicles?.length || 0}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* KYC Documents Section */}
              {selectedVerification && selectedVerification.documents && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    KYC Documents
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      {/* Aadhar */}
                      {selectedVerification.documents?.aadhar && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Aadhar Card
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                              Number: {selectedVerification.documents.aadhar.document_number || selectedVerification.driver?.aadhar_number || 'N/A'}
                            </Typography>
                            {selectedVerification.documents.aadhar.document_url && (
                              <Typography
                                variant="body2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDocument(selectedVerification.documents.aadhar.document_url);
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(selectedVerification.documents.aadhar.document_url)}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      )}

                      {/* PAN */}
                      {selectedVerification.documents?.pan && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              PAN Card
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                              Number: {selectedVerification.documents.pan.document_number || selectedVerification.driver?.pan_number || 'N/A'}
                            </Typography>
                            {selectedVerification.documents.pan.document_url && (
                              <Typography
                                variant="body2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDocument(selectedVerification.documents.pan.document_url);
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(selectedVerification.documents.pan.document_url)}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      )}

                      {/* Driving License */}
                      {selectedVerification.documents?.driving_license && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Driving License
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              Number: {selectedVerification.documents.driving_license.document_number || selectedVerification.driver?.license_number || 'N/A'}
                            </Typography>
                            {selectedVerification.driver?.license_expiry && (
                              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                Expires: {new Date(selectedVerification.driver.license_expiry).toLocaleDateString()}
                              </Typography>
                            )}
                            {selectedVerification.documents.driving_license.document_url && (
                              <Typography
                                variant="body2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDocument(selectedVerification.documents.driving_license.document_url);
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(selectedVerification.documents.driving_license.document_url)}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      )}

                      {/* Selfie */}
                      {selectedVerification.documents?.selfie && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Selfie
                            </Typography>
                            {selectedVerification.documents.selfie.document_url && (
                              <Typography
                                variant="body2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDocument(selectedVerification.documents.selfie.document_url);
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                }}
                              >
                                {getDocumentName(selectedVerification.documents.selfie.document_url)}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      )}

                      {/* Bank Details */}
                      {(selectedVerification.driver?.bank_name || selectedVerification.driver?.bank_account_number) && (
                        <Grid size={{ xs: 12 }}>
                          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'primary.light', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Bank Details
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              {selectedVerification.driver?.bank_name && `Bank: ${selectedVerification.driver.bank_name}`}
                              {selectedVerification.driver?.bank_ifsc_code && ` | IFSC: ${selectedVerification.driver.bank_ifsc_code}`}
                              {selectedVerification.driver?.bank_account_number && ` | A/C: ${selectedVerification.driver.bank_account_number.replace(/(.{4})/g, '$1 ').trim()}`}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Customer Information */}
              {userDetails.customer && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Customer Information
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      {userDetails.customer.bookings && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total Bookings</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {userDetails.customer.bookings?.length || 0}
                          </Typography>
                        </Grid>
                      )}
                      {userDetails.customer.savedAddresses && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Saved Addresses</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {userDetails.customer.savedAddresses?.length || 0}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Account Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Account Information
                </Typography>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Created At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userDetails.created_at 
                          ? (() => {
                              try {
                                const date = new Date(userDetails.created_at);
                                if (isNaN(date.getTime())) return 'Invalid Date';
                                return date.toLocaleString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Last Updated</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userDetails.updated_at 
                          ? (() => {
                              try {
                                const date = new Date(userDetails.updated_at);
                                if (isNaN(date.getTime())) return 'Invalid Date';
                                return date.toLocaleString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No user details available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {selectedVerification && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                startIcon={<ApproveIcon />}
                color="success"
                variant="contained"
                onClick={() => {
                  handleCloseUserDetailsDialog();
                  handleOpenDialog(selectedVerification, 'approved');
                }}
              >
                Approve
              </Button>
              <Button
                startIcon={<RejectIcon />}
                color="error"
                variant="outlined"
                onClick={() => {
                  handleCloseUserDetailsDialog();
                  handleOpenDialog(selectedVerification, 'rejected');
                }}
              >
                Reject
              </Button>
            </Box>
          )}
          <Button onClick={handleCloseUserDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleCloseViewDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Document Preview</Typography>
            <IconButton
              onClick={handleCloseViewDialog}
              size="small"
              sx={{ color: 'text.secondary' }}
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
          {loadingDocument ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress />
            </Box>
          ) : selectedDocumentUrl ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {selectedDocumentUrl.toLowerCase().endsWith('.pdf') || selectedDocumentUrl.includes('application/pdf') ? (
                <Box sx={{ width: '100%' }}>
                  <iframe
                    src={selectedDocumentUrl}
                    style={{
                      width: '100%',
                      height: '70vh',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    title="Document preview"
                  />
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => window.open(selectedDocumentUrl, '_blank', 'noopener,noreferrer')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Open in new tab
                    </Button>
                  </Box>
                </Box>
              ) : (
                <img
                  src={selectedDocumentUrl}
                  alt="Document preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
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
                      button.onclick = () => window.open(selectedDocumentUrl, '_blank', 'noopener,noreferrer');
                      errorDiv.appendChild(errorText);
                      errorDiv.appendChild(button);
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
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
      </Dialog>
    </PageContainer>
  );
}
