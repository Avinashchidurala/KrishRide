import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Paper,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PhotoCamera as PhotoIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { driverApi } from '../../services/driverApi';
import { uploadApi } from '../../services/uploadApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function AddVehicle() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const isEditMode = !!vehicleId;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    color: '',
    plateNumber: '',
    registrationDocument: null as File | null,
    registrationDocumentUrl: '',
    insidePhotos: [] as File[],
    outsidePhotos: [] as File[],
    existingInsidePhotos: [] as string[],
    existingOutsidePhotos: [] as string[],
  });

  // Load vehicle data if editing
  useEffect(() => {
    if (isEditMode && vehicleId) {
      loadVehicleData();
    }
  }, [isEditMode, vehicleId]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      const result = await driverApi.getVehicles();
      const vehicle = result.vehicles?.find((v: any) => v.id === vehicleId);
      
      if (vehicle) {
        // Parse model to extract make and model
        const modelParts = (vehicle.vehicle_model || '').split(' ');
        const make = modelParts.length > 1 ? modelParts[0] : '';
        const model = modelParts.length > 1 ? modelParts.slice(1).join(' ') : vehicle.vehicle_model || '';
        
        // Fetch presigned URLs for existing photos and documents
        let registrationDocumentUrl = vehicle.vehicle_registration_document || '';
        if (registrationDocumentUrl) {
          try {
            const { url } = await uploadApi.getViewDocumentUrl(registrationDocumentUrl);
            registrationDocumentUrl = url;
          } catch (e) {
            console.error('Error getting presigned URL for registration document:', e);
          }
        }

        const existingInsidePhotos = await Promise.all(
          ((vehicle.inside_photos as string[]) || []).map(async (url) => {
            try {
              const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
              return presignedUrl;
            } catch (e) {
              console.error('Error getting presigned URL for inside photo:', e);
              return url;
            }
          })
        );

        const existingOutsidePhotos = await Promise.all(
          ((vehicle.outside_photos as string[]) || []).map(async (url) => {
            try {
              const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
              return presignedUrl;
            } catch (e) {
              console.error('Error getting presigned URL for outside photo:', e);
              return url;
            }
          })
        );

        setFormData({
          make: make,
          model: model,
          color: vehicle.vehicle_color || '',
          plateNumber: vehicle.vehicle_plate_number || '',
          registrationDocument: null,
          registrationDocumentUrl: registrationDocumentUrl,
          insidePhotos: [],
          outsidePhotos: [],
          existingInsidePhotos: existingInsidePhotos,
          existingOutsidePhotos: existingOutsidePhotos,
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'file') {
      const files = Array.from(e.target.files || []);
      
      // Validate file sizes (5MB limit per file)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const oversizedFiles = files.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        const oversizedFile = oversizedFiles[0];
        setError(`File "${oversizedFile.name}" size must be less than 5MB. Your file is ${(oversizedFile.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = ''; // Clear the input
        return;
      }

      if (field === 'insidePhotos') {
        // Allow up to 4 inside photos (independent of outside photos)
        const MAX_INSIDE_PHOTOS = 4;
        const currentInsideCount = formData.insidePhotos.length;
        const remainingSlots = MAX_INSIDE_PHOTOS - currentInsideCount;
        
        if (remainingSlots <= 0) {
          setError(`Maximum ${MAX_INSIDE_PHOTOS} inside photos allowed. Please remove some photos to add more.`);
          e.target.value = ''; // Clear the input
          return;
        }
        
        const newInsidePhotos = [...formData.insidePhotos, ...files].slice(0, MAX_INSIDE_PHOTOS);
        setFormData({ ...formData, insidePhotos: newInsidePhotos });
        
        if (files.length > remainingSlots) {
          setError(`Maximum ${MAX_INSIDE_PHOTOS} inside photos allowed. Added ${remainingSlots} photo(s), ${files.length - remainingSlots} photo(s) were skipped.`);
        } else {
          setError(''); // Clear any previous errors
        }
      } else if (field === 'outsidePhotos') {
        // Allow up to 4 outside photos (independent of inside photos)
        const MAX_OUTSIDE_PHOTOS = 4;
        const currentOutsideCount = formData.outsidePhotos.length;
        const remainingSlots = MAX_OUTSIDE_PHOTOS - currentOutsideCount;
        
        if (remainingSlots <= 0) {
          setError(`Maximum ${MAX_OUTSIDE_PHOTOS} outside photos allowed. Please remove some photos to add more.`);
          e.target.value = ''; // Clear the input
          return;
        }
        
        const newOutsidePhotos = [...formData.outsidePhotos, ...files].slice(0, MAX_OUTSIDE_PHOTOS);
        setFormData({ ...formData, outsidePhotos: newOutsidePhotos });
        
        if (files.length > remainingSlots) {
          setError(`Maximum ${MAX_OUTSIDE_PHOTOS} outside photos allowed. Added ${remainingSlots} photo(s), ${files.length - remainingSlots} photo(s) were skipped.`);
        } else {
          setError(''); // Clear any previous errors
        }
      }
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.model || formData.model.trim().length === 0) {
      setError('Car model is required');
      return;
    }

    if (!formData.color || formData.color.trim().length === 0) {
      setError('Car color is required');
      return;
    }

    if (!formData.plateNumber || formData.plateNumber.trim().length === 0) {
      setError('Plate number is required');
      return;
    }

    // In edit mode, allow saving if there are existing photos even without new photos
    const hasExistingPhotos = formData.existingInsidePhotos.length > 0 || formData.existingOutsidePhotos.length > 0;
    const hasNewPhotos = formData.insidePhotos.length > 0 || formData.outsidePhotos.length > 0;
    
    if (!isEditMode && !hasNewPhotos) {
      setError('Please upload at least one car photo');
      return;
    }

    if (isEditMode && !hasExistingPhotos && !hasNewPhotos) {
      setError('Please upload at least one car photo');
      return;
    }

    // Validate photo limits: 4 inside photos and 4 outside photos (separate limits)
    if (formData.insidePhotos.length > 4) {
      setError('Maximum 4 inside photos allowed');
      return;
    }
    
    if (formData.outsidePhotos.length > 4) {
      setError('Maximum 4 outside photos allowed');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Combine make and model into a single model string
      const combinedModel = formData.make 
        ? `${formData.make} ${formData.model}`.trim() 
        : formData.model;

      // Upload photos to S3 separately for inside and outside
      const insidePhotoUrls: string[] = [];
      const outsidePhotoUrls: string[] = [];
      
      // Upload outside photos
      // Upload outside photos
      if (formData.outsidePhotos.length > 0) {
        try {
          const uploadedUrls = await uploadApi.uploadVehiclePhotos(
            formData.outsidePhotos,
            'outside'
          );
          outsidePhotoUrls.push(...uploadedUrls);
        } catch (uploadError: any) {
          console.error('Error uploading photos:', uploadError);
          setError(
            `Failed to upload photos: ${
              uploadError.response?.data?.error || uploadError.message
            }`
          );
          setSaving(false);
          return;
        }
      }


      // Upload inside photos
      // Upload inside photos
      if (formData.insidePhotos.length > 0) {
        try {
          const uploadedUrls = await uploadApi.uploadVehiclePhotos(
            formData.insidePhotos,
            'inside'
          );
          insidePhotoUrls.push(...uploadedUrls);
        } catch (uploadError: any) {
          console.error('Error uploading photos:', uploadError);
          setError(
            `Failed to upload photos: ${
              uploadError.response?.data?.error || uploadError.message
            }`
          );
          setSaving(false);
          return;
        }
      }


      // Upload registration document if provided (new file)
      let registrationDocumentUrl = formData.registrationDocumentUrl || '';
      if (formData.registrationDocument) {
        try {
          const uploadResult = await uploadApi.uploadFile(formData.registrationDocument, 'vehicle_registration', 'vehicles');
          registrationDocumentUrl = uploadResult.url;
        } catch (uploadError: any) {
          console.error('Error uploading registration document:', uploadError);
          setError(`Failed to upload registration document: ${uploadError.response?.data?.error || uploadError.message}`);
          setSaving(false);
          return;
        }
      }

      if (isEditMode && vehicleId) {
        // Update existing vehicle
        const vehicleData: any = {
          model: combinedModel.trim(),
          color: formData.color.trim(),
          plateNumber: formData.plateNumber.trim(),
        };
        
        // Combine existing photos with new ones, keeping them separate
        const finalInsidePhotos = [...formData.existingInsidePhotos, ...insidePhotoUrls];
        const finalOutsidePhotos = [...formData.existingOutsidePhotos, ...outsidePhotoUrls];
        
        // Only update photos if we have photos to send
        if (finalInsidePhotos.length > 0 || finalOutsidePhotos.length > 0) {
          vehicleData.insidePhotos = finalInsidePhotos;
          vehicleData.outsidePhotos = finalOutsidePhotos;
        }
        
        if (registrationDocumentUrl) {
          vehicleData.registrationDocument = registrationDocumentUrl;
        }

         console.log(vehicleData)

        await driverApi.updateVehicle(vehicleId, vehicleData);
      } else {
        // Validate that we have at least one photo URL for new vehicle
        if (insidePhotoUrls.length === 0 && outsidePhotoUrls.length === 0) {
          setError('Failed to upload photos. Please try again.');
          setSaving(false);
          return;
        }

        // Create new vehicle with separate inside and outside photos
        const vehicleData = {
          model: combinedModel.trim(),
          color: formData.color.trim(),
          plateNumber: formData.plateNumber.trim(),
          insidePhotos: insidePhotoUrls,
          outsidePhotos: outsidePhotoUrls,
          registrationDocument: registrationDocumentUrl || undefined,
        };

        console.log(vehicleData)

        await driverApi.addVehicle(vehicleData);
      }

      setSuccess(true);
      // Navigate back to vehicles list after 1 second
      setTimeout(() => {
        navigate('/driver/vehicles');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add vehicle');
      console.error('Error adding vehicle:', err);
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = (type: 'inside' | 'outside', index: number) => {
    if (type === 'inside') {
      setFormData({
        ...formData,
        insidePhotos: formData.insidePhotos.filter((_, i) => i !== index),
      });
    } else {
      setFormData({
        ...formData,
        outsidePhotos: formData.outsidePhotos.filter((_, i) => i !== index),
      });
    }
  };
  const removeExistingPhoto = (type: 'inside' | 'outside', index: number) => {
  if (type === 'inside') {
    setFormData({
      ...formData,
      existingInsidePhotos: formData.existingInsidePhotos.filter((_, i) => i !== index),
    });
  } else {
    setFormData({
      ...formData,
      existingOutsidePhotos: formData.existingOutsidePhotos.filter((_, i) => i !== index),
    });
  }
};


  return (
    <PageContainer maxWidth="md" title={isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'} showBackButton onBack={() => navigate('/driver/vehicles')}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <StandardCard>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {isEditMode ? 'Vehicle updated successfully! Redirecting...' : 'Vehicle added successfully! Redirecting...'}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Car Make"
                      value={formData.make}
                      onChange={handleInputChange('make')}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Car Model"
                      value={formData.model}
                      onChange={handleInputChange('model')}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Color"
                      value={formData.color}
                      onChange={handleInputChange('color')}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Plate Number"
                      value={formData.plateNumber}
                      onChange={handleInputChange('plateNumber')}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>

                {/* Registration Document */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Car Registration Document
                  </Typography>
                  {formData.registrationDocument ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Paper sx={{ position: 'relative', p: 2, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                        {formData.registrationDocument.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(formData.registrationDocument)}
                            alt="Registration Document"
                            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          <Box sx={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
                            <Typography variant="caption">PDF</Typography>
                          </Box>
                        )}
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                          onClick={() => setFormData({ ...formData, registrationDocument: null })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formData.registrationDocument.name}
                      </Typography>
                    </Box>
                  ) : formData.registrationDocumentUrl ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Paper sx={{ position: 'relative', p: 2, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <img
                          src={formData.registrationDocumentUrl}
                          alt="Registration Document"
                          style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                          onClick={() => setFormData({ ...formData, registrationDocumentUrl: '', registrationDocument: null })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Current Registration Document
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoIcon />}
                      sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'primary.main', color: 'primary.main', '&:hover': { borderColor: 'primary.dark', bgcolor: 'primary.light' } }}
                    >
                      Upload Registration Document
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (file.size > maxSize) {
                              setError(`File size must be less than 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                              return;
                            }
                            setFormData({ ...formData, registrationDocument: file });
                            setError('');
                          }
                        }}
                      />
                    </Button>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Max 5MB (Image or PDF)
                  </Typography>
                </Box>

                {/* Show existing photos in edit mode */}
                {isEditMode && (formData.existingInsidePhotos.length > 0 || formData.existingOutsidePhotos.length > 0) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                      Existing Photos
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {formData.existingOutsidePhotos.map((url: string, index: number) => (
                        <Paper key={`outside-${index}`} sx={{ position: 'relative', p: 1, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <img
                            src={url}
                            alt={`Existing Outside ${index + 1}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                          />
                          <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'error.dark' },
                              }}
                              onClick={() => removeExistingPhoto('outside', index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                      ))}
                      {formData.existingInsidePhotos.map((url: string, index: number) => (
                        <Paper key={`inside-${index}`} sx={{ position: 'relative', p: 1, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <img
                            src={url}
                            alt={`Existing Inside ${index + 1}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                          />
                          <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'error.dark' },
                              }}
                              onClick={() => removeExistingPhoto('inside', index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Add new photos below to replace or add to existing ones
                    </Typography>
                  </Box>
                )}

                {/* Inside Photos */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {isEditMode ? 'Add Inside Photos (up to 4)' : 'Inside Photos (up to 4)'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    {formData.insidePhotos.map((photo, index) => (
                      <Paper key={index} sx={{ position: 'relative', p: 1, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Inside ${index + 1}`}
                          style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                          onClick={() => removePhoto('inside', index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                    {formData.insidePhotos.length < 4 && (
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PhotoIcon />}
                          sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'primary.main', color: 'primary.main', height: 96, '&:hover': { borderColor: 'primary.dark', bgcolor: 'primary.light' } }}
                        >
                          Add Inside Photo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            multiple
                            onChange={handleInputChange('insidePhotos')}
                          />
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Max 5MB per file
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Outside Photos */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {isEditMode ? 'Add Outside Photos (up to 4)' : 'Outside Photos (up to 4)'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    {formData.outsidePhotos.map((photo, index) => (
                      <Paper key={index} sx={{ position: 'relative', p: 1, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Outside ${index + 1}`}
                          style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                          onClick={() => removePhoto('outside', index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                    {formData.outsidePhotos.length < 4 && (
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PhotoIcon />}
                          sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'primary.main', color: 'primary.main', height: 96, '&:hover': { borderColor: 'primary.dark', bgcolor: 'primary.light' } }}
                        >
                          Add Outside Photo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            multiple
                            onChange={handleInputChange('outsidePhotos')}
                          />
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Max 5MB per file
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/driver/vehicles')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{ textTransform: 'none', borderRadius: 2, ml: 'auto' }}
                    startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
                  >
                    {saving ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Vehicle' : 'Add Vehicle')}
                  </Button>
                </Box>
            </Box>
          </form>
        </StandardCard>
      )}
    </PageContainer>
  );
}

