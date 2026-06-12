import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/environment';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize S3 client
const s3Client = new S3Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

// Get Presigned URL for Upload
router.post('/presigned-url', authenticate, async (req: AuthRequest, res) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'File name and type required' });
    }

    const key = folder ? `${folder}/${Date.now()}-${fileName}` : `${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    res.json({
      presignedUrl,
      key,
      url: `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`,
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate presigned URL' });
  }
});

// Upload KYC Documents
router.post('/kyc-documents', authenticate, upload.single('document'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: `File size must be less than 5MB. Your file is ${(req.file.size / (1024 * 1024)).toFixed(2)}MB` 
      });
    }

    // Check if AWS credentials are configured
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      console.error('AWS credentials not configured');
      return res.status(500).json({ 
        error: 'File upload service is not configured. Please contact support.' 
      });
    }

    const { documentType } = req.body;
    const file = req.file;

    // Get file extension from original filename or mimetype
    const getFileExtension = (filename: string, mimetype: string): string => {
      if (filename.includes('.')) {
        return filename.split('.').pop()?.toLowerCase() || 'jpg';
      }
      // Fallback to extension from mimetype
      if (mimetype.includes('pdf')) return 'pdf';
      if (mimetype.includes('png')) return 'png';
      if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return 'jpg';
      if (mimetype.includes('webp')) return 'webp';
      return 'jpg';
    };

    const fileExtension = getFileExtension(file.originalname, file.mimetype);
    // Format: {documentType}_userId.extension (e.g., aadhar_12345.jpg)
    const fileName = `${documentType}_${req.user!.userId}.${fileExtension}`;
    const key = `kyc/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline', // Allow inline viewing
    });

    await s3Client.send(command);

    const url = `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;

    res.json({
      url,
      key,
      message: 'Document uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle AWS-specific errors
    if (error.Code === 'InvalidAccessKeyId' || error.name === 'InvalidAccessKeyId') {
      return res.status(500).json({ 
        error: 'AWS credentials are invalid. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the server configuration.' 
      });
    }
    
    if (error.Code === 'SignatureDoesNotMatch' || error.name === 'SignatureDoesNotMatch') {
      return res.status(500).json({ 
        error: 'AWS credentials are incorrect. Please verify your AWS_SECRET_ACCESS_KEY.' 
      });
    }
    
    if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
      return res.status(500).json({ 
        error: `S3 bucket "${config.awsS3Bucket}" does not exist. Please check your AWS_S3_BUCKET configuration.` 
      });
    }

    if (error.name === 'PermanentRedirect' || error.Code === 'PermanentRedirect') {
      // Try to extract the correct endpoint from the error metadata
      const correctEndpoint = error.$metadata?.extendedRequestId || error.endpoint || 'unknown';
      return res.status(500).json({ 
        error: `S3 bucket region mismatch. The bucket "${config.awsS3Bucket}" is in a different region than configured (${config.awsRegion}). Please check your AWS_REGION in the .env file matches the bucket's actual region. To find the correct region, go to AWS Console > S3 > Your bucket > Properties > Bucket location.` 
      });
    }

    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
      return res.status(500).json({ 
        error: `Access denied. Your IAM user doesn't have permission to upload to S3 bucket "${config.awsS3Bucket}". Please attach an S3 policy to your IAM user that grants s3:PutObject permission. See AWS_S3_PERMISSIONS_FIX.md for detailed instructions.` 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to upload document. Please try again or contact support.' 
    });
  }
});

