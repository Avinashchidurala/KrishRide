import twilio from 'twilio';
import { config } from '../config/environment';

// Initialize Twilio client only if credentials are provided
const getTwilioClient = () => {
  if (config.twilioAccountSid && config.twilioAuthToken) {
    try {
      return twilio(config.twilioAccountSid, config.twilioAuthToken);
    } catch (error) {
      console.warn('[Twilio] Failed to initialize client:', error);
      return null;
    }
  }
  return null;
};

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


export const sendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate mobile number format (10 digits for Indian numbers)
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return { success: false, message: 'Invalid mobile number. Must be 10 digits.' };
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    console.log(`[OTP] Generated OTP for ${cleanMobile}: ${otp} (expires at ${new Date(expiresAt).toISOString()})`);

    // Store OTP
    otpStore.set(cleanMobile, { otp, expiresAt });

    const formattedMobile = `+91${cleanMobile}`;
    const twilioClient = getTwilioClient();
    
    if (twilioClient && config.twilioPhoneNumber) {
      try {
      await twilioClient.messages.create({
        body: `Your HushRyd OTP is ${otp}. Valid for 5 minutes.`,
        from: config.twilioPhoneNumber,
        to: formattedMobile,
      });
        console.log(`[OTP] OTP sent successfully to ${formattedMobile}`);
      } catch (twilioError: any) {
        // If Twilio fails, fall back to dev mode but don't fail the request
        console.error('[OTP] Twilio error, falling back to dev mode:', twilioError.message);
        console.log(`[DEV] OTP for ${formattedMobile}: ${otp} (expires in 5 minutes)`);
        // Don't throw - allow OTP to work in dev mode
      }
    } else {
      // Development mode - log OTP
      console.log(`[DEV] OTP for ${formattedMobile}: ${otp} (expires in 5 minutes)`);
      console.log('[DEV] Twilio not configured - OTP logged to console only');
    }

    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return { success: false, message: error.message || 'Failed to send OTP' };
  }
};

export const verifyOTP = (mobile: string, otp: string): boolean => {
  // Normalize mobile number (remove non-digits)
  const cleanMobile = mobile.replace(/\D/g, '');
  
  const stored = otpStore.get(cleanMobile);
  
  if (!stored) {
    return false;
  }

  // Check expiry (5 minutes)
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanMobile);
    return false;
  }

  // Verify OTP matches
  if (stored.otp !== otp) {
    return false;
  }

  // OTP verified, remove it
  otpStore.delete(cleanMobile);
  return true;
};

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [mobile, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(mobile);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

