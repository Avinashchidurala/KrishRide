import twilio from 'twilio';
import { config } from '../config/environment';
import prisma from '../config/database';
import { cacheService, cacheKeys, cacheTTL } from '../services/cacheService';

const twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);

export const getMaskedNumber = async (driverMobile: string, customerMobile: string): Promise<string> => {
  try {
    const cacheKey = cacheKeys.maskedNumber(driverMobile, customerMobile);
    
    // Check if masked number already exists in cache
    const cached = await cacheService.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get or create a masked number from Twilio
    if (config.twilioAccountSid && config.twilioAuthToken) {
      // Use Twilio Proxy Service for masked numbers
      // For now, we'll use a simple approach with a shared masked number
      // In production, set up Twilio Proxy Service
      const maskedNumber = config.twilioPhoneNumber; // Use Twilio number as masked
      
      // Cache the masked number
      await cacheService.set(cacheKey, maskedNumber, cacheTTL.maskedNumber);
      return maskedNumber;
    }

    // Fallback: return a placeholder
    return '+91XXXXXXXXXX';
  } catch (error) {
    console.error('Error getting masked number:', error);
    return '+91XXXXXXXXXX';
  }
};

export const assignMaskedNumberToBooking = async (bookingId: string): Promise<string> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          include: {
            driver: {
              include: {
                user: true,
              },
            },
          },
        },
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const driverMobile = booking.ride.driver.user.mobile;
    const customerMobile = booking.customer.user.mobile;

    const maskedNumber = await getMaskedNumber(driverMobile, customerMobile);

    // Note: masked_driver_phone field removed from schema
    // This function now just returns the masked number without storing it

    return maskedNumber;
  } catch (error) {
    console.error('Error assigning masked number:', error);
    throw error;
  }
};

