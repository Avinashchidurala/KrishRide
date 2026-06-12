import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import { uploadApi } from '../../services/uploadApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminVehicles() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  useEffect(() => {
    // Only load when page or limit changes, not on every search change
    // Search is triggered manually via handleSearch
    loadVehicles();
  }, [page, limit]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getVehicles({
        page: page + 1,
        limit,
        search: search || undefined,
      });
      setVehicles(data.vehicles || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadVehicles();
  };

  const handleView = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (vehicleId: string, isActive: boolean) => {
    try {
      await adminApi.updateVehicleStatus(vehicleId, isActive);
      loadVehicles();
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle({ ...selectedVehicle, is_active: isActive });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle status');
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
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

  if (loading && vehicles.length === 0) {
    return (
      <PageContainer maxWidth="xl" title="Vehicles Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="Vehicles Management" subtitle="Manage all registered vehicles">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            label="Search by Driver Name"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter driver name or mobile"
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Search
          </Button>
          <IconButton onClick={loadVehicles} sx={{ borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Vehicle ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Make & Model</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plate Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No vehicles found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>{vehicle.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {vehicle.driver?.user
                      ? `${vehicle.driver.user.first_name} ${vehicle.driver.user.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vehicle.vehicle_model || 'N/A'}
                    {vehicle.vehicle_make && ` (${vehicle.vehicle_make})`}
                  </TableCell>
                  <TableCell>{vehicle.vehicle_plate_number || 'N/A'}</TableCell>
                  <TableCell>{vehicle.vehicle_year || 'N/A'}</TableCell>
                  <TableCell>{vehicle.vehicle_color || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={vehicle.is_active ? 'Active' : 'Inactive'}
                      color={vehicle.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(vehicle.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleView(vehicle)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                      {vehicle.is_active ? (
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(vehicle.id, false)}
                          color="error"
                        >
                          <DeactivateIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(vehicle.id, true)}
                          color="success"
                        >
                          <ActivateIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => {
          setLimit(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />

      {/* Vehicle Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Vehicle Details</Typography>
            <IconButton
              onClick={() => setDialogOpen(false)}
              size="small"
              sx={{ ml: 2 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Driver
                </Typography>
                <Typography variant="body1">
                  {selectedVehicle.driver?.user
                    ? `${selectedVehicle.driver.user.first_name} ${selectedVehicle.driver.user.last_name} (${selectedVehicle.driver.user.mobile})`
                    : 'N/A'}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Vehicle Model
                  </Typography>
                  <Typography variant="body1">{selectedVehicle.vehicle_model || 'N/A'}</Typography>
                </Grid>
                {selectedVehicle.vehicle_make && (
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Make
                    </Typography>
                    <Typography variant="body1">{selectedVehicle.vehicle_make}</Typography>
                  </Grid>
                )}
                {selectedVehicle.vehicle_year && (
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Year
                    </Typography>
                    <Typography variant="body1">{selectedVehicle.vehicle_year}</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Color
                  </Typography>
                  <Typography variant="body1">{selectedVehicle.vehicle_color || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Plate Number
                  </Typography>
                  <Typography variant="body1">{selectedVehicle.vehicle_plate_number || 'N/A'}</Typography>
                </Grid>
                {selectedVehicle.vehicle_registration_number && (
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Registration Number
                    </Typography>
                    <Typography variant="body1">
                      {selectedVehicle.vehicle_registration_number}
                    </Typography>
                  </Grid>
                )}
                {selectedVehicle.vehicle_registration_document && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Registration Document
                    </Typography>
                    <Typography
                      variant="body2"
                      onClick={() => handleViewDocument(selectedVehicle.vehicle_registration_document)}
                      sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      {getDocumentName(selectedVehicle.vehicle_registration_document)}
                    </Typography>
                  </Grid>
                )}
                {selectedVehicle.vehicle_insurance_expiry && (
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Insurance Expiry
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedVehicle.vehicle_insurance_expiry)}
                    </Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedVehicle.is_active ? 'Active' : 'Inactive'}
                    color={selectedVehicle.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {selectedVehicle.createdAt ? formatDate(selectedVehicle.createdAt) : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              {selectedVehicle.inside_photos && Array.isArray(selectedVehicle.inside_photos) && selectedVehicle.inside_photos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 2 }}>
                    Inside Photos
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedVehicle.inside_photos.map((photo: string, index: number) => (
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
              {selectedVehicle.outside_photos && Array.isArray(selectedVehicle.outside_photos) && selectedVehicle.outside_photos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 2 }}>
                    Outside Photos
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedVehicle.outside_photos.map((photo: string, index: number) => (
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedVehicle && (
            <>
              {selectedVehicle.is_active ? (
                <Button
                  onClick={() => {
                    handleToggleStatus(selectedVehicle.id, false);
                    setDialogOpen(false);
                  }}
                  variant="outlined"
                  color="error"
                  startIcon={<DeactivateIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    handleToggleStatus(selectedVehicle.id, true);
                    setDialogOpen(false);
                  }}
                  variant="contained"
                  color="success"
                  startIcon={<ActivateIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Activate
                </Button>
              )}
            </>
          )}
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
        <DialogActions>
          {selectedDocumentUrl && (
            <Button
              variant="contained"
              onClick={() => window.open(selectedDocumentUrl, '_blank', 'noopener,noreferrer')}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Open in New Tab
            </Button>
          )}
          <Button
            onClick={handleCloseViewDialog}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

