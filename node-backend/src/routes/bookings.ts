import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { generateBookingNumber } from '../utils/helpers';
import { processCustomerReferralBonus } from './referrals';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { sendBookingConfirmationEmail, sendEmail } from '../utils/emailService';
import { sendBookingConfirmationSMS, sendSMS, sendBookingConfirmationWhatsApp } from '../utils/smsService';
import { assignMaskedNumberToBooking } from '../utils/maskedNumbers';
import { cacheService } from '../services/cacheService';
import { asyncHandler, sendErrorResponse, sendSuccessResponse, ApiError } from '../utils/errors';
import { ErrorCode } from '../utils/errorCodes';
import { config } from '../config/environment';

const router = express.Router();

// Helper function to extract city from location string (simple extraction)
const extractCityFromLocation = (location: string): string | null => {
  // Simple city extraction - in production, use reverse geocoding
  // For now, extract city from location string (assumes format includes city name)
  // Common Indian cities
  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
  for (const city of cities) {
    if (location.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  return null;
};

// Create Booking (Apply surge before booking, show in breakdown, lock fare)
router.post('/', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    let { 
      rideId, 
      passengerCount, 
      paymentMethod,
      initialPricePerSeat,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      pickupLocation,
      dropLocation,
    } = req.body;

    console.log("Create booking request body:", req.body);

     passengerCount = Number(passengerCount)

    // Input validation
    if (!rideId || typeof rideId !== 'string') {
      console.log("Valid ride ID is required")
      return res.status(400).json({ error: 'Valid ride ID is required' });
    }

    if (!passengerCount || typeof passengerCount !== 'number' || passengerCount < 1 || passengerCount > 10) {
      console.log("passenger count must be number")
      return res.status(400).json({ error: 'Passenger count must be between 1 and 10' });
    }


    if (paymentMethod && typeof paymentMethod !== 'string') {
      console.log("Invalid payment method")
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if(!initialPricePerSeat){
      console.log("Initial price per seat is required")
      return res.status(400).json({ error: 'Initial price per seat is required' });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                mobile: true,
                email: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: { in: ['confirmed', 'started'] },
          },
        },
      },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Use transaction to prevent race conditions on seat availability
    const bookingResult = await prisma.$transaction(async (tx) => {
      // Re-fetch ride with lock to prevent race conditions (within transaction)
      const rideWithLock = await tx.ride.findUnique({
        where: { id: rideId },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  mobile: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!rideWithLock) {
        throw new Error('Ride not found');
      }

      if (rideWithLock.status !== 'active') {
        throw new Error('Ride is not available for booking');
      }

      // Check seat availability using seats_booked field
      const availableSeats = rideWithLock.seats_available - rideWithLock.seats_booked;

      if (passengerCount > availableSeats) {
        throw new Error('Not enough seats available');
      }


      // Get surge pricing settings (per city or global) - APPLY BEFORE BOOKING
      const city = extractCityFromLocation(rideWithLock.start_location) || extractCityFromLocation(rideWithLock.end_location);
      let surgeSettings;
      
      if (city) {
        const cityCacheKey = `admin:surge-pricing-settings:city:${city}`;
        surgeSettings = await cacheService.get(cityCacheKey);
      }
      
      if (!surgeSettings) {
        const globalCacheKey = 'admin:surge-pricing-settings:global';
        const globalSettings = await cacheService.get(globalCacheKey);
        surgeSettings = globalSettings || {
          enabled: true,
          multiplier: 1.25,
          basePricePerKm: 7,
          scope: 'global',
        };
      }

      // Calculate base fare - use full route pricing only
      let appliedSurgeMultiplier = 1.0;
      let surgeAmount = 0;

      // Customer pays: price_per_seat + ₹10 platform fee per seat
      // Driver receives: price_per_seat - ₹20 platform fee per seat
      const basePricePerSeat = Math.round(Number(initialPricePerSeat));
      const customerPlatformFeePerSeat = 10; // ₹10 per seat (customer platform fee)
      const driverPlatformFeePerSeat = 20; // ₹20 per seat (driver platform fee, deducted from driver)
      
      // Customer payment: (price_per_seat + ₹10) * passengers
      const customerPaymentPerSeat = basePricePerSeat + customerPlatformFeePerSeat;
      const customerPayment = Math.round(customerPaymentPerSeat * passengerCount);
      
      // Driver receives: (price_per_seat - ₹20) * passengers
      const driverReceivesPerSeat = basePricePerSeat;
      const driverBaseFare = Math.round(driverReceivesPerSeat * passengerCount);

      const surgeSettingsTyped: {
        enabled: boolean;
        multiplier: number;
        basePricePerKm: number;
        scope?: string;
      } = surgeSettings as any;

      // Calculate surge amount if surge was applied to the ride
      // Since per_km_rate already includes surge, we need to calculate what the fare would be without surge
      if (rideWithLock.is_surge && rideWithLock.surge_multiplier && Number(rideWithLock.surge_multiplier) > 1.0) {
        appliedSurgeMultiplier = Number(rideWithLock.surge_multiplier);
        
        // Calculate fare without surge by reversing the multiplier
        // If per_km_rate = base_rate * multiplier, then base_rate = per_km_rate / multiplier
        // Since price_per_seat already includes surge, calculate fare without surge
        const fareWithoutSurge = customerPayment / appliedSurgeMultiplier;
        surgeAmount = customerPayment - fareWithoutSurge;
      }

      // Lock fare: Calculate all components and store (locked after booking)
      // Customer pays: (price_per_seat + ₹10) * passengers
      // Driver receives: (price_per_seat - ₹20) * passengers (stored in base_fare)
      // Platform fee: ₹10 per seat (customer side) - stored in platform_fee field
      const customerPlatformFee = customerPlatformFeePerSeat * passengerCount; // ₹10 per seat (customer platform fee)
      const driverFee = 0; // Driver fee is now per seat, not per ride
      const totalFare = Math.round(customerPayment); // Total = customer pays (price_per_seat + ₹10) * passengers
      const lockedSurgeMultiplier = appliedSurgeMultiplier;
      
      console.log('Booking fare calculation:', {
        fullRouteDistance: Number(rideWithLock.distance_km),
        basePricePerSeat: basePricePerSeat,
        customerPaymentPerSeat: customerPaymentPerSeat, // price_per_seat + ₹10
        customerPayment: customerPayment, // (price_per_seat + ₹10) * passengers
        driverReceivesPerSeat: driverReceivesPerSeat, // price_per_seat - ₹20
        driverEarnings: driverBaseFare-20, // (price_per_seat - ₹20) * passengers
        customerPlatformFee: customerPlatformFee, // ₹10 * passengers
        totalFare, // Total customer payment
        passengerCount,
      });

      // Generate booking number (HUSH1234 format)
      const bookingNumber = await generateBookingNumber();

      // Generate OTP for pickup (unique)
      const pickupOTP = Math.floor(100000 + Math.random() * 900000).toString();

      // Get or generate constant PIN for drop
      let dropPIN = customer.drop_pin;
      if (!dropPIN) {
        dropPIN = Math.floor(1000 + Math.random() * 9000).toString();
        await tx.customer.update({
          where: { id: customer.id },
          data: { drop_pin: dropPIN },
        });
      }

      // Create booking with locked fare (surge applied and locked)
      // Create pending booking - payment will be completed via Razorpay
      const booking = await tx.booking.create({
        data: {
          booking_number: bookingNumber,
          rideId: rideWithLock.id,
          customerId: customer.id,
          passengerCount: parseInt(passengerCount.toString()),
          base_fare: driverBaseFare, // Store driver earnings (what driver receives)
          platform_fee: customerPlatformFee, // Customer platform fee = ₹10 per seat
          service_tax: 0, // Service tax removed
          driver_fee: driverFee, // No separate driver fee (already in base_fare)
          total_fare: totalFare, // Total customer pays (price_per_seat * passengers)
          paymentMethod: paymentMethod || 'razorpay',
          paymentStatus: 'pending', // Payment will be completed via Razorpay
          pickup_otp: pickupOTP,
          drop_pin: dropPIN,
          status: 'pending', // Booking will be confirmed after payment
          // Use ride's start/end locations
          pickup_location: pickupLocation || rideWithLock.start_location,
          pickup_latitude: startLatitude || rideWithLock.start_latitude,
          pickup_longitude: startLongitude || rideWithLock.start_longitude,
          drop_location: dropLocation || rideWithLock.end_location,
          drop_latitude: endLatitude || rideWithLock.end_latitude,
          drop_longitude: endLongitude || rideWithLock.end_longitude,
        },
      });

      console.log("Created booking:", booking);

      // Reserve seats immediately when booking is created (to prevent overbooking)
      await tx.ride.update({
        where: { id: rideWithLock.id },
        data: {
          seats_booked: { increment: passengerCount },
        },
      });

      // Update customer booking count within transaction
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          total_bookings: { increment: 1 },
        },
      });

      return {
        booking,
        ride: rideWithLock,
        fareBreakdown: {
          baseFarePerSeat: basePricePerSeat, // Base price per seat (before platform fee)
          baseFare: basePricePerSeat * passengerCount, // Base fare (price_per_seat * passengers)
          isSurgeApplied: rideWithLock.is_surge && surgeSettingsTyped.enabled && appliedSurgeMultiplier > 1.0,
          surgeMultiplier: appliedSurgeMultiplier,
          surgeAmount: surgeAmount,
          baseFareAfterSurge: basePricePerSeat * passengerCount, // Base fare (already includes surge if applicable)
          platformFee: customerPlatformFee, // Customer platform fee = ₹10 per seat
          serviceTax: 0, // Service tax removed
          driverFee: driverFee,
          totalFare: totalFare, // Total = (price_per_seat + ₹10) * passengers
        },
      };
    },{ timeout: 60000 });

    const { booking, ride: rideForResponse, fareBreakdown } = bookingResult;

    // Booking created successfully - fareBreakdown already computed in transaction

    // Generate PDF invoice
    let invoiceUrl = null;
    try {
      const invoiceData = {
        bookingNumber: booking.booking_number,
        customerName: `${customer.user.first_name} ${customer.user.last_name}`,
        customerMobile: customer.user.mobile,
        customerEmail: customer.user.email || '',
        driverName: `${rideForResponse.driver.user.first_name} ${rideForResponse.driver.user.last_name}`,
        driverMobile: rideForResponse.driver.user.mobile,
        pickupLocation: rideForResponse.start_location,
        dropLocation: rideForResponse.end_location,
        scheduledTime: rideForResponse.scheduled_time,
        passengerCount: booking.passengerCount,
        baseFare: Number(booking.base_fare),
        platformFee: Number(booking.platform_fee),
        serviceTax: Number(booking.service_tax || 0),
        totalFare: Number(booking.total_fare),
        paymentStatus: booking.paymentStatus,
        utrNumber: booking.utr_number || undefined,
        bookingDate: new Date(),
      };

      invoiceUrl = await generateInvoicePDF(invoiceData);

      // Update booking with invoice URL
      await prisma.booking.update({
        where: { id: booking.id },
        data: { invoice_url: invoiceUrl },
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
    }

    // Assign masked number
    try {
      await assignMaskedNumberToBooking(booking.id);
    } catch (error) {
      console.error('Error assigning masked number:', error);
    }

    // Note: Booking confirmation SMS and invoice email will be sent after payment is completed
    // Payment completion is handled in /payments/razorpay/verify endpoint
    // No SMS/Email sent at booking creation - only after payment verification

    // Create admin notification for new booking
    try {
      const { createAdminNotification } = require('../services/notificationService');
      await createAdminNotification({
        type: 'booking',
        title: 'New Booking Created',
        message: `New booking done by ${customer.user.first_name} ${customer.user.last_name}`,
        relatedId: booking.id,
        metadata: {
          bookingNumber: booking.booking_number,
          customerName: `${customer.user.first_name} ${customer.user.last_name}`,
          customerMobile: customer.user.mobile,
          totalFare: Number(booking.total_fare),
        },
      });
    } catch (error) {
      console.error('Error creating admin notification for booking:', error);
      // Don't fail the booking creation if notification fails
    }

    res.json({
      booking: {
        ...booking,
        invoice_url: invoiceUrl,
      },
      fareBreakdown,
      message: 'Booking created successfully. Please complete payment to confirm your booking.',
    });
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
});

