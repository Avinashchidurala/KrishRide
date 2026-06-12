import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { sendOTP, verifyOTP } from '../utils/otp';

const router = express.Router();

// Driver Signup - Step 1: Basic Info
router.post('/signup', async (req, res) => {
  try {
    console.log('Driver signup request received:', {
      body: { ...req.body, mobile: req.body.mobile ? '***' : undefined },
    });

    const {
      firstName,
      lastName,
      mobile,
      email,
      gender,
      emergencyContactName,
      emergencyContactMobile,
      agreeTerms,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !mobile) {
      console.error('Driver signup validation failed: missing required fields', {
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasMobile: !!mobile,
      });
      return res.status(400).json({ error: 'First name, last name, and mobile are required' });
    }

    if (!agreeTerms) {
      console.error('Driver signup validation failed: terms not agreed');
      return res.status(400).json({ error: 'Must agree to Terms & Conditions' });
    }

    // Validate mobile number format
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      console.error('Driver signup validation failed: invalid mobile number', {
        mobile,
        cleanMobile,
        length: cleanMobile.length,
      });
      return res.status(400).json({ error: 'Invalid mobile number. Must be 10 digits.' });
    }

    // Send OTP
    console.log('Sending OTP to mobile:', cleanMobile);
    const otpResult = await sendOTP(mobile);
    if (!otpResult.success) {
      console.error('OTP send failed:', otpResult.message);
      return res.status(500).json({ error: otpResult.message || 'Failed to send OTP' });
    }

    console.log('OTP sent successfully to:', cleanMobile);
    res.json({ message: 'OTP sent. Please verify to complete signup.' });
  } catch (error: any) {
    console.error('Driver signup error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

// Driver Signup - Step 2: Verify OTP and Create Account
router.post('/signup/verify', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      gender,
      emergencyContactName,
      emergencyContactMobile,
      referralCode,
      otp,
    } = req.body;

    // Verify OTP
    if (!verifyOTP(mobile, otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Format mobile number consistently (OTP-only authentication)
    const cleanMobile = mobile.replace(/\D/g, '');
    const formattedMobile = `+91${cleanMobile}`;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { mobile: formattedMobile },
    });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user (OTP-only authentication, email is optional)
    user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        mobile: formattedMobile,
        email: email || null, // Email is optional
        gender: gender && gender.trim() !== '' ? gender.trim() : null, // Handle empty strings
        age: 25, // Default, should be collected
        role: 'driver',
        is_phone_verified: true,
        profile_completed: false,
        auth_provider: 'otp', // OTP-only authentication
      },
    });

    // Create driver record (bank details will be added during KYC)
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        bank_name: null, // Bank details will be added during KYC
        bank_ifsc_code: null,
        bank_account_number: null,
        kyc_status: 'pending',
      },
    });

    // Create emergency contact
    if (emergencyContactName && emergencyContactMobile) {
      await prisma.emergencyContact.create({
        data: {
          userId: user.id,
          name: emergencyContactName,
          mobile: emergencyContactMobile,
          is_primary: true,
        },
      });
    }

    // Handle referral code if provided (driver referred by customer)
    // Store referral code in user's provider_id field temporarily for tracking
    // We'll process it when driver posts their first ride
    if (referralCode) {
      // Find the referrer customer
      const referrer = await prisma.customer.findFirst({
        where: {
          referrals: {
            some: {
              referral_code: referralCode,
              status: 'pending',
              refereeId: null,
            },
          },
        },
        include: {
          referrals: {
            where: {
              referral_code: referralCode,
              status: 'pending',
              refereeId: null,
            },
          },
        },
      });

      if (referrer && referrer.referrals.length > 0) {
        const referral = referrer.referrals[0];
        
        // Create a customer record for the driver to track referral
        // This allows us to use the existing referral system
        // The user will have both driver and customer records (same userId, different tables)
        let driverCustomer = await prisma.customer.findUnique({
          where: { userId: user.id },
        });

        if (!driverCustomer) {
          // Create customer record for referral tracking only
          driverCustomer = await prisma.customer.create({
            data: {
              userId: user.id,
            },
          });
        }

        // Update referral record to link to driver's customer record
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            refereeId: driverCustomer.id,
            status: 'pending', // Will be completed after first ride/post
          },
        });
      }
    }

    // Generate token pair (access + refresh)
    const { generateTokenPair, hashRefreshToken } = require('../utils/jwt');
    const tokenPair = generateTokenPair({
      userId: user.id,
      role: user.role,
      mobile: user.mobile,
    });

    // Calculate refresh token expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database (hashed)
    const hashedToken = hashRefreshToken(tokenPair.refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send welcome email and SMS
    try {
      const userName = `${user.first_name} ${user.last_name}`.trim();
      
      // Send welcome SMS
      if (user.mobile) {
        const { sendWelcomeSMS } = await import('../utils/smsService');
        await sendWelcomeSMS(user.mobile, userName, 'driver');
      }

      // Send welcome email
      if (user.email) {
        const { sendWelcomeEmail } = await import('../utils/emailService');
        await sendWelcomeEmail(user.email, userName, 'driver');
      }
    } catch (error) {
      console.error('Error sending welcome notifications:', error);
      // Don't fail the signup if notifications fail
    }

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        mobile: user.mobile,
        role: user.role,
      },
      driver: {
        id: driver.id,
        kycStatus: driver.kyc_status,
      },
      message: 'Driver account created. Please complete KYC to publish rides.',
    });
  } catch (error: any) {
    console.error('Driver signup verify error:', error);
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

// Helper function to upload base64 image to S3
async function uploadBase64ToS3(
  base64Data: string,
  userId: string,
  documentType: string,
  fileName?: string
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { config } = await import('../config/environment');

  const s3Client = new S3Client({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    },
  });

  // Check if AWS credentials are configured
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
    throw new Error('AWS credentials not configured. Please contact support.');
  }

  // Extract base64 data (remove data:image/png;base64, prefix if present)
  const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const buffer = Buffer.from(base64String, 'base64');

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (buffer.length > maxSize) {
    throw new Error(`File size must be less than 5MB. Your file is ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`);
  }

  // Determine content type from base64 prefix or default to image/jpeg
  let contentType = 'image/jpeg';
  if (base64Data.includes('data:image/png')) {
    contentType = 'image/png';
  } else if (base64Data.includes('data:image/jpeg') || base64Data.includes('data:image/jpg')) {
    contentType = 'image/jpeg';
  } else if (base64Data.includes('data:image/webp')) {
    contentType = 'image/webp';
  }

  // Generate file name if not provided
  const fileExtension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const finalFileName = fileName || `document-${Date.now()}.${fileExtension}`;

  // Build S3 key with proper folder structure: kyc/{userId}/{documentType}/{timestamp}-{filename}
  const key = `kyc/${userId}/${documentType}/${Date.now()}-${finalFileName}`;

  const command = new PutObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    return `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;
  } catch (error: any) {
    // Handle AWS-specific errors
    if (error.Code === 'InvalidAccessKeyId' || error.name === 'InvalidAccessKeyId') {
      throw new Error('AWS credentials are invalid. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the server configuration.');
    }
    
    if (error.Code === 'SignatureDoesNotMatch' || error.name === 'SignatureDoesNotMatch') {
      throw new Error('AWS credentials are incorrect. Please verify your AWS_SECRET_ACCESS_KEY.');
    }
    
    if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${config.awsS3Bucket}" does not exist. Please check your AWS_S3_BUCKET configuration.`);
    }
    
    throw error;
  }
}

