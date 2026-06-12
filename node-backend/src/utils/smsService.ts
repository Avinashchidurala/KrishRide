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

export const sendSMS = async (
  to: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const twilioClient = getTwilioClient();
    
    // If Twilio is not configured, log and return error
    if (!twilioClient || !config.twilioPhoneNumber) {
      console.warn('[SMS] Twilio not configured. SMS to:', to);
      console.log('[DEV] SMS would be sent:', { to, message });
      return { success: false, message: 'Twilio not configured' };
    }

    // Validate and format phone number
    if (!to || typeof to !== 'string') {
      console.error('[SMS] Invalid phone number provided:', to);
      return { success: false, message: 'Invalid phone number format' };
    }

    // Clean phone number: remove spaces, special chars, keep only digits and +
    const cleanedTo = to.replace(/\s/g, '').replace(/[^\d+]/g, '');
    
    // Format with country code if missing
    const formattedTo = cleanedTo.startsWith('+') ? cleanedTo : `+91${cleanedTo}`;

    console.log(`[SMS] Sending to: ${formattedTo}, Length: ${message.length} chars`);

    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to: formattedTo,
      });
      console.log(`[SMS] ✅ Message sent successfully. SID: ${result.sid}`);
      return { success: true, message: 'SMS sent successfully' };
    } catch (twilioError: any) {
      console.error('[SMS] ❌ Twilio error:', {
        code: twilioError.code,
        message: twilioError.message,
        status: twilioError.status,
        phoneNumber: formattedTo,
      });
      return { success: false, message: `Twilio error: ${twilioError.message}` };
    }
  } catch (error: any) {
    console.error('[SMS] Unexpected error:', error);
    return { success: false, message: error.message || 'Failed to send SMS' };
  }
};

/* OLD CODE (commented out - simple version without error handling)
export const sendSMS = async (
  to: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const twilioClient = getTwilioClient();
    
    if (!twilioClient || !config.twilioPhoneNumber) {
      console.log('[DEV] SMS would be sent:', { to, message });
      return { success: true, message: 'SMS sent (dev mode)' };
    }

    const formattedTo = to.startsWith('+') ? to : `+91${to}`;

    try {
    await twilioClient.messages.create({
      body: message,
      from: config.twilioPhoneNumber,
      to: formattedTo,
    });
    return { success: true, message: 'SMS sent successfully' };
    } catch (twilioError: any) {
      console.error('[SMS] Twilio error:', twilioError.message);
      console.log('[DEV] SMS would be sent:', { to, message });
      // Don't fail - return success in dev mode
      return { success: true, message: 'SMS sent (dev mode - Twilio error)' };
    }
  } catch (error: any) {
    console.error('SMS send error:', error);
    return { success: false, message: error.message || 'Failed to send SMS' };
  }
};
*/

export const sendBookingConfirmationSMS = async (
  mobile: string,
  bookingNumber: string,
  pickupLocation: string,
  dropLocation: string,
  scheduledTime: Date
): Promise<void> => {
  const message = `Your HushRyd booking ${bookingNumber} is confirmed. Route: ${pickupLocation} to ${dropLocation}. Date: ${scheduledTime.toLocaleDateString('en-IN')} at ${scheduledTime.toLocaleTimeString('en-IN')}. Thank you!`;
  await sendSMS(mobile, message);
};

export const sendWhatsApp = async (
  to: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const twilioClient = getTwilioClient();
    
    if (!twilioClient || !config.twilioWhatsAppNumber) {
      console.warn('[WhatsApp] Twilio WhatsApp not configured');
      console.log('[DEV] WhatsApp would be sent:', { to, message });
      return { success: false, message: 'Twilio WhatsApp not configured' };
    }

    // Validate and format phone number
    if (!to || typeof to !== 'string') {
      console.error('[WhatsApp] Invalid phone number provided:', to);
      return { success: false, message: 'Invalid phone number format' };
    }

    // Clean phone number: remove spaces, special chars, keep only digits and +
    const cleanedTo = to.replace(/\s/g, '').replace(/[^\d+]/g, '');
    
    // Format for WhatsApp with country code
    const formattedTo = `whatsapp:${cleanedTo.startsWith('+') ? cleanedTo : `+91${cleanedTo}`}`;

    const payload: any = {
      body: message,
      from: config.twilioWhatsAppNumber,
      to: formattedTo,
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    console.log(`[WhatsApp] Sending to: ${formattedTo}`);

    try {
      const result = await twilioClient.messages.create(payload);
      console.log(`[WhatsApp] ✅ Message sent successfully. SID: ${result.sid}`);
      return { success: true, message: 'WhatsApp sent successfully' };
    } catch (twilioError: any) {
      console.error('[WhatsApp] ❌ Twilio error:', {
        code: twilioError.code,
        message: twilioError.message,
        status: twilioError.status,
        phoneNumber: formattedTo,
      });
      return { success: false, message: `Twilio error: ${twilioError.message}` };
    }
  } catch (error: any) {
    console.error('[WhatsApp] Unexpected error:', error);
    return { success: false, message: error.message || 'Failed to send WhatsApp' };
  }
};