// Get User Bookings
router.get('/my-bookings', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        ride: {
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    mobile: true,
                  },
                },
                vehicles: {
                  where: {
                    is_active: true,
                  },
                  take: 1, // Get only the first active vehicle
                  select: {
                    vehicle_make: true,
                    vehicle_model: true,
                    vehicle_color: true,
                    vehicle_plate_number: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total_fare for each booking
    const bookingsWithTotalFare = bookings.map(booking => ({
      ...booking,
    //  total_fare: booking.passengerCount * (Number(booking.total_fare) || 0),
      total_fare: (Number(booking.total_fare) || 0),
    }));

    res.json({ bookings: bookingsWithTotalFare });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get bookings' });
  }
});

// Get User Payment History (Only successful payments)
router.get('/payments', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [payments, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          customerId: customer.id,
          paymentStatus: 'success', // Only successful payments
        },
        include: {
          ride: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      first_name: true,
                      last_name: true,
                      mobile: true,
                    },
                  },
                  vehicles: {
                    where: {
                      is_active: true,
                    },
                    take: 1,
                    select: {
                      vehicle_make: true,
                      vehicle_model: true,
                      vehicle_color: true,
                      vehicle_plate_number: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.booking.count({
        where: {
          customerId: customer.id,
          paymentStatus: 'success',
        },
      }),
    ]);

    // Format payment data
    const paymentHistory = payments.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.booking_number,
      amount: Number(booking.total_fare),
      paymentMethod: booking.paymentMethod || 'razorpay',
      paymentStatus: booking.paymentStatus,
      utrNumber: booking.utr_number, // Payment ID or transaction ID
      status: booking.status,
      createdAt: booking.createdAt,
      ride: {
        id: booking.ride.id,
        startLocation: booking.ride.start_location,
        endLocation: booking.ride.end_location,
        scheduledTime: booking.ride.scheduled_time,
        driver: {
          name: `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}`,
          mobile: booking.ride.driver.user.mobile,
        },
        vehicle: booking.ride.driver.vehicles[0] ? {
          model: booking.ride.driver.vehicles[0].vehicle_model,
          color: booking.ride.driver.vehicles[0].vehicle_color,
          plateNumber: booking.ride.driver.vehicles[0].vehicle_plate_number,
        } : null,
      },
      passengerCount: booking.passengerCount,
    }));

    res.json({
      payments: paymentHistory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get payment history' });
  }
});