// Helper function to check if a string is a base64 data URI
function isBase64DataUri(str: string): boolean {
  return str.startsWith('data:') || (str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str));
}

// Helper function to clean S3 URL (remove query parameters/presigned signatures)
function cleanS3Url(url: string | null | undefined): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  if (!url.startsWith('http')) return url;
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (error) {
    return url.split('?')[0];
  }
}

// Submit KYC Documents (Aadhar/PAN/DL + Selfie)
router.post('/kyc', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { 
      aadharNumber, 
      panNumber, 
      drivingLicenseNumber, 
      drivingLicenseExpiry, 
      selfieUrl, 
      selfiePhoto, // Base64 from mobile app
      aadharUrl, 
      aadharPhoto, // Base64 from mobile app
      panUrl, 
      panPhoto, // Base64 from mobile app
      drivingLicenseUrl,
      drivingLicensePhoto, // Base64 from mobile app
      bankName,
      bankIfscCode,
      bankAccountNumber,
    } = req.body;

    // Handle base64 images from mobile app - upload to S3
    let finalAadharUrl = aadharUrl;
    let finalPanUrl = panUrl;
    let finalDrivingLicenseUrl = drivingLicenseUrl;
    let finalSelfieUrl = selfieUrl;

    // Upload base64 images to S3 if provided
    if (aadharPhoto && isBase64DataUri(aadharPhoto)) {
      try {
        finalAadharUrl = await uploadBase64ToS3(aadharPhoto, req.user!.userId, 'aadhar', 'aadhar.jpg');
      } catch (error: any) {
        console.error('Error uploading Aadhar to S3:', error);
        return res.status(500).json({ error: 'Failed to upload Aadhar document to S3' });
      }
    }

    if (panPhoto && isBase64DataUri(panPhoto)) {
      try {
        finalPanUrl = await uploadBase64ToS3(panPhoto, req.user!.userId, 'pan', 'pan.jpg');
      } catch (error: any) {
        console.error('Error uploading PAN to S3:', error);
        return res.status(500).json({ error: 'Failed to upload PAN document to S3' });
      }
    }

    if (drivingLicensePhoto && isBase64DataUri(drivingLicensePhoto)) {
      try {
        finalDrivingLicenseUrl = await uploadBase64ToS3(drivingLicensePhoto, req.user!.userId, 'driving_license', 'driving-license.jpg');
      } catch (error: any) {
        console.error('Error uploading Driving License to S3:', error);
        return res.status(500).json({ error: 'Failed to upload Driving License document to S3' });
      }
    }

    if (selfiePhoto && isBase64DataUri(selfiePhoto)) {
      try {
        finalSelfieUrl = await uploadBase64ToS3(selfiePhoto, req.user!.userId, 'selfie', 'selfie.jpg');
      } catch (error: any) {
        console.error('Error uploading Selfie to S3:', error);
        return res.status(500).json({ error: 'Failed to upload Selfie to S3' });
      }
    }

    // Simple validations - Aadhar OR PAN is required
    if (!aadharNumber && !panNumber) {
      return res.status(400).json({ error: 'Either Aadhar number or PAN number is required' });
    }

    if (aadharNumber && !finalAadharUrl) {
      return res.status(400).json({ error: 'Aadhar document URL is required if Aadhar number is provided' });
    }

    if (panNumber && !finalPanUrl) {
      return res.status(400).json({ error: 'PAN document URL is required if PAN number is provided' });
    }

    if (!drivingLicenseNumber || !finalDrivingLicenseUrl) {
      return res.status(400).json({ error: 'Driving license number and document URL are required' });
    }

    if (!finalSelfieUrl) {
      return res.status(400).json({ error: 'Selfie URL is required' });
    }

    // Validate bank account details
    if (!bankName || !bankIfscCode || !bankAccountNumber) {
      return res.status(400).json({ error: 'Bank account details (name, IFSC code, and account number) are required' });
    }

    // Validate IFSC code format
    // IFSC format: 4 uppercase letters (bank code) + 0 (always) + 6 alphanumeric characters (branch code)
    // Example: SBIN0001234, HDFC0001234
    const cleanIFSC = bankIfscCode.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
      return res.status(400).json({ 
        error: 'Invalid IFSC code format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)' 
      });
    }

    // Validate Aadhar number (12 digits) if provided
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhar number. Must be 12 digits.' });
    }

    // Validate PAN number (format: ABCDE1234F) if provided
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.replace(/\s/g, '').toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN number format. Must be like ABCDE1234F' });
    }

    // Validate driving license number (minimum 10 characters)
    const cleanLicenseNumber = drivingLicenseNumber.replace(/\s/g, '');
    if (cleanLicenseNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid driving license number' });
    }

    // Validate license expiry date (must be future date)
    if (drivingLicenseExpiry) {
      const expiryDate = new Date(drivingLicenseExpiry);
      if (expiryDate <= new Date()) {
        return res.status(400).json({ error: 'Driving license must not be expired' });
      }
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Clean numbers (cleanIFSC already defined above during validation)
    const cleanAadhar = aadharNumber ? aadharNumber.replace(/\s/g, '') : null;
    const cleanPAN = panNumber ? panNumber.replace(/\s/g, '').toUpperCase() : null;
    const cleanLicense = drivingLicenseNumber.replace(/\s/g, '');
    const cleanAccountNumber = bankAccountNumber.replace(/\s/g, '');

    // Store document URLs in structured format (all should be S3 URLs now)
    const documentUrls = {
      aadhar: finalAadharUrl || null,
      pan: finalPanUrl || null,
      drivingLicense: finalDrivingLicenseUrl,
      selfie: finalSelfieUrl,
    };

    // Update driver with KYC info including bank details
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        aadhar_number: cleanAadhar,
        pan_number: cleanPAN,
        license_number: cleanLicense,
        license_expiry: drivingLicenseExpiry ? new Date(drivingLicenseExpiry) : null,
        selfie_url: cleanS3Url(finalSelfieUrl),
        bank_name: bankName,
        bank_ifsc_code: cleanIFSC,
        bank_account_number: cleanAccountNumber,
        kyc_documents: {
          aadhar: cleanS3Url(finalAadharUrl),
          pan: cleanS3Url(finalPanUrl),
          drivingLicense: cleanS3Url(finalDrivingLicenseUrl),
          selfie: cleanS3Url(finalSelfieUrl),
        } as any,
        kyc_status: 'pending',
        kyc_submitted_at: new Date(),
        kyc_expires_at: null, // Will be set after approval
      },
    });

    // Delete existing verification records and create new ones
    await prisma.driverVerification.deleteMany({
      where: { driverId: driver.id },
    });

    // Create driver verification records (only for documents that were provided)
    if (cleanAadhar && finalAadharUrl) {
      await prisma.driverVerification.create({
        data: {
          driverId: driver.id,
          document_type: 'aadhar',
          document_number: cleanAadhar,
          document_url: cleanS3Url(finalAadharUrl)!,
          status: 'pending',
        },
      });
    }

    if (cleanPAN && finalPanUrl) {
      await prisma.driverVerification.create({
        data: {
          driverId: driver.id,
          document_type: 'pan',
          document_number: cleanPAN,
          document_url: cleanS3Url(finalPanUrl)!,
          status: 'pending',
        },
      });
    }

    await prisma.driverVerification.create({
      data: {
        driverId: driver.id,
        document_type: 'driving_license',
        document_number: cleanLicense,
        document_url: cleanS3Url(finalDrivingLicenseUrl)!,
        status: 'pending',
        expires_at: drivingLicenseExpiry ? new Date(drivingLicenseExpiry) : null,
      },
    });

    // Note: Admin will be notified via email/SMS if needed (not via push notifications)

    res.json({
      message: 'KYC documents submitted successfully. Verification will take 1-2 hours.',
      kycStatus: 'pending',
      verificationPending: true,
      estimatedTime: '1-2 hours',
    });
  } catch (error: any) {
    console.error('KYC submission error:', error);
    res.status(500).json({ error: error.message || 'KYC submission failed' });
  }
});