/* OLD CODE (commented out - simple version without proper error handling)
export const sendWhatsApp = async (
  to: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const twilioClient = getTwilioClient();
    
    if (!twilioClient || !config.twilioWhatsAppNumber) {
      console.log('[DEV] WhatsApp would be sent:', { to, message });
      return { success: true, message: 'WhatsApp sent (dev mode)' };
    }

    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+91${to.replace('+', '')}`;

    const payload: any = {
      body: message,
      from: config.twilioWhatsAppNumber,
      to: formattedTo,
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    try {
    await twilioClient.messages.create(payload);
    return { success: true, message: 'WhatsApp sent successfully' };
    } catch (twilioError: any) {
      console.error('[WhatsApp] Twilio error:', twilioError.message);
      console.log('[DEV] WhatsApp would be sent:', { to, message });
      // Don't fail - return success in dev mode
      return { success: true, message: 'WhatsApp sent (dev mode - Twilio error)' };
    }
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, message: error.message || 'Failed to send WhatsApp' };
  }
};
*/

export const sendBookingConfirmationWhatsApp = async (
  mobile: string,
  bookingNumber: string,
  invoiceUrl: string
): Promise<void> => {
  const message = `Your HushRyd booking ${bookingNumber} is confirmed. Please find your invoice: ${invoiceUrl}`;
  await sendWhatsApp(mobile, message, invoiceUrl);
};

export const sendRideBookedSMS = async (
  mobile: string,
  bookingNumber: string,
  pickupLocation: string,
  dropLocation: string,
  scheduledTime: Date
): Promise<void> => {
  const message = `Your HushRyd ride has been booked! Booking #${bookingNumber}\nRoute: ${pickupLocation} to ${dropLocation}\nDate: ${scheduledTime.toLocaleDateString('en-IN')} at ${scheduledTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\nPlease complete payment to confirm your booking.`;
  await sendSMS(mobile, message);
};

export const sendKYCVerifiedSMS = async (
  mobile: string,
  driverName: string,
  status: 'approved' | 'rejected',
  remarks?: string
): Promise<void> => {
  if (status === 'approved') {
    const message = `Dear ${driverName}, Your KYC verification has been approved! You can now publish rides on HushRyd. Thank you for joining us!`;
    await sendSMS(mobile, message);
  } else {
    const rejectionReason = remarks ? ` Reason: ${remarks}` : '';
    const message = `Dear ${driverName}, Your KYC verification has been rejected.${rejectionReason} Please resubmit your documents with correct information.`;
    await sendSMS(mobile, message);
  }
};

export const sendWelcomeSMS = async (
  mobile: string,
  userName: string,
  userRole: 'customer' | 'driver'
): Promise<void> => {
  if (userRole === 'customer') {
    const message = `Welcome to HushRyd, ${userName}! Your account has been created successfully. Start booking rides and enjoy safe, comfortable journeys. Thank you for choosing HushRyd!`;
    await sendSMS(mobile, message);
  } else {
    const message = `Welcome to HushRyd, ${userName}! Your driver account has been created. Complete your KYC verification to start publishing rides and earning. Thank you for joining HushRyd!`;
    await sendSMS(mobile, message);
  }
};

export const sendBookingConfirmationSMSToDriver = async (
  mobile: string,
  driverName: string,
  bookingNumber: string,
  customerName: string,
  pickupLocation: string,
  dropLocation: string,
  scheduledTime: Date,
  passengerCount: number
): Promise<void> => {
  const message = `Dear ${driverName}, New booking confirmed! Booking #${bookingNumber}\nCustomer: ${customerName}\nRoute: ${pickupLocation} to ${dropLocation}\nTime: ${scheduledTime.toLocaleString('en-IN')}\nPassengers: ${passengerCount}\nPlease arrive on time for pickup. Thank you!`;
  await sendSMS(mobile, message);
};

export const sendAdminCreatedUserSMS = async (
  mobile: string,
  userName: string,
  userRole: 'customer' | 'driver' | 'admin',
  webUrl?: string
): Promise<void> => {
  const loginUrl = webUrl || 'https://hushryd.com';
  const roleText = userRole === 'customer' ? 'customer' : userRole === 'driver' ? 'driver' : 'admin';
  const message = `Welcome to HushRyd, ${userName}! Your ${roleText} account has been created. Login at ${loginUrl}/login using your phone number ${mobile} with OTP. Thank you for joining HushRyd!`;
  await sendSMS(mobile, message);
};