// Get Booking Details by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user!.userId;

    // Find booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    mobile: true,
                    email: true,
                  },
                },
                vehicles: {
                  where: {
                    is_active: true,
                  },
                  take: 1, // Get only the first active vehicle
                  select: {
                    vehicle_make: true,
                    vehicle_model: true,
                    vehicle_color: true,
                    vehicle_plate_number: true,
                  },
                },
              },
            },
          },
        },
        customer: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                mobile: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization - customer can view their own bookings, driver can view bookings for their rides
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    const isAuthorized = 
      (customer && booking.customerId === customer.id) ||
      (driver && booking.ride.driverId === driver.id) ||
      req.user!.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json({ booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get booking details' });
  }
});

// Verify Pickup OTP
router.post('/:id/verify-pickup-otp', authenticate, authorize('driver'), asyncHandler(async (req: AuthRequest, res) => {
  const { otp } = req.body;

  if (!otp || typeof otp !== 'string') {
    sendErrorResponse(res, ErrorCode.VALIDATION_REQUIRED, 'OTP is required', { field: 'otp' });
    return;
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!driver) {
    sendErrorResponse(res, ErrorCode.DRIVER_NOT_FOUND, 'Driver not found');
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      ride: true,
    },
  });

  if (!booking) {
    sendErrorResponse(res, ErrorCode.BOOKING_NOT_FOUND, 'Booking not found', { bookingId: req.params.id });
    return;
  }

  if (booking.ride.driverId !== driver.id) {
    sendErrorResponse(res, ErrorCode.BOOKING_NOT_AUTHORIZED, 'Not authorized to verify this booking');
    return;
  }

  if (booking.pickup_otp !== otp) {
    sendErrorResponse(res, ErrorCode.BOOKING_INVALID_OTP, 'Invalid OTP');
    return;
  }

  // Ensure payment is confirmed before starting ride
  if (booking.paymentStatus !== 'success' || booking.status !== 'confirmed') {
    sendErrorResponse(res, ErrorCode.BOOKING_PAYMENT_REQUIRED, 'Booking cannot be started. Payment must be confirmed first.', {
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
    });
    return;
  }

  //  CRITICAL CHECK: Prevent driver from starting multiple rides
  // Check if driver has any OTHER started ride (excluding current ride)
  const existingStartedRide = await prisma.ride.findFirst({
    where: {
      driverId: driver.id,
      status: 'started',
      NOT: {
        id: booking.rideId, // Exclude current ride
      },
    },
  });

  if (existingStartedRide) {
    sendErrorResponse(
      res,
      ErrorCode.BOOKING_NOT_AUTHORIZED,
      'You already have an active started ride. Please complete it before starting another ride.',
      {
        existingRideId: existingStartedRide.id,
        currentRideId: booking.rideId,
      }
    );
    return;
  }

  // Update booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      pickup_verified: true,
      status: 'started',
    },
  });

  // Update ride status
  await prisma.ride.update({
    where: { id: booking.rideId },
    data: {
      status: 'started',
      started_at: new Date(),
      last_active_at: new Date(),
    },
  });

  // Invalidate ride cache to ensure fresh data is fetched
  const rideCacheKey = `ride:details:${booking.rideId}`;
  await cacheService.delete(rideCacheKey);

  sendSuccessResponse(res, { message: 'Pickup verified. Ride started.' });
}));