// Get KYC Status
router.get('/kyc/status', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
      include: {
        driverVerifications: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if verification is pending (submitted within last 2 hours)
    const verificationPending = driver.kyc_status === 'pending' && driver.kyc_submitted_at
      ? (Date.now() - new Date(driver.kyc_submitted_at).getTime()) < 2 * 60 * 60 * 1000
      : false;

    // Check if KYC is expired (expires_at is in the past)
    const isExpired = driver.kyc_expires_at 
      ? new Date(driver.kyc_expires_at) < new Date()
      : false;
    
    // If KYC was approved but is now expired, mark as expired
    const effectiveStatus = driver.kyc_status === 'approved' && isExpired 
      ? 'expired' 
      : driver.kyc_status;

    res.json({
      kycStatus: effectiveStatus,
      verificationPending,
      kycVerifiedAt: driver.kyc_verified_at,
      kycExpiresAt: driver.kyc_expires_at,
      kycSubmittedAt: driver.kyc_submitted_at,
      estimatedTime: driver.kyc_status === 'pending' ? '1-2 hours' : null,
      documents: driver.driverVerifications,
      isExpired,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get KYC status' });
  }
});

// Add Vehicle (model, color, number, up to 4 inside photos and 4 outside photos, registration document)
router.post('/vehicles', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { model, color, plateNumber, photos, insidePhotos, outsidePhotos, registrationDocument } = req.body;

    // Log request for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Add vehicle request body:', {
        hasModel: !!model,
        hasColor: !!color,
        hasPlateNumber: !!plateNumber,
        hasPhotos: !!photos,
        photosIsArray: Array.isArray(photos),
        photosLength: Array.isArray(photos) ? photos.length : 'N/A',
        model: typeof model === 'string' ? model.substring(0, 30) : typeof model,
        color: typeof color === 'string' ? color.substring(0, 20) : typeof color,
        plateNumber: typeof plateNumber === 'string' ? plateNumber.substring(0, 20) : typeof plateNumber,
      });
    }

    // Input validation with detailed error messages
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    if (typeof model !== 'string' || model.trim().length === 0) {
      return res.status(400).json({ error: 'Model must be a non-empty string' });
    }

    if (!color) {
      return res.status(400).json({ error: 'Color is required' });
    }

    if (typeof color !== 'string' || color.trim().length === 0) {
      return res.status(400).json({ error: 'Color must be a non-empty string' });
    }

    if (!plateNumber) {
      return res.status(400).json({ error: 'Plate number is required' });
    }

    if (typeof plateNumber !== 'string' || plateNumber.trim().length === 0) {
      return res.status(400).json({ error: 'Plate number must be a non-empty string' });
    }

    // Validate plate number format (basic Indian format: XX##XX#### or similar)
    const cleanPlateNumber = plateNumber.replace(/\s/g, '').toUpperCase();
    if (cleanPlateNumber.length < 8 || cleanPlateNumber.length > 15) {
      return res.status(400).json({ 
        error: `Invalid plate number format. Must be 8-15 characters. Received: "${cleanPlateNumber}" (${cleanPlateNumber.length} characters)` 
      });
    }

    // Support both old format (single photos array) and new format (separate insidePhotos/outsidePhotos)
    let finalInsidePhotos: string[] = [];
    let finalOutsidePhotos: string[] = [];

    if (insidePhotos || outsidePhotos) {
      // New format: separate arrays
      finalInsidePhotos = Array.isArray(insidePhotos) ? insidePhotos : [];
      finalOutsidePhotos = Array.isArray(outsidePhotos) ? outsidePhotos : [];

      // Validate limits: up to 4 inside photos and 4 outside photos
      if (finalInsidePhotos.length > 4) {
        return res.status(400).json({ error: 'Maximum 4 inside photos allowed' });
      }

      if (finalOutsidePhotos.length > 4) {
        return res.status(400).json({ error: 'Maximum 4 outside photos allowed' });
      }

      // Validate at least one photo total
      if (finalInsidePhotos.length === 0 && finalOutsidePhotos.length === 0) {
        return res.status(400).json({ error: 'At least one photo is required' });
      }

      // Validate each photo is a URL
      for (const photo of [...finalInsidePhotos, ...finalOutsidePhotos]) {
        if (!photo || typeof photo !== 'string') {
          return res.status(400).json({ error: 'All photos must be valid URLs' });
        }
      }
    } else if (photos) {
      // Old format: single photos array (backward compatibility)
      if (!Array.isArray(photos)) {
        return res.status(400).json({ error: 'Photos must be an array' });
    }

    if (photos.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

      if (photos.length > 8) {
        return res.status(400).json({ error: 'Maximum 8 photos allowed (4 inside + 4 outside)' });
    }

    // Validate each photo is a URL
    for (const photo of photos) {
      if (!photo || typeof photo !== 'string') {
        return res.status(400).json({ error: 'All photos must be valid URLs' });
      }
      }

      // For backward compatibility: first 2 are outside, rest are inside
      finalOutsidePhotos = photos.slice(0, Math.min(2, photos.length));
      finalInsidePhotos = photos.slice(2);
    } else {
      return res.status(400).json({ error: 'Photos are required (provide either photos array or insidePhotos/outsidePhotos arrays)' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Note: KYC approval is not required to add vehicles
    // Drivers can add vehicles before KYC verification

    const vehicle = await prisma.vehicle.create({
      data: {
        driverId: driver.id,
        vehicle_model: model,
        vehicle_color: color,
        vehicle_plate_number: cleanPlateNumber.toUpperCase(),
        vehicle_registration_document: cleanS3Url(registrationDocument),
        inside_photos: finalInsidePhotos.length > 0 ? (finalInsidePhotos.map(url => cleanS3Url(url)) as any) : undefined,
        outside_photos: finalOutsidePhotos.length > 0 ? (finalOutsidePhotos.map(url => cleanS3Url(url)) as any) : undefined,
        is_active: true,
      },
    });

    console.log(vehicle)

    res.json({ 
      vehicle, 
      message: 'Vehicle added successfully',
      photos: {
        total: finalInsidePhotos.length + finalOutsidePhotos.length,
        outside: finalOutsidePhotos.length,
        inside: finalInsidePhotos.length,
      },
    });
  } catch (error: any) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ error: error.message || 'Failed to add vehicle' });
  }
});

