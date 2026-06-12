import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { driverApi } from '../../services/driverApi';
import { uploadApi } from '../../services/uploadApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function KYC() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  // KYC Status State - Updated when:
  // 1. Component mounts: Fetched from API (getKYCStatus)
  // 2. After successful KYC submission: Refreshed from API to get updated kycSubmittedAt and documents
  // 3. Variables:
  //    - kycStatus: 'pending' | 'approved' | 'rejected' | null (null = not submitted yet)
  //    - kycSubmittedAt: ISO date string when documents were submitted, null if never submitted
  //    - documents: Array of submitted documents, empty [] if none submitted
  //    - verificationPending: true if submitted within last 2 hours
  //    - estimatedTime: '1-2 hours' when pending
  const [kycStatus, setKycStatus] = useState<{
    kycStatus: string | null;
    verificationPending?: boolean;
    kycSubmittedAt?: string | null;
    kycExpiresAt?: string | null;
    estimatedTime?: string | null;
    documents?: any[];
    isExpired?: boolean;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [kycData, setKycData] = useState({
    aadharNumber: '',
    panNumber: '',
    drivingLicenseNumber: '',
    drivingLicenseExpiry: '',
    selfieUrl: '',
    selfieFile: null as File | null,
    bankName: '',
    bankIfscCode: '',
    bankAccountNumber: '',
    aadharDocument: null as File | null,
    panDocument: null as File | null,
    drivingLicenseDocument: null as File | null,
    aadharUrl: '',
    panUrl: '',
    drivingLicenseUrl: '',
  });
  
  // Camera capture state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Fetch KYC status on component mount
  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        setLoadingStatus(true);
        const status = await driverApi.getKYCStatus();
        setKycStatus(status);
      } catch (error: any) {
        // If status fetch fails, allow form to be shown (might be first time)
        console.error('Error fetching KYC status:', error);
        setKycStatus({ kycStatus: null });
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchKYCStatus();
  }, []);

  const steps = ['Aadhar/PAN', 'Driving License', 'Bank Details', 'Selfie'];
  // steps responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  const handleInputChange = (field: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'file') {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          setError(`File size must be less than 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
          e.target.value = ''; // Clear the input
          return;
        }

        // Just store the file - don't upload to S3 yet
        // Upload will happen when "Submit KYC" is clicked
        setKycData({ ...kycData, [field]: file });
        setError(''); // Clear any previous errors
      }
    } else {
      setKycData({ ...kycData, [field]: e.target.value });
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Step 1: Aadhar/PAN - Either one is required with document
      if (!kycData.aadharNumber && !kycData.panNumber) {
        setError('Please provide either Aadhar number or PAN number');
        return;
      }
      
      // Validate Aadhar if provided
      if (kycData.aadharNumber) {
        const cleanAadhar = kycData.aadharNumber.replace(/\s/g, '');
        if (cleanAadhar.length !== 12 || !/^\d{12}$/.test(cleanAadhar)) {
          setError('Invalid Aadhar number. Must be exactly 12 digits.');
          return;
        }
        if (!kycData.aadharDocument) {
          setError('Please upload Aadhar document');
          return;
        }
      }
      
      // Validate PAN if provided
      if (kycData.panNumber) {
        const cleanPAN = kycData.panNumber.replace(/\s/g, '').toUpperCase();
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
          setError('Invalid PAN number format. Must be like ABCDE1234F');
          return;
        }
        if (!kycData.panDocument) {
          setError('Please upload PAN document');
          return;
        }
      }
    } else if (activeStep === 1) {
      // Step 2: Driving License - All fields required
      if (!kycData.drivingLicenseNumber) {
        setError('Please provide driving license number');
        return;
      }
      
      const cleanLicense = kycData.drivingLicenseNumber.replace(/\s/g, '');
      if (cleanLicense.length < 10) {
        setError('Invalid driving license number. Must be at least 10 characters.');
        return;
      }
      
      if (!kycData.drivingLicenseExpiry) {
        setError('Please provide driving license expiry date');
        return;
      }
      
      // Check if expiry date is in the future
      const expiryDate = new Date(kycData.drivingLicenseExpiry);
      if (expiryDate <= new Date()) {
        setError('Driving license must not be expired');
        return;
      }
      
      if (!kycData.drivingLicenseDocument) {
        setError('Please upload driving license document');
        return;
      }
    } else if (activeStep === 2) {
      // Step 3: Bank Details - All fields required
      if (!kycData.bankName || !kycData.bankIfscCode || !kycData.bankAccountNumber) {
        setError('Please provide all bank account details');
        return;
      }
      
      // Validate IFSC code format
      const cleanIFSC = kycData.bankIfscCode.replace(/\s/g, '').toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
        setError('Invalid IFSC code format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)');
        return;
      }
      
      // Validate account number (should be numeric)
      const cleanAccountNumber = kycData.bankAccountNumber.replace(/\s/g, '');
      if (cleanAccountNumber.length < 9 || cleanAccountNumber.length > 18) {
        setError('Invalid account number. Must be 9-18 digits.');
        return;
      }
      if (!/^\d+$/.test(cleanAccountNumber)) {
        setError('Account number must contain only digits');
        return;
      }
    } else if (activeStep === 3) {
      // Step 4: Selfie - Required
      if (!kycData.selfieFile && !kycData.selfieUrl) {
        setError('Please take a selfie using the camera');
        return;
      }
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePreviewFile = async (file: File | null, url: string | null, name: string) => {
    try {
      if (file) {
        // For local files, create object URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewFile({
          url: objectUrl,
          name: name,
          type: file.type || 'image/jpeg',
        });
        setPreviewDialogOpen(true);
      } else if (url) {
        // For uploaded files, get presigned URL (only when clicked)
        setLoadingPreview(true);
        setPreviewDialogOpen(true);
        setPreviewFile(null); // Clear previous while loading
        
        try {
          const { url: presignedUrl } = await uploadApi.getViewDocumentUrl(url);
          setPreviewFile({
            url: presignedUrl,
            name: name,
            type: url.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          });
        } catch (error) {
          // Fallback to direct URL if presigned URL fails
          console.error('Error getting presigned URL:', error);
          setPreviewFile({
            url: url,
            name: name,
            type: url.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          });
        } finally {
          setLoadingPreview(false);
        }
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      setError('Failed to preview document');
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewFile && previewFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    setPreviewDialogOpen(false);
    setLoadingPreview(false);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Upload all documents to S3 when Submit is clicked
      let aadharUrl = '';
      let panUrl = '';
      let drivingLicenseUrl = '';
      let selfieUrl = '';

      // Upload Aadhar document if provided
      if (kycData.aadharNumber) {
        if (kycData.aadharDocument) {
          const uploadResult = await uploadApi.uploadFile(kycData.aadharDocument, 'aadhar');
          aadharUrl = uploadResult.url;
          // Update state with uploaded URL and clear file reference
          setKycData(prev => ({
            ...prev,
            aadharUrl: uploadResult.url,
            aadharDocument: null,
          }));
        } else if (kycData.aadharUrl && kycData.aadharUrl.startsWith('http')) {
          // Already uploaded (from previous submission)
          aadharUrl = kycData.aadharUrl;
        } else {
          setError('Please upload Aadhar document');
          setLoading(false);
          return;
        }
      }

      // Upload PAN document if provided
      if (kycData.panNumber) {
        if (kycData.panDocument) {
          const uploadResult = await uploadApi.uploadFile(kycData.panDocument, 'pan');
          panUrl = uploadResult.url;
          // Update state with uploaded URL and clear file reference
          setKycData(prev => ({
            ...prev,
            panUrl: uploadResult.url,
            panDocument: null,
          }));
        } else if (kycData.panUrl && kycData.panUrl.startsWith('http')) {
          // Already uploaded (from previous submission)
          panUrl = kycData.panUrl;
        } else {
          setError('Please upload PAN document');
          setLoading(false);
          return;
        }
      }

      // Upload Driving License document
      if (kycData.drivingLicenseDocument) {
        const uploadResult = await uploadApi.uploadFile(kycData.drivingLicenseDocument, 'driving_license');
        drivingLicenseUrl = uploadResult.url;
        // Update state with uploaded URL and clear file reference
        setKycData(prev => ({
          ...prev,
          drivingLicenseUrl: uploadResult.url,
          drivingLicenseDocument: null,
        }));
      } else if (kycData.drivingLicenseUrl && kycData.drivingLicenseUrl.startsWith('http')) {
        // Already uploaded (from previous submission)
        drivingLicenseUrl = kycData.drivingLicenseUrl;
      } else {
        setError('Please upload Driving License document');
        setLoading(false);
        return;
      }

      // Upload Selfie
      if (kycData.selfieFile) {
        const uploadResult = await uploadApi.uploadFile(kycData.selfieFile, 'selfie');
        selfieUrl = uploadResult.url;
        // Update state with uploaded URL and clear file reference
        setKycData(prev => ({
          ...prev,
          selfieUrl: uploadResult.url,
          selfieFile: null,
        }));
      } else if (kycData.selfieUrl && kycData.selfieUrl.startsWith('http')) {
        // Already uploaded (from previous submission)
        selfieUrl = kycData.selfieUrl;
      } else {
        setError('Please take and upload a selfie');
        setLoading(false);
        return;
      }

      // Validate that we have at least one identity document
      if (!aadharUrl && !panUrl) {
        setError('Please provide either Aadhar or PAN document');
        setLoading(false);
        return;
      }

      await driverApi.submitKYC({
        aadharNumber: kycData.aadharNumber,
        panNumber: kycData.panNumber,
        drivingLicenseNumber: kycData.drivingLicenseNumber,
        drivingLicenseExpiry: kycData.drivingLicenseExpiry,
        aadharUrl: aadharUrl,
        panUrl: panUrl,
        drivingLicenseUrl: drivingLicenseUrl,
        selfieUrl: selfieUrl,
        bankName: kycData.bankName,
        bankIfscCode: kycData.bankIfscCode,
        bankAccountNumber: kycData.bankAccountNumber,
      });

      // Refresh KYC status after successful submission
      // This updates: kycStatus, kycSubmittedAt, documents array, verificationPending, estimatedTime
      try {
        const updatedStatus = await driverApi.getKYCStatus();
        setKycStatus(updatedStatus);
      } catch (statusError) {
        console.error('Error refreshing KYC status:', statusError);
        // Continue even if status refresh fails
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/driver/vehicles');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit KYC documents');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking KYC status
  if (loadingStatus) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <StandardCard>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                Checking KYC status...
              </Typography>
            </Box>
          </StandardCard>
        </Box>
      </PageContainer>
    );
  }

  // Show submitted status only if KYC is pending/approved AND documents were actually submitted
  // Check: kycStatus exists, status is pending/approved (not expired), kycSubmittedAt is not null (documents were submitted), and documents array is not empty
  // If expired, show the form for re-verification
  if (
    kycStatus && 
    (kycStatus.kycStatus === 'pending' || (kycStatus.kycStatus === 'approved' && !kycStatus.isExpired)) &&
    kycStatus.kycSubmittedAt !== null &&
    kycStatus.documents &&
    kycStatus.documents.length > 0
  ) {
    const submittedDate = kycStatus.kycSubmittedAt 
      ? new Date(kycStatus.kycSubmittedAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <PageContainer>
        <Box sx={{ maxWidth: 'sm', mx: 'auto' }}>
          <StandardCard>
            <Box sx={{ textAlign: 'center' }}>
              {kycStatus.kycStatus === 'pending' ? (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                    Documents Submitted for Verification
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    Your KYC documents have been submitted and are under review.
                  </Typography>
                  {submittedDate && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Submitted on: {submittedDate}
                    </Typography>
                  )}
                  {kycStatus.estimatedTime && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Estimated verification time: {kycStatus.estimatedTime}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    You'll be notified once the verification is complete.
                  </Typography>
                </>
              ) : (
                <>
                  <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2, mx: 'auto', display: 'block' }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                    KYC Verification Approved
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    Your KYC documents have been verified and approved.
                  </Typography>
                  {submittedDate && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Submitted on: {submittedDate}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => navigate('/driver/vehicles')}
                    sx={{ textTransform: 'none', mt: 2 }}
                  >
                    Continue to Vehicle Details
                  </Button>
                </>
              )}
            </Box>
          </StandardCard>
        </Box>
      </PageContainer>
    );
  }

  // Show success message if documents were just submitted
  if (success) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ maxWidth: 'sm', width: '100%' }}>
            <StandardCard>
              <Box sx={{ textAlign: 'center' }}>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2, mx: 'auto', display: 'block' }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  Documents Submitted Successfully!
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                  Your documents have been submitted. We are verifying your profile. This process usually takes 1-2 hours.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  You'll be notified once the verification is complete.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Redirecting to vehicle details...
                </Typography>
              </Box>
            </StandardCard>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  // Check if KYC is expired and show re-verification message
  const isExpired = kycStatus?.isExpired || false;
  const isExpiredStatus = kycStatus?.kycStatus === 'expired' || (kycStatus?.kycStatus === 'approved' && isExpired);

  return (
    <PageContainer title={isExpiredStatus ? 'KYC Re-verification' : 'KYC Documentation'} subtitle={isExpiredStatus 
      ? 'Please complete re-verification to continue using the platform.'
      : 'Complete your KYC to publish rides. Documents need to be renewed every 6 months.'}>
      {isExpiredStatus && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            KYC Verification Expired
          </Typography>
          <Typography variant="body2">
            Your KYC verification has expired. Please complete re-verification to continue using the platform.
            {kycStatus?.kycExpiresAt && (
              <> Expired on: {new Date(kycStatus.kycExpiresAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</>
            )}
          </Typography>
        </Alert>
      )}

      <StandardCard>
        {!isMobile && (
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}


        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Step 1: Aadhar/PAN */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Identity Proof (Aadhar OR PAN)
            </Typography>

                <TextField
                  label="Aadhar Number"
                  value={kycData.aadharNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only digits
                    setKycData({ ...kycData, aadharNumber: value.substring(0, 12) });
                  }}
                  fullWidth
                  inputProps={{ maxLength: 12 }}
                  helperText="12-digit Aadhar number (required if PAN not provided)"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload Aadhar Document {kycData.aadharNumber && <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => handleInputChange('aadharDocument')(e as any)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Maximum file size: 5MB {kycData.aadharNumber && <Box component="span" sx={{ color: 'error.main' }}>(Required)</Box>}
                  </Typography>
                  {kycData.aadharDocument && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection:{xs:'column',md:'row'},alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          ✓ Selected: {kycData.aadharDocument.name} ({(kycData.aadharDocument.size / (1024 * 1024)).toFixed(2)}MB)
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          onClick={() => handlePreviewFile(kycData.aadharDocument, null, 'Aadhar Document')}
                        >
                          Preview
                        </Button>
                      </Box>
                      <Box
                        component="img"
                        src={URL.createObjectURL(kycData.aadharDocument)}
                        alt="Aadhar preview"
                        sx={{ maxWidth: '100%', maxHeight: 256, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        onClick={() => handlePreviewFile(kycData.aadharDocument, null, 'Aadhar Document')}
                      />
                    </Box>
                  )}
                  {kycData.aadharUrl && !kycData.aadharDocument && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between',flexDirection:{xs:'column',md:'row'}, alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          ✓ Document uploaded
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          onClick={() => handlePreviewFile(null, kycData.aadharUrl, 'Aadhar Document')}
                        >
                          Preview
                        </Button>
                      </Box>
                      <Box
                        component="img"
                        src={kycData.aadharUrl}
                        alt="Aadhar preview"
                        sx={{ maxWidth: '100%', maxHeight: 256, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        onClick={() => handlePreviewFile(null, kycData.aadharUrl, 'Aadhar Document')}
                        onError={(e) => {
                          // If image fails to load, show a link instead
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
                  OR
                </Typography>

                <TextField
                  label="PAN Number"
                  value={kycData.panNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase(); // Only alphanumeric, uppercase
                    setKycData({ ...kycData, panNumber: value.substring(0, 10) });
                  }}
                  fullWidth
                  inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
                  helperText="10-character PAN number (required if Aadhar not provided)"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload PAN Document {kycData.panNumber && <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => handleInputChange('panDocument')(e as any)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Maximum file size: 5MB {kycData.panNumber && <Box component="span" sx={{ color: 'error.main' }}>(Required)</Box>}
                  </Typography>
                  {kycData.panDocument && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between',flexDirection:{xs:'column',md:'row'}, alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          ✓ Selected: {kycData.panDocument.name} ({(kycData.panDocument.size / (1024 * 1024)).toFixed(2)}MB)
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          onClick={() => handlePreviewFile(kycData.panDocument, null, 'PAN Document')}
                        >
                          Preview
                        </Button>
                      </Box>
                      <Box
                        component="img"
                        src={URL.createObjectURL(kycData.panDocument)}
                        alt="PAN preview"
                        sx={{ maxWidth: '100%', maxHeight: 256, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        onClick={() => handlePreviewFile(kycData.panDocument, null, 'PAN Document')}
                      />
                    </Box>
                  )}
                  {kycData.panUrl && !kycData.panDocument && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between',flexDirection:{xs:'column',md:'row'}, alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          ✓ Document uploaded
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          onClick={() => handlePreviewFile(null, kycData.panUrl, 'PAN Document')}
                        >
                          Preview
                        </Button>
                      </Box>
                      <Box
                        component="img"
                        src={kycData.panUrl}
                        alt="PAN preview"
                        sx={{ maxWidth: '100%', maxHeight: 256, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        onClick={() => handlePreviewFile(null, kycData.panUrl, 'PAN Document')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </Box>
                  )}
                </Box>
          </Box>
        )}

            {/* Step 2: Driving License */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Driving License Details
            </Typography>

                <TextField
                  label="Driving License Number *"
                  value={kycData.drivingLicenseNumber}
                  onChange={handleInputChange('drivingLicenseNumber')}
                  required
                  fullWidth
                  helperText="Minimum 10 characters"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <TextField
                  label="License Expiry Date *"
                  type="date"
                  value={kycData.drivingLicenseExpiry}
                  onChange={handleInputChange('drivingLicenseExpiry')}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Must be a future date"
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload Driving License <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => handleInputChange('drivingLicenseDocument')(e as any)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Maximum file size: 5MB <Box component="span" sx={{ color: 'error.main' }}>(Required)</Box>
                  </Typography>
                  {kycData.drivingLicenseDocument && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between',flexDirection:{xs:'column',md:'row'}, alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          ✓ Selected: {kycData.drivingLicenseDocument.name} ({(kycData.drivingLicenseDocument.size / (1024 * 1024)).toFixed(2)}MB)
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          onClick={() => handlePreviewFile(kycData.drivingLicenseDocument, null, 'Driving License Document')}
                        >
                          Preview
                        </Button>
                      </Box>
                      <Box
                        component="img"
                        src={URL.createObjectURL(kycData.drivingLicenseDocument)}
                        alt="Driving License preview"
                        sx={{ maxWidth: '100%', maxHeight: 256, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        onClick={() => handlePreviewFile(kycData.drivingLicenseDocument, null, 'Driving License Document')}
                      />
                    </Box>
                  )}
                  {kycData.drivingLicenseUrl && !kycData.drivingLicenseDocument && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          ✓ Document uploaded
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          onClick={() => handlePreviewFile(null, kycData.drivingLicenseUrl, 'Driving License Document')}
                        >
                          Preview
                        </Button>
                      </Box>
                      <Box
                        component="img"
                        src={kycData.drivingLicenseUrl}
                        alt="Driving License preview"
                        sx={{ maxWidth: '100%', maxHeight: 256, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        onClick={() => handlePreviewFile(null, kycData.drivingLicenseUrl, 'Driving License Document')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </Box>
                  )}
                </Box>
          </Box>
        )}

        {/* Step 3: Bank Details */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Bank Account Details *
            </Typography>

                <TextField
                  label="Bank Name *"
                  value={kycData.bankName}
                  onChange={handleInputChange('bankName')}
                  required
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="IFSC Code *"
                      value={kycData.bankIfscCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                        setKycData({ ...kycData, bankIfscCode: value.substring(0, 11) });
                      }}
                      required
                      fullWidth
                      inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 11 }}
                      helperText="Format: ABCD0123456 (11 characters)"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Account Number *"
                      value={kycData.bankAccountNumber}
                      onChange={(e) =>
                        setKycData({
                          ...kycData,
                          bankAccountNumber: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      required
                      fullWidth
                      helperText="9-18 digits"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              Bank account details are required for receiving payments from rides.
            </Typography>
          </Box>
        )}

        {/* Step 4: Selfie */}
        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Clear Selfie <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>

            {!isCameraOpen ? (
              <Paper sx={{ p: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                <CameraIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                  Take a clear selfie of yourself
                </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      Click below to open your camera
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<CameraIcon />}
                      onClick={async () => {
                        try {
                          // Request camera access
                          const stream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: 'user' }, // Front-facing camera
                            audio: false,
                          });
                          streamRef.current = stream;
                          setIsCameraOpen(true);
                          
                          // Wait for video element to be ready
                          setTimeout(() => {
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                              videoRef.current.play();
                            }
                          }, 100);
                        } catch (error: any) {
                          console.error('Error accessing camera:', error);
                          setError('Could not access camera. Please ensure you have granted camera permissions.');
                        }
                      }}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Open Camera
                    </Button>
                    {kycData.selfieUrl && (
                      <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex',flexDirection:{xs:'column',md:'row'}, justifyContent: 'center', gap: 1, mb: 2 }}>
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            variant="outlined"
                            onClick={() => {
                              if (kycData.selfieFile) {
                                handlePreviewFile(kycData.selfieFile, null, 'Selfie');
                              } else {
                                handlePreviewFile(null, kycData.selfieUrl, 'Selfie');
                              }
                            }}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CameraIcon />}
                            onClick={async () => {
                              try {
                                const stream = await navigator.mediaDevices.getUserMedia({
                                  video: { facingMode: 'user' },
                                  audio: false,
                                });
                                streamRef.current = stream;
                                setIsCameraOpen(true);
                                setTimeout(() => {
                                  if (videoRef.current) {
                                    videoRef.current.srcObject = stream;
                                    videoRef.current.play();
                                  }
                                }, 100);
                              } catch (error: any) {
                                console.error('Error accessing camera:', error);
                                setError('Could not access camera. Please ensure you have granted camera permissions.');
                              }
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Retake
                          </Button>
                        </Box>
                        <Box
                          component="img"
                          src={kycData.selfieUrl}
                          alt="Selfie preview"
                          sx={{ maxWidth: 320, mx: 'auto', borderRadius: 2, boxShadow: 3, cursor: 'pointer' }}
                          onClick={() => {
                            if (kycData.selfieFile) {
                              handlePreviewFile(kycData.selfieFile, null, 'Selfie');
                            } else {
                              handlePreviewFile(null, kycData.selfieUrl, 'Selfie');
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Paper>
                ) : (
                  <Paper sx={{ p: 3, border: '2px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        component="video"
                        ref={videoRef}
                        autoPlay
                        playsInline
                        sx={{ width: '100%', maxWidth: 448, mx: 'auto', borderRadius: 2, maxHeight: 500, objectFit: 'contain' }}
                      />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      <Box sx={{ display: 'flex',flexDirection:{xs:'column',md:'row'}, gap: 1, justifyContent: 'center', mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CameraIcon />}
                          onClick={async () => {
                            if (!videoRef.current || !canvasRef.current) return;

                            try {
                              // Capture photo from video stream
                              const video = videoRef.current;
                              const canvas = canvasRef.current;
                              
                              canvas.width = video.videoWidth;
                              canvas.height = video.videoHeight;
                              
                              const ctx = canvas.getContext('2d');
                              if (!ctx) return;
                              
                              ctx.drawImage(video, 0, 0);
                              
                              // Convert canvas to blob
                              canvas.toBlob(async (blob) => {
                                if (!blob) return;

                                // Stop camera stream
                                if (streamRef.current) {
                                  streamRef.current.getTracks().forEach(track => track.stop());
                                  streamRef.current = null;
                                }
                                setIsCameraOpen(false);

                                try {
                                  setError('');

                                  // Create File from blob
                                  const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

                                  // Validate file size (5MB limit)
                                  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                                  if (file.size > maxSize) {
                                    setError(`File size must be less than 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                                    return;
                                  }

                                  // Store the file and create a local preview URL
                                  // Upload to S3 will happen when "Submit KYC" is clicked
                                  const previewUrl = URL.createObjectURL(blob);
                                  setKycData({ ...kycData, selfieFile: file, selfieUrl: previewUrl });
                                } catch (error: any) {
                                  console.error('Error processing selfie:', error);
                                  setError('Failed to process selfie. Please try again.');
                                  // Show preview with local URL
                                  const previewUrl = URL.createObjectURL(blob);
                                  setKycData({ ...kycData, selfieFile: new File([blob], 'selfie.jpg', { type: 'image/jpeg' }), selfieUrl: previewUrl });
                                }
                              }, 'image/jpeg', 0.9);
                            } catch (error: any) {
                              console.error('Error capturing photo:', error);
                              setError('Failed to capture photo. Please try again.');
                            }
                          }}
                          disabled={loading}
                          sx={{ textTransform: 'none' }}
                        >
                          {loading ? 'Uploading...' : 'Capture Photo'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          onClick={() => {
                            // Stop camera stream
                            if (streamRef.current) {
                              streamRef.current.getTracks().forEach(track => track.stop());
                              streamRef.current = null;
                            }
                            setIsCameraOpen(false);
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ textTransform: 'none', color: 'primary.main' }}
          >
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
              startIcon={loading && <CircularProgress size={20} sx={{ color: 'white' }} />}
            >
              {loading ? 'Submitting...' : 'Submit KYC'}
            </Button>
          )}
        </Box>
      </StandardCard>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={handleClosePreview} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{previewFile?.name || 'Document Preview'}</Typography>
            <IconButton
              onClick={handleClosePreview}
              size="small"
              sx={{ ml: 2 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingPreview ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress />
            </Box>
          ) : previewFile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {previewFile.url.endsWith('.pdf') || previewFile.type === 'application/pdf' ? (
                <Box sx={{ width: '100%' }}>
                  <iframe
                    src={previewFile.url}
                    style={{
                      width: '100%',
                      height: '70vh',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    title={previewFile.name}
                  />
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => window.open(previewFile.url, '_blank', 'noopener,noreferrer')}
                      sx={{ textTransform: 'none' }}
                    >
                      Open in new tab
                    </Button>
                  </Box>
                </Box>
              ) : (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.style.textAlign = 'center';
                    errorDiv.style.padding = '16px';
                    const errorText = document.createElement('p');
                    errorText.textContent = 'Unable to preview document';
                    errorText.style.color = '#666';
                    errorText.style.marginBottom = '8px';
                    const button = document.createElement('button');
                    button.textContent = 'Open in new tab';
                    button.style.color = '#1976d2';
                    button.style.textDecoration = 'underline';
                    button.style.border = 'none';
                    button.style.background = 'transparent';
                    button.style.cursor = 'pointer';
                    button.onclick = () => window.open(previewFile.url, '_blank', 'noopener,noreferrer');
                    errorDiv.appendChild(errorText);
                    errorDiv.appendChild(button);
                    target.parentElement?.appendChild(errorDiv);
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
          {previewFile && (
            <Button
              variant="outlined"
              onClick={() => window.open(previewFile.url, '_blank', 'noopener,noreferrer')}
              sx={{ textTransform: 'none' }}
            >
              Open in new tab
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