// Verify Drop PIN
router.post('/:id/verify-drop-pin', authenticate, authorize('driver'), asyncHandler(async (req: AuthRequest, res) => {
  const { pin } = req.body;
  console.log("verfy drop otp console log")

  console.log(pin)

  if (!pin || typeof pin !== 'string') {
    sendErrorResponse(res, ErrorCode.VALIDATION_REQUIRED, 'PIN is required', { field: 'pin' });
    return;
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!driver) {
    sendErrorResponse(res, ErrorCode.DRIVER_NOT_FOUND, 'Driver not found');
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      ride: true,
    },
  });

  if (!booking) {
    sendErrorResponse(res, ErrorCode.BOOKING_NOT_FOUND, 'Booking not found', { bookingId: req.params.id });
    return;
  }

  if (booking.ride.driverId !== driver.id) {
    sendErrorResponse(res, ErrorCode.BOOKING_NOT_AUTHORIZED, 'Not authorized to verify this booking');
    return;
  }

  if (booking.drop_pin !== pin) {
    sendErrorResponse(res, ErrorCode.BOOKING_INVALID_PIN, 'Invalid PIN');
    return;
  }

  // Prevent duplicate settlement (idempotent)
  if (booking.status === 'completed') {
    sendSuccessResponse(res, { 
      message: 'Ride already completed and settled.',
      bookingId: booking.id,
    });
    return;
  }

  // Validate booking status
  if (booking.status !== 'started') {
    sendErrorResponse(res, ErrorCode.BOOKING_DROP_NOT_VERIFIED, `Booking must be in 'started' status. Current status: ${booking.status}`, {
      currentStatus: booking.status,
      requiredStatus: 'started',
    });
    return;
  }

    // Use transaction for settlement to ensure atomicity
    // Driver receives only base fare (excluding platform fee)
    const baseFare = Number(booking.base_fare);
    const platformFee = Number(booking.platform_fee);
    const totalFare = Number(booking.total_fare);
    
    // Driver earnings = base fare only (platform fee goes to platform)
    // const driverEarnings = baseFare-config.driver_charges
    const platformFeeTotal = platformFee; // Total platform revenue
    // const adminEarnings = Number(booking.total_fare)-Number(booking.base_fare) +config.driver_charges

    const settlementResult = await prisma.$transaction(async (tx) => {
      // Check if driver was already credited (either on payment or previous completion)
      const existingSettlement = await tx.driverWalletTransaction.findFirst({
        where: {
          bookingId: booking.id,
          type: 'credit',
        },
      });

      const driverAlreadyCredited = !!existingSettlement;

      // Update booking status to completed
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          drop_verified: true,
          status: 'completed',
        },
      });

      // Update ride status to completed
      await tx.booking.update({
  where: { id: booking.id },
  data: {
    drop_verified: true,
    status: 'completed',
  },
});
// ✅ Check if ALL bookings for this ride are completed
const totalBookings = await tx.booking.count({
  where: {
    rideId: booking.rideId,
    status: {
      in: ['confirmed', 'started', 'completed'],
    },
  },
});

