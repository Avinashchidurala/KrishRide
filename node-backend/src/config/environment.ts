import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m', // Short-lived access token
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your_refresh_secret_key',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Long-lived refresh token

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Backend Public URL (for PayU callbacks and webhooks)
  // In production: https://api.yourdomain.com
  // For local dev with ngrok: https://your-ngrok-url.ngrok.io
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || 'http://localhost:3000',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  // Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',

  // SendGrid
  sendGridApiKey: process.env.SENDGRID_API_KEY || '',
  sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'support@hushryd.com',

  // AWS S3
  awsS3Bucket: process.env.AWS_S3_BUCKET || 'hushryd-documents',
  awsRegion: process.env.AWS_REGION || 'ap-south-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',

  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@hushryd.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',

  // Redis
  redisUrl: process.env.REDIS_URL ,
  
  // || process.env.REDIS_HOST 
  //   ? `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}${process.env.REDIS_PASSWORD ? `?password=${process.env.REDIS_PASSWORD}` : ''}`
  //   : '',
  // redisHost: process.env.REDIS_HOST || 'localhost',
  // redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  // redisPassword: process.env.REDIS_PASSWORD || '',

  adminId: process.env.ADMIN_ID || '',
  driver_charges: parseFloat(process.env.DRIVER_CHARGES || '0'),
} as const;

export const validateEnvironment = (): void => {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn if Razorpay keys are missing (optional but recommended)
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    console.warn('⚠️  Razorpay credentials not configured. Payment gateway will not work.');
    console.warn('   Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
  } else {
    console.log('✅ Razorpay configured');
  }

  // Warn if AWS S3 credentials are missing (optional but required for file uploads)
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
    console.warn('⚠️  AWS S3 credentials not configured. File uploads will not work.');
    console.warn('   Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET in your .env file');
  } else {
    console.log(`✅ AWS S3 configured: Bucket=${config.awsS3Bucket}, Region=${config.awsRegion}`);
  }
};