// Get all vehicles for driver
router.get('/vehicles', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ vehicles });
  } catch (error: any) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: error.message || 'Failed to get vehicles' });
  }
});

// Update Vehicle
router.put('/vehicles/:vehicleId', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const { model, color, plateNumber, photos, insidePhotos, outsidePhotos, registrationDocument } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if vehicle belongs to driver
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Validate inputs
    if (model && (typeof model !== 'string' || model.trim().length === 0)) {
      return res.status(400).json({ error: 'Model must be a non-empty string' });
    }

    if (color && (typeof color !== 'string' || color.trim().length === 0)) {
      return res.status(400).json({ error: 'Color must be a non-empty string' });
    }

    if (plateNumber) {
      const cleanPlateNumber = plateNumber.replace(/\s/g, '').toUpperCase();
      if (cleanPlateNumber.length < 8 || cleanPlateNumber.length > 15) {
        return res.status(400).json({ 
          error: `Invalid plate number format. Must be 8-15 characters.` 
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (model) updateData.vehicle_model = model;
    if (color) updateData.vehicle_color = color;
    if (plateNumber) updateData.vehicle_plate_number = plateNumber.replace(/\s/g, '').toUpperCase();
    if (registrationDocument !== undefined) {
      updateData.vehicle_registration_document = cleanS3Url(registrationDocument);
    }

    // Handle photos if provided (support both old and new format)
    if (insidePhotos || outsidePhotos) {
      // New format: separate arrays
      const finalInsidePhotos = Array.isArray(insidePhotos) ? insidePhotos : [];
      const finalOutsidePhotos = Array.isArray(outsidePhotos) ? outsidePhotos : [];

      // Validate limits: up to 4 inside photos and 4 outside photos
      if (finalInsidePhotos.length > 4) {
        return res.status(400).json({ error: 'Maximum 4 inside photos allowed' });
      }

      if (finalOutsidePhotos.length > 4) {
        return res.status(400).json({ error: 'Maximum 4 outside photos allowed' });
      }

      // Validate each photo is a URL
      for (const photo of [...finalInsidePhotos, ...finalOutsidePhotos]) {
        if (!photo || typeof photo !== 'string') {
          return res.status(400).json({ error: 'All photos must be valid URLs' });
        }
      }

      if (finalInsidePhotos.length > 0) updateData.inside_photos = finalInsidePhotos.map(url => cleanS3Url(url));
      if (finalOutsidePhotos.length > 0) updateData.outside_photos = finalOutsidePhotos.map(url => cleanS3Url(url));
    } else if (photos && Array.isArray(photos)) {
      // Old format: single photos array (backward compatibility)
      if (photos.length > 8) {
        return res.status(400).json({ error: 'Maximum 8 photos allowed (4 inside + 4 outside)' });
      }
      
      // Validate each photo is a URL
      for (const photo of photos) {
        if (!photo || typeof photo !== 'string') {
          return res.status(400).json({ error: 'All photos must be valid URLs' });
        }
      }

      // For backward compatibility: first 2 are outside, rest are inside
      const outsidePhotos = photos.slice(0, Math.min(2, photos.length));
      const insidePhotos = photos.slice(2);
      
      if (outsidePhotos.length > 0) updateData.outside_photos = outsidePhotos;
      if (insidePhotos.length > 0) updateData.inside_photos = insidePhotos;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
    });

    res.json({ 
      vehicle, 
      message: 'Vehicle updated successfully',
    });
  } catch (error: any) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: error.message || 'Failed to update vehicle' });
  }
});

