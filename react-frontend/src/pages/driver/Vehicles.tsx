import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  useTheme, 
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { driverApi } from '../../services/driverApi';
import { uploadApi } from '../../services/uploadApi';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';

export default function Vehicles() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showOutsidePhotos, setShowOutsidePhotos] = useState(false);
  const [showInsidePhotos, setShowInsidePhotos] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await driverApi.getVehicles();
      setVehicles(result.vehicles || []);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to load vehicles');
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const [presignedThumbnails, setPresignedThumbnails] = useState<Record<string, string>>({});
  const handleViewVehicle = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDetailsDialogOpen(true);
    setShowOutsidePhotos(false);
    setShowInsidePhotos(false);
    setSelectedImageUrl(null);
    
    // Fetch presigned URLs for thumbnails
    const thumbnailUrls: Record<string, string> = {};
    const allPhotos = [...(vehicle.outside_photos || []), ...(vehicle.inside_photos || [])];
    if (vehicle.vehicle_registration_document) {
      allPhotos.push(vehicle.vehicle_registration_document);
    }

    await Promise.all(allPhotos.map(async (url) => {
      try {
        const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
        thumbnailUrls[url] = presignedUrl;
      } catch (e) {
        console.error('Error getting presigned thumbnail:', e);
      }
    }));
    setPresignedThumbnails(thumbnailUrls);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedVehicle(null);
    setShowOutsidePhotos(false);
    setShowInsidePhotos(false);
  };

  const handleViewImage = async (url: string) => {
    if (!url) {
      console.error('No URL provided for image viewing');
      setError('No document URL provided');
      return;
    }

    setLoadingImage(true);
    setViewDialogOpen(true);
    setSelectedImageUrl(null); // Clear previous URL while loading
    setError(''); // Clear any previous errors
    
    try {
      console.log('Attempting to view document with URL:', url);
      
      // Get presigned URL for viewing the image (only when clicked)
      const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
      console.log('Presigned URL generated successfully');
      setSelectedImageUrl(presignedUrl);
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
        setSelectedImageUrl(url);
      } catch (fallbackError) {
        console.error('Fallback URL also failed:', fallbackError);
        setError('Unable to load document. Please check if the document exists and try again.');
      }
    } finally {
      setLoadingImage(false);
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

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedImageUrl(null);
    setLoadingImage(false);
  };
      // resposnive 
      const theme = useTheme();
      const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageContainer maxWidth="lg" title="My Vehicles">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/driver/vehicles/add')}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add Vehicle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Vehicles List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : vehicles.length === 0 ? (
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
              No vehicles added yet
            </Typography>
          </CardContent>
        </Card>
      ) :isMobile?(
        <Box display="flex" flexDirection="column" gap={2}>
    {vehicles.map((vehicle) => (
      <Paper
        key={vehicle.id}
        sx={{ p: 2, borderRadius: 2 }}
        onClick={() => handleViewVehicle(vehicle)}
      >
        <Box display="flex" justifyContent="space-between" py={0.5}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Vehicle Model
          </Typography>
          <Typography variant="body2">
            {vehicle.vehicle_make || ''} {vehicle.vehicle_model}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" py={0.5}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Color
          </Typography>
          <Typography variant="body2">
            {vehicle.vehicle_color}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" py={0.5}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Plate Number
          </Typography>
          <Typography variant="body2">
            {vehicle.vehicle_plate_number}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" py={0.5}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Status
          </Typography>
          <Chip
            label={vehicle.is_active ? 'Active' : 'Inactive'}
            size="small"
            color={vehicle.is_active ? 'success' : 'default'}
          />
        </Box>

        {/* ACTIONS — UNCHANGED */}
        {vehicle.is_active &&(
        <Box
          mt={2}
          sx={{
            display: 'flex',
            gap: 1,
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/driver/vehicles/edit/${vehicle.id}`)}
          >
            Edit
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteIcon />}
            sx={{
              borderColor: 'error.main',
              color: 'error.main',
            }}
            onClick={async (e) => {
              e.stopPropagation();
              if (
                window.confirm(
                  `Are you sure you want to remove ${vehicle.vehicle_model || 'this vehicle'}?`
                )
              ) {
                await driverApi.deleteVehicle(vehicle.id);
                await loadVehicles();
              }
            }}
          >
            Remove
          </Button>
        </Box>
        )}
      </Paper>
    ))}
         </Box>
        ): (
        
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Vehicle Model</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plate Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {vehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewVehicle(vehicle)}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vehicle.vehicle_make || ''} {vehicle.vehicle_model}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {vehicle.vehicle_color}
                        </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {vehicle.vehicle_plate_number}
                        </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={vehicle.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end',flexDirection:{xs:'column',md:'row'},alignItems:{xs:'stretch',md:'center'} }} onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={!vehicle.is_active}
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/driver/vehicles/edit/${vehicle.id}`)}
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
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DeleteIcon />}
                          disabled={!vehicle.is_active}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            borderColor: 'error.main',
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.light',
                              borderColor: 'error.main',
                            }
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to remove ${vehicle.vehicle_model || 'this vehicle'}?`)) {
                              try {
                                await driverApi.deleteVehicle(vehicle.id);
                                await loadVehicles();
                              } catch (err: any) {
                                alert(err.message || 'Failed to remove vehicle');
                              }
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
            ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Vehicle Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={handleCloseDetailsDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { maxHeight: '90vh' }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Vehicle Details</Typography>
              <Button
                onClick={handleCloseDetailsDialog}
                size="small"
                startIcon={<CloseIcon />}
                sx={{ textTransform: 'none' }}
              >
                Close
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedVehicle && (
              <Grid container spacing={3}>
                {/* Vehicle Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Vehicle Information
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Model</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedVehicle.vehicle_make || ''} {selectedVehicle.vehicle_model}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Color</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedVehicle.vehicle_color}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Plate Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedVehicle.vehicle_plate_number}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Status</Typography>
                        <Chip
                          label={selectedVehicle.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={selectedVehicle.is_active ? 'success' : 'default'}
                        />
                      </Grid>
                      {selectedVehicle.vehicle_registration_document && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Registration Document</Typography>
                          <Typography
                            variant="body2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewImage(selectedVehicle.vehicle_registration_document);
                            }}
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
                            {getDocumentName(selectedVehicle.vehicle_registration_document)}
                          </Typography>
                        </Grid>
                    )}
                    </Grid>
                  </Paper>
                </Grid>

                {/* Outside Photos */}
                {selectedVehicle.outside_photos && selectedVehicle.outside_photos.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Outside Photos
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => {
                          setShowOutsidePhotos(!showOutsidePhotos);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        {showOutsidePhotos ? 'Hide Photos' : `View Photos (${selectedVehicle.outside_photos.length})`}
                      </Button>
                    </Box>
                    {showOutsidePhotos && (
                      <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Grid container spacing={2}>
                          {(selectedVehicle.outside_photos as string[]).map((url: string, index: number) => {
                            return (
                              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '75%', // 4:3 aspect ratio
                                    cursor: 'pointer',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'grey.200',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                    },
                                  }}
                                  onClick={() => handleViewImage(url)}
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'grey.200',
                                    }}
                                  >
                                    {presignedThumbnails[url] ? (
                                      <img 
                                        src={presignedThumbnails[url]} 
                                        alt="Vehicle Outside" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      />
                                    ) : (
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Click to view
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      bgcolor: 'rgba(0,0,0,0.5)',
                                      borderRadius: 1,
                                      p: 0.5,
                                    }}
                                  >
                                    <ViewIcon sx={{ color: 'white', fontSize: 20 }} />
                                  </Box>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Paper>
                    )}
                  </Grid>
                )}

                {/* Inside Photos */}
                {selectedVehicle.inside_photos && selectedVehicle.inside_photos.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Inside Photos
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => {
                          setShowInsidePhotos(!showInsidePhotos);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        {showInsidePhotos ? 'Hide Photos' : `View Photos (${selectedVehicle.inside_photos.length})`}
                      </Button>
                    </Box>
                    {showInsidePhotos && (
                      <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Grid container spacing={2}>
                          {(selectedVehicle.inside_photos as string[]).map((url: string, index: number) => {
                            return (
                              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '75%', // 4:3 aspect ratio
                                    cursor: 'pointer',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'grey.200',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                    },
                                  }}
                                  onClick={() => handleViewImage(url)}
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'grey.200',
                                    }}
                                  >
                                    {presignedThumbnails[url] ? (
                                      <img 
                                        src={presignedThumbnails[url]} 
                                        alt="Vehicle Inside" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      />
                                    ) : (
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Click to view
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      bgcolor: 'rgba(0,0,0,0.5)',
                                      borderRadius: 1,
                                      p: 0.5,
                                    }}
                                  >
                                    <ViewIcon sx={{ color: 'white', fontSize: 20 }} />
                                  </Box>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Paper>
                    )}
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
        </Dialog>

        {/* Image View Dialog */}
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
            {loadingImage ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
              </Box>
            ) : selectedImageUrl ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {selectedImageUrl.toLowerCase().endsWith('.pdf') || selectedImageUrl.includes('application/pdf') ? (
                  <Box sx={{ width: '100%' }}>
                    <iframe
                      src={selectedImageUrl}
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
                        onClick={() => window.open(selectedImageUrl, '_blank', 'noopener,noreferrer')}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Open in new tab
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <img
                    src={selectedImageUrl}
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
                        button.onclick = () => window.open(selectedImageUrl, '_blank', 'noopener,noreferrer');
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
            {selectedImageUrl && (
              <Button
                variant="contained"
                onClick={() => window.open(selectedImageUrl, '_blank', 'noopener,noreferrer')}
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