// Upload Base64 Image (for mobile app)
router.post('/base64-image', authenticate, async (req: AuthRequest, res) => {
  try {
    const { base64, fileName, documentType, folder } = req.body;

    if (!base64 || !documentType) {
      return res.status(400).json({ error: 'Base64 data and document type required' });
    }

    // Check if AWS credentials are configured
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      console.error('AWS credentials not configured');
      return res.status(500).json({ 
        error: 'File upload service is not configured. Please contact support.' 
      });
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (buffer.length > maxSize) {
      return res.status(400).json({ 
        error: `File size must be less than 5MB. Your file is ${(buffer.length / (1024 * 1024)).toFixed(2)}MB` 
      });
    }

    // Determine content type from base64 prefix or default to image/jpeg
    let contentType = 'image/jpeg';
    if (base64.includes('data:image/png')) {
      contentType = 'image/png';
    } else if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) {
      contentType = 'image/jpeg';
    } else if (base64.includes('data:image/webp')) {
      contentType = 'image/webp';
    }

    // Get file extension from contentType or fileName
    const getFileExtension = (contentType: string, fileName?: string): string => {
      if (fileName && fileName.includes('.')) {
        return fileName.split('.').pop()?.toLowerCase() || 'jpg';
      }
      if (contentType.includes('png')) return 'png';
      if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
      if (contentType.includes('webp')) return 'webp';
      if (contentType.includes('pdf')) return 'pdf';
      return 'jpg';
    };

    const fileExtension = getFileExtension(contentType, fileName);
    // Format: {documentType}_userId.extension (e.g., aadhar_12345.jpg)
    const finalFileName = `${documentType}_${req.user!.userId}.${fileExtension}`;
    
    // Build S3 key
    let key: string;
    if (folder) {
      key = `${folder}/${finalFileName}`;
    } else {
      key = `kyc/${finalFileName}`;
    }

    const command = new PutObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: 'inline', // Allow inline viewing
    });

    await s3Client.send(command);

    const url = `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;

    res.json({
      url,
      key,
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Base64 upload error:', error);
    
    // Handle AWS-specific errors
    if (error.Code === 'InvalidAccessKeyId' || error.name === 'InvalidAccessKeyId') {
      return res.status(500).json({ 
        error: 'AWS credentials are invalid. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the server configuration.' 
      });
    }
    
    if (error.Code === 'SignatureDoesNotMatch' || error.name === 'SignatureDoesNotMatch') {
      return res.status(500).json({ 
        error: 'AWS credentials are incorrect. Please verify your AWS_SECRET_ACCESS_KEY.' 
      });
    }
    
    if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
      return res.status(500).json({ 
        error: `S3 bucket "${config.awsS3Bucket}" does not exist. Please check your AWS_S3_BUCKET configuration.` 
      });
    }

    if (error.name === 'PermanentRedirect' || error.Code === 'PermanentRedirect') {
      // Try to extract the correct endpoint from the error metadata
      const correctEndpoint = error.$metadata?.extendedRequestId || error.endpoint || 'unknown';
      return res.status(500).json({ 
        error: `S3 bucket region mismatch. The bucket "${config.awsS3Bucket}" is in a different region than configured (${config.awsRegion}). Please check your AWS_REGION in the .env file matches the bucket's actual region. To find the correct region, go to AWS Console > S3 > Your bucket > Properties > Bucket location.` 
      });
    }

    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
      return res.status(500).json({ 
        error: `Access denied. Your IAM user doesn't have permission to upload to S3 bucket "${config.awsS3Bucket}". Please attach an S3 policy to your IAM user that grants s3:PutObject permission. See AWS_S3_PERMISSIONS_FIX.md for detailed instructions.` 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to upload image. Please try again or contact support.' 
    });
  }
});

// Upload Vehicle Photos
router.post('/vehicle-photos', authenticate, upload.array('photos', 8), async (req: AuthRequest, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check if AWS credentials are configured
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      console.error('AWS credentials not configured');
      return res.status(500).json({ 
        error: 'File upload service is not configured. Please contact support.' 
      });
    }

    const files = req.files as Express.Multer.File[];
    const { photoType } = req.body; // 'inside' or 'outside'

    // Validate file sizes (5MB limit per file)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    for (const file of files) {
      if (file.size > maxSize) {
        return res.status(400).json({ 
          error: `File "${file.originalname}" size must be less than 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
        });
      }
    }

    const uploadPromises = files.map(async (file, index) => {
      // Get file extension from original filename or mimetype
      const getFileExtension = (filename: string, mimetype: string): string => {
        if (filename.includes('.')) {
          return filename.split('.').pop()?.toLowerCase() || 'jpg';
        }
        // Fallback to extension from mimetype
        if (mimetype.includes('pdf')) return 'pdf';
        if (mimetype.includes('png')) return 'png';
        if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return 'jpg';
        if (mimetype.includes('webp')) return 'webp';
        return 'jpg';
      };

      const fileExtension = getFileExtension(file.originalname, file.mimetype);
      // Format: vehicle_photo_userId_photoType_index.extension (e.g., vehicle_photo_12345_outside_1.jpg)
      const fileName = `vehicle_photo_${req.user!.userId}_${photoType}_${index + 1}.${fileExtension}`;
      const key = `vehicles/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: config.awsS3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline', // Allow inline viewing
      });

      await s3Client.send(command);

      return `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;
    });

    const urls = await Promise.all(uploadPromises);

    res.json({
      urls,
      message: 'Photos uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle AWS-specific errors
    if (error.Code === 'InvalidAccessKeyId' || error.name === 'InvalidAccessKeyId') {
      return res.status(500).json({ 
        error: 'AWS credentials are invalid. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the server configuration.' 
      });
    }
    
    if (error.Code === 'SignatureDoesNotMatch' || error.name === 'SignatureDoesNotMatch') {
      return res.status(500).json({ 
        error: 'AWS credentials are incorrect. Please verify your AWS_SECRET_ACCESS_KEY.' 
      });
    }
    
    if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
      return res.status(500).json({ 
        error: `S3 bucket "${config.awsS3Bucket}" does not exist. Please check your AWS_S3_BUCKET configuration.` 
      });
    }

    if (error.name === 'PermanentRedirect' || error.Code === 'PermanentRedirect') {
      // Try to extract the correct endpoint from the error metadata
      const correctEndpoint = error.$metadata?.extendedRequestId || error.endpoint || 'unknown';
      return res.status(500).json({ 
        error: `S3 bucket region mismatch. The bucket "${config.awsS3Bucket}" is in a different region than configured (${config.awsRegion}). Please check your AWS_REGION in the .env file matches the bucket's actual region. To find the correct region, go to AWS Console > S3 > Your bucket > Properties > Bucket location.` 
      });
    }

    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
      return res.status(500).json({ 
        error: `Access denied. Your IAM user doesn't have permission to upload to S3 bucket "${config.awsS3Bucket}". Please attach an S3 policy to your IAM user that grants s3:PutObject permission. See AWS_S3_PERMISSIONS_FIX.md for detailed instructions.` 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to upload photos. Please try again or contact support.' 
    });
  }
});