// Set active vehicle for rides (ONE active car per ride)
router.put('/vehicles/:vehicleId/activate', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if vehicle belongs to driver
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Set all vehicles to inactive first, then activate the selected one
    await prisma.vehicle.updateMany({
      where: { driverId: driver.id },
      data: { is_active: false },
    });

    const activatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { is_active: true },
    });

    res.json({ 
      vehicle: activatedVehicle, 
      message: 'Vehicle activated successfully. This will be used for new rides.',
    });
  } catch (error: any) {
    console.error('Activate vehicle error:', error);
    res.status(500).json({ error: error.message || 'Failed to activate vehicle' });
  }
});

// Delete Vehicle
router.delete('/vehicles/:vehicleId', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if vehicle belongs to driver
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if vehicle is used in any active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        ride: {
          driverId: driver.id,
        },
        status: {
          in: ['pending', 'confirmed', 'started'],
        },
      },
    });

    if (activeBookings > 0 && vehicle.is_active) {
      return res.status(400).json({ 
        error: 'Cannot delete active vehicle with active bookings. Please cancel or complete bookings first.' 
      });
    }

    // Delete the vehicle
    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete vehicle' });
  }
});

// Get Driver Profile
router.get('/profile', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: {
          include: {
            emergencyContacts: true,
          },
        },
        vehicles: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check verification pending status
    const verificationPending = driver.kyc_status === 'pending' && driver.kyc_submitted_at
      ? (Date.now() - new Date(driver.kyc_submitted_at).getTime()) < 2 * 60 * 60 * 1000
      : false;

    res.json({
      driver: {
        ...driver,
        verificationPending,
        user: {
          firstName: driver.user.first_name,
          lastName: driver.user.last_name,
          mobile: driver.user.mobile,
          email: driver.user.email,
          gender: driver.user.gender,
          emergencyContacts: driver.user.emergencyContacts,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get profile' });
  }
});

// Update Driver Profile
router.put('/profile', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, email, gender, emergencyContactName, emergencyContactMobile } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: driver.userId },
      data: {
        first_name: firstName !== undefined ? firstName : driver.user.first_name,
        last_name: lastName !== undefined ? lastName : driver.user.last_name,
        email: email !== undefined ? email : driver.user.email,
        gender: gender !== undefined && gender !== '' ? gender : driver.user.gender,
      },
    });

    // Update emergency contact if provided
    if (emergencyContactName && emergencyContactMobile) {
      const cleanEmergencyMobile = emergencyContactMobile.replace(/\D/g, '');
      const formattedEmergencyMobile = `+91${cleanEmergencyMobile}`;
      
      const existingContact = await prisma.emergencyContact.findFirst({
        where: { userId: driver.userId, is_primary: true },
      });

      if (existingContact) {
        await prisma.emergencyContact.update({
          where: { id: existingContact.id },
          data: {
            name: emergencyContactName,
            mobile: formattedEmergencyMobile,
          },
        });
      } else {
        await prisma.emergencyContact.create({
          data: {
            userId: driver.userId,
            name: emergencyContactName,
            mobile: formattedEmergencyMobile,
            is_primary: true,
          },
        });
      }
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error: any) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Get Driver Dashboard Stats
router.get('/dashboard/stats', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
      include: {
        rides: {
          include: {
            bookings: true,
          },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Calculate stats
    // Get completed payouts total
    const payoutStats = await prisma.payout.aggregate({
      where: {
        driverId: driver.id,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate stats
    const totalRides = driver.rides.length;
    // totalEarnings now reflects only actual payouts received by the driver
    const totalEarnings = payoutStats._sum.amount ? Number(payoutStats._sum.amount) : 0;
    const totalBookings = driver.rides.reduce((sum, ride) => sum + ride.bookings.length, 0);
    const averageRating = driver.average_rating || 0;

    res.json({
      success: true,
      stats: {
        totalRides,
        totalEarnings,
        totalBookings,
        averageRating: Number(averageRating),
        totalRatings: driver.total_ratings || 0,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get dashboard stats' });
  }
});

export default router;

