import prisma from '../config/database';

// Timeout for unpaid bookings (15 minutes)
const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const CHECK_INTERVAL_MS = 1 * 60 * 1000; // Check every 1 minute

/**
 * Cancel unpaid bookings that have exceeded the payment timeout
 */
export const cancelUnpaidBookings = async (): Promise<void> => {
  try {
    const timeoutDate = new Date(Date.now() - PAYMENT_TIMEOUT_MS);

    // Find bookings that are:
    // 1. Status is 'pending'
    // 2. PaymentStatus is 'pending' or 'initiated' (not paid)
    // 3. Created more than PAYMENT_TIMEOUT_MS ago
    const unpaidBookings = await prisma.booking.findMany({
      where: {
        status: 'pending',
        paymentStatus: { in: ['pending', 'initiated', 'failed'] },
        createdAt: { lt: timeoutDate },
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        ride: true,
      },
    });

    if (unpaidBookings.length === 0) {
      return;
    }

    console.log(`[Booking Cleanup] Found ${unpaidBookings.length} unpaid booking(s) to cancel`);

    // Cancel each unpaid booking
    for (const booking of unpaidBookings) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update booking status to cancelled
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'cancelled',
              paymentStatus: 'failed',
            },
          });

          // Release seats that were reserved when booking was created
          await tx.ride.update({
            where: { id: booking.rideId },
            data: {
              seats_booked: { decrement: booking.passengerCount },
            },
          });

          // Decrement customer total_bookings (since it was incremented on creation)
          await tx.customer.update({
            where: { id: booking.customerId },
            data: {
              total_bookings: { decrement: 1 },
            },
          });

          console.log(`[Booking Cleanup] Cancelled booking ${booking.booking_number} (unpaid for >${PAYMENT_TIMEOUT_MS / 60000} minutes) and released ${booking.passengerCount} seat(s)`);
        });
      } catch (error) {
        console.error(`[Booking Cleanup] Error cancelling booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Booking Cleanup] Error in cancelUnpaidBookings:', error);
  }
};

/**
 * Cancel a specific booking if payment is not completed
 */
export const cancelBookingIfUnpaid = async (bookingId: string): Promise<boolean> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
      },
    });

    if (!booking) {
      return false;
    }

    // Only cancel if payment is not successful
    if (booking.paymentStatus !== 'success' && booking.status === 'pending') {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            paymentStatus: booking.paymentStatus === 'initiated' ? 'failed' : booking.paymentStatus,
          },
        });

        // Release seats that were reserved when booking was created
        await tx.ride.update({
          where: { id: booking.rideId },
          data: {
            seats_booked: { decrement: booking.passengerCount },
          },
        });

        // Decrement customer total_bookings
        await tx.customer.update({
          where: { id: booking.customerId },
          data: {
            total_bookings: { decrement: 1 },
          },
        });
      });

      console.log(`[Booking Cleanup] Cancelled booking ${booking.booking_number} (payment not completed)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`[Booking Cleanup] Error cancelling booking ${bookingId}:`, error);
    return false;
  }
};

/**
 * Start the booking cleanup service
 * Runs periodically to cancel unpaid bookings
 */
export const startBookingCleanup = (): void => {
  // Run immediately on startup
  cancelUnpaidBookings().catch((error) => {
    console.error('[Booking Cleanup] Error in initial cleanup:', error);
  });

  // Then run every CHECK_INTERVAL_MS
  setInterval(() => {
    cancelUnpaidBookings().catch((error) => {
      console.error('[Booking Cleanup] Error in scheduled cleanup:', error);
    });
  }, CHECK_INTERVAL_MS);

  console.log(`[Booking Cleanup] Service started. Checking every ${CHECK_INTERVAL_MS / 60000} minute(s) for unpaid bookings older than ${PAYMENT_TIMEOUT_MS / 60000} minute(s)`);
};