const completedBookings = await tx.booking.count({
  where: {
    rideId: booking.rideId,
    status: 'completed',
  },
});

const ride = await tx.ride.findUnique({
  where:{id:booking.rideId}
})

const seatsBooked = ride.seats_booked

const driverEarnings = (seatsBooked*ride?.price_per_seat)-config.driver_charges

// ✅ Complete ride ONLY when last passenger is done
if (totalBookings === completedBookings) {
  await tx.ride.update({
    where: { id: booking.rideId },
    data: {
      status: 'completed',
      completed_at: new Date(),
    },
  });

        await tx.adminWalletTransaction.create({
        data: {
          adminId: config.adminId,
          amount: driverEarnings,
          type: 'debit',
          description: `Sending to Driver Trip Settlement (₹${driverEarnings}) for booking ${booking.booking_number}`,
          bookingId: booking.id,
          driverId: driver.id,
          customerId: booking.customerId,
          transaction_type: 'trip_payment_to_driver',
        },
      });

      await tx.admin.update({
        where: { id: config.adminId },
        data: {
          wallet_balance: { decrement: driverEarnings },
        },
      });

      await tx.driver.update({
          where: { id: driver.id },
          data: {
            total_earnings: { increment: driverEarnings },
            wallet_balance: { increment: driverEarnings },
            completed_rides: { increment: 1 },
          },
      });
        await tx.driverWalletTransaction.create({
          data: {
            driverId: driver.id,
            amount: driverEarnings,
            type: 'credit',
            transaction_type: 'trip_payment',
            description: `Driver settlement (₹${driverEarnings}) for booking ${booking.booking_number} by razorpay`,
            bookingId: booking.id,
          },
        })
}

      // Update customer completed bookings
      await tx.customer.update({
        where: { id: booking.customerId },
        data: {
          completed_bookings: { increment: 1 },
        },
      });

        //payout
      //   try{

      //     const Razorpay = require('razorpay');
      //     const { config } = require('../config/environment');

      //     const RAZORPAY_KEY_ID = config.razorpayKeyId;
      //     const RAZORPAY_KEY_SECRET = config.razorpayKeySecret;

      //     if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      //       const razorpay = new Razorpay({
      //         key_id: RAZORPAY_KEY_ID,
      //         key_secret: RAZORPAY_KEY_SECRET,
      //       });

      //     const payout = await razorpay.payouts.create({
      //   account_number: driver.bank_account_number,
      //   fund_account_id: driver.,
      //   amount: amountPaise,
      //   currency: "INR",
      //   mode: "IMPS",
      //   purpose: "payout",
      //   // queue_if_low_balance: true,
      //   // reference_id: `${wallet.driverId}-${weekKey}`,
      //   reference_id: `ride_${ride._id}`,
      // })}
      //   }catch(refundError: any){
      //   console.error('payment Error initiating Razorpay payment:', refundError);
      //   }
        


      
        // Driver already credited, just update completed rides count
        await tx.driver.update({
          where: { id: driver.id },
          data: {
            completed_rides: { increment: 1 },
          },
        });
      

      // // Record platform fee deduction (for audit) - only if not already recorded
      // const existingPlatformFee = await tx.walletTransaction.findFirst({
      //   where: {
      //     bookingId: booking.id,
      //     type: 'debit',
      //     description: { contains: 'Platform fee' },
      //   },
      // });

      // if (!existingPlatformFee) {
      //   await tx.walletTransaction.create({
      //     data: {
      //       customerId: booking.customerId,
      //       amount: platformFeeTotal,
      //       type: 'debit',
      //       transaction_type: 'trip_payment',
      //       description: `Platform fee & GST (₹${platformFeeTotal}) deducted for booking ${booking.booking_number}`,
      //       bookingId: booking.id,
      //     },
      //   });

      //   await tx.customer.update({
      //     where: { id: booking.customerId },
      //     data: {
      //       wallet_balance: { decrement: platformFeeTotal },
      //     },
      //   });
      // }

      

      return { settled: !driverAlreadyCredited, existing: driverAlreadyCredited };
    },{timeout:60000});

  // Process referral bonus (outside transaction - non-critical)
  try {
    await processCustomerReferralBonus(booking.customerId, booking.id);
  } catch (error) {
    console.error('Error processing cashback/referral:', error);
    // Don't fail the request if these fail
  }

  sendSuccessResponse(res, { 
    message: 'Drop verified. Ride completed and driver settled.',
    settlement: {
      totalFare: totalFare,
      baseFare: baseFare,
      platformFee: platformFee,
      serviceTax: 0, // Service tax removed
      platformFeeTotal: platformFeeTotal,
      driverEarnings: driverEarnings,
      settled: settlementResult.settled,
    },
  });
}));