// Get Presigned URL for Viewing Documents
router.get('/view-document/:key(*)', authenticate, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Document key is required' });
    }

    // Check if AWS credentials are configured
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      console.error('AWS credentials not configured');
      return res.status(500).json({ 
        error: 'File viewing service is not configured. Please contact support.' 
      });
    }

    // Decode the key (in case it's URL encoded)
    const decodedKey = decodeURIComponent(key);

    const command = new GetObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: decodedKey,
    });

    // Generate presigned URL valid for 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Redirect to the presigned URL
    res.redirect(presignedUrl);
  } catch (error: any) {
    console.error('Presigned view URL error:', error);
    console.error('Error details:', {
      code: error.Code,
      message: error.Message,
      bucket: config.awsS3Bucket,
      key: req.body.key,
    });
    
    if (error.Code === 'NoSuchKey' || error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Handle AccessDenied errors specifically
    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied' || error.message?.includes('AccessDenied')) {
      return res.status(403).json({ 
        error: 'Access denied to document. Please check IAM permissions.',
        details: 'The IAM user does not have s3:GetObject permission. Please ensure the IAM policy allows GetObject on the S3 bucket.',
        bucket: config.awsS3Bucket,
        suggestion: 'Check your IAM user policy and ensure it includes s3:GetObject permission. Remove any explicit deny policies that might be blocking access. See AWS_S3_IAM_FIX.md for detailed instructions.',
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to generate document view URL',
      details: error.Code || error.name,
    });
  }
});

// Get Presigned URL as JSON (for frontend to use)
router.post('/view-document-url', authenticate, async (req: AuthRequest, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Document key is required' });
    }

    // Check if AWS credentials are configured
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      console.error('AWS credentials not configured');
      return res.status(500).json({ 
        error: 'File viewing service is not configured. Please contact support.' 
      });
    }

    // Log configuration for debugging
    console.log('Presigned URL generation request:', {
      bucket: config.awsS3Bucket,
      region: config.awsRegion,
      key: key,
      accessKeyId: config.awsAccessKeyId.substring(0, 10) + '...', // Partial for security
    });

    // Decode the key if it's URL encoded
    const decodedKey = decodeURIComponent(key);
    console.log('Decoded key:', decodedKey);

    const command = new GetObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: decodedKey,
    });

    // Generate presigned URL valid for 1 hour
    console.log('Generating presigned URL...');
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    console.log('Presigned URL generated successfully');

    res.json({
      url: presignedUrl,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error('Presigned view URL error:', error);
    console.error('Error details:', {
      code: error.Code,
      name: error.name,
      message: error.message,
      bucket: config.awsS3Bucket,
      region: config.awsRegion,
      key: req.body.key,
      stack: error.stack,
    });
    
    if (error.Code === 'NoSuchKey' || error.name === 'NoSuchKey') {
      return res.status(404).json({ 
        error: 'Document not found',
        details: `The key "${req.body.key}" does not exist in bucket "${config.awsS3Bucket}"`,
      });
    }
    
    // Handle AccessDenied errors specifically
    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied' || error.message?.includes('AccessDenied')) {
      return res.status(403).json({ 
        error: 'Access denied to document. Please check IAM permissions.',
        details: error.message || 'The IAM user does not have s3:GetObject permission.',
        bucket: config.awsS3Bucket,
        region: config.awsRegion,
        key: req.body.key,
        suggestion: 'Check your IAM user policy and ensure it includes s3:GetObject permission. Also check for permissions boundaries, service control policies, or explicit deny policies.',
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to generate document view URL',
      details: error.Code || error.name,
      bucket: config.awsS3Bucket,
      region: config.awsRegion,
    });
  }
});

export default router;