// Cancel Booking (Customer)
router.post('/:id/cancel', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user!.userId;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customerId !== customer.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed booking' });
    }

    if (booking.status === 'started') {
      return res.status(400).json({ error: 'Cannot cancel started ride. Please contact support.' });
    }

    // Store original payment status and method before transaction
    const originalPaymentStatus = booking.paymentStatus;
    const originalPaymentMethod = booking.paymentMethod?.toLowerCase() || 'razorpay';
    const paymentId = booking.utr_number; // Razorpay payment ID

    // Use transaction for cancellation
    await prisma.$transaction(async (tx) => {
      // Update booking status with cancellation tracking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          paymentStatus: originalPaymentStatus === 'success' ? 'refund_initiated' : originalPaymentStatus,
          // Store cancellation info in a JSON field (we'll add cancelled_by to schema later if needed)
          // For now, we can track it via the user making the request
        },
      });

      // Refund based on payment method if payment was successful
      if (originalPaymentStatus === 'success') {
        if (originalPaymentMethod === 'wallet') {
          // Refund to wallet for wallet payments
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              wallet_balance: { increment: Number(booking.total_fare) },
            },
          });

          // Create refund transaction
          await tx.walletTransaction.create({
            data: {
              customerId: customer.id,
              amount: Number(booking.total_fare),
              type: 'credit',
              transaction_type: 'refund',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
            },
          });
        }
        // For Razorpay and other payment gateways, paymentStatus is already set to 'refund_initiated' above
        // Actual refund will be processed after transaction commits
      }

      // Decrement total bookings
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          total_bookings: { decrement: 1 },
          cancelled_bookings: { increment: 1 },
        },
      });

      // Release seats (seats were reserved when booking was created)
      // Release for all statuses since seats are reserved on creation
        await tx.ride.update({
          where: { id: booking.rideId },
          data: {
            seats_booked: { decrement: booking.passengerCount },
          },
        });
    },{ timeout: 60000 });

    // Initiate refund to original payment method if payment was successful
    let refundInitiated = false;
    let refundMethod = 'none';
    
    if (originalPaymentStatus === 'success') {
      if (originalPaymentMethod === 'wallet') {
        // Wallet refund is already processed in transaction above
        refundInitiated = true;
        refundMethod = 'wallet';
      } else if (originalPaymentMethod === 'razorpay' && paymentId) {
        // Initiate Razorpay refund
        try {
          const Razorpay = require('razorpay');
          const { config } = require('../config/environment');
          
          const RAZORPAY_KEY_ID = config.razorpayKeyId;
          const RAZORPAY_KEY_SECRET = config.razorpayKeySecret;

          if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
            const razorpay = new Razorpay({
              key_id: RAZORPAY_KEY_ID,
              key_secret: RAZORPAY_KEY_SECRET,
            });

            // Initiate refund (amount in paise)
            const refundAmount = Math.round(Number(booking.total_fare) * 100);
            const refund = await razorpay.payments.refund(paymentId, {
              amount: refundAmount,
              notes: {
                bookingId: booking.id,
                bookingNumber: booking.booking_number,
                reason: 'Booking cancellation',
              },
            });

            // Update booking with refund information
            await prisma.booking.update({
              where: { id: booking.id },
              data: {
                paymentStatus: 'refund_initiated',
                utr_number: `${paymentId}_refund_${refund.id}`,
              },
            });

            refundInitiated = true;
            refundMethod = 'razorpay';
            console.log(`[Refund] Razorpay refund initiated for booking ${booking.booking_number}: ${refund.id}`);
          }
        } catch (refundError: any) {
          console.error('[Refund] Error initiating Razorpay refund:', refundError);
          // Don't fail the cancellation if refund fails - it can be processed manually
          // Update status to indicate refund needs manual processing
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'refund_pending',
            },
          });
          refundMethod = 'razorpay_failed';
        }
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      bookingId: booking.id,
      refunded: refundInitiated,
      refundMethod: refundMethod,
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel booking' });
  }
});

export default router;

