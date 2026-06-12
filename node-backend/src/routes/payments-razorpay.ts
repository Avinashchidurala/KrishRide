import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { config } from '../config/environment';
import { sendPaymentInvoiceEmail, sendBookingConfirmationEmail, sendBookingConfirmationEmailToDriver } from '../utils/emailService';
import { sendBookingConfirmationSMS, sendBookingConfirmationSMSToDriver } from '../utils/smsService';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayPaymentDetails,
  refundRazorpayPayment,
} from '../services/razorpayService';

const router = express.Router();

// Razorpay - Create order for payment
router.post('/razorpay/create-order', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user!.userId;

    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'Valid booking ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        ride: true,
      },
    });

    if (!booking || booking.customer.userId !== userId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus === 'success') {
      return res.status(400).json({ error: 'Payment already completed for this booking' });
    }

    const user = booking.customer.user;
    const customerName = `${user.first_name} ${user.last_name}`;
    const email = user.email || `${user.mobile}@hushryd.com`;
    const contact = user.mobile;

    // Check Razorpay credentials
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(
      amount,
      booking.booking_number,
      {
        name: customerName,
        email: email,
        contact: contact,
      }
    );

    // Update booking with Razorpay order ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        utr_number: order.id, // Store Razorpay order ID
        paymentStatus: 'pending',
        paymentMethod: 'razorpay',
      },
    });

    // Return order details for frontend
    res.json({
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      receipt: booking.booking_number,
      keyId: config.razorpayKeyId,
      customer: {
        name: customerName,
        email: email,
        contact: contact,
      },
    });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create Razorpay order' });
  }
});

// Razorpay - Verify payment
router.post('/razorpay/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const userId = req.user!.userId;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment params' });
    }

    // 1️⃣ VERIFY SIGNATURE (NO DB TRANSACTION)
    const isValid = verifyRazorpayPayment(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 2️⃣ FETCH BOOKING (NO TRANSACTION)
    const booking = await prisma.booking.findFirst({
      where: { utr_number: orderId },
      include: {
        customer: { include: { user: true } },
        ride: { include: { driver: { include: { user: true } } } },
      },
    });

    if (!booking || booking.customer.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized or booking not found' });
    }

    if (booking.paymentStatus === 'success') {
      return res.json({ success: true, verified: true });
    }

    // 3️⃣ FETCH PAYMENT FROM RAZORPAY (NO TRANSACTION)
    const paymentDetails = await getRazorpayPaymentDetails(paymentId);
    const driverEarnings = Number(booking.base_fare)- Number(booking.platform_fee);

    // 4️⃣ DB TRANSACTION (FAST, DB-ONLY)
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'success',
          status: 'confirmed',
          utr_number: paymentId,
          paymentMethod: 'razorpay',
        },
      });

      if (booking.ride.driverId) {
        await tx.driver.update({
          where: { id: booking.ride.driverId },
          data: {
            total_earnings: { increment: driverEarnings },
            wallet_balance: { increment: driverEarnings },
          },
        });

        // await tx.driverWalletTransaction.create({
        //   data: {
        //     driverId: booking.ride.driverId,
        //     amount: driverEarnings,
        //     type: 'credit',
        //     transaction_type: 'trip_payment',
        //     description: `Driver settlement for booking ${booking.booking_number}`,
        //     bookingId: booking.id,
        //   },
        // });
      }
    });

    // 5️⃣ SIDE EFFECTS (EMAIL / SMS / PDF) – AFTER TRANSACTION
    sendPostPaymentNotifications(booking, paymentId).catch(console.error);

    return res.json({
      success: true,
      verified: true,
      bookingId: booking.id,
      paymentId,
      amount: paymentDetails.amount / 100,
    });
  } catch (error: any) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

async function sendPostPaymentNotifications(booking: any, paymentId: string) {
  try {
    const invoiceUrl = await generateInvoicePDF({
      bookingNumber: booking.booking_number,
      customerName: `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
      pickupLocation: booking.ride.start_location,
      dropLocation: booking.ride.end_location,
      scheduledTime: booking.ride.scheduled_time,
      passengerCount: booking.passengerCount,
      baseFare: Number(booking.base_fare),
      platformFee: Number(booking.platform_fee),
      totalFare: Number(booking.total_fare),
      utrNumber: paymentId,
    });

    if (booking.customer.user.mobile) {
      await sendBookingConfirmationSMS(
        booking.customer.user.mobile,
        booking.booking_number,
        booking.ride.start_location,
        booking.ride.end_location,
        booking.ride.scheduled_time
      );
    }

    if (booking.customer.user.email && invoiceUrl) {
      await sendPaymentInvoiceEmail(
        booking.customer.user.email,
        booking.customer.user.first_name,
        booking.booking_number,
        invoiceUrl,
        Number(booking.total_fare)
      );
    }
  } catch (err) {
    console.error('Post payment notification error:', err);
  }
}

// Razorpay - Payment failure handler
router.post('/razorpay/failure', async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    if (!razorpay_order_id) return res.json({ success: true });

    const booking = await prisma.booking.findFirst({
      where: { utr_number: razorpay_order_id },
    });

    if (!booking || booking.paymentStatus === 'success') {
      return res.json({ success: true });
    }

    // DB-ONLY TRANSACTION
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'failed',
          status: 'cancelled',
        },
      });

      await tx.ride.update({
        where: { id: booking.rideId },
        data: {
          seats_booked: { decrement: booking.passengerCount },
        },
      });

      await tx.customer.update({
        where: { id: booking.customerId },
        data: {
          total_bookings: { decrement: 1 },
        },
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Razorpay failure error:', err);
    res.status(500).json({ error: 'Failure handler error' });
  }
});


// Razorpay - Payment success handler (webhook/callback)
router.post('/razorpay/success', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment parameters' });
    }

    // Verify signature
    const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get booking by order ID
    const booking = await prisma.booking.findFirst({
      where: { utr_number: razorpay_order_id },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        ride: {
          include: {
            driver: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if already processed
    if (booking.paymentStatus === 'success') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        bookingId: booking.id,
      });
    }

    // Calculate driver earnings (base fare only, excluding platform fee)
    const baseFare = Number(booking.base_fare);
    const driverEarnings = baseFare;

    // Process payment (same logic as verify endpoint)
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'success',
          status: 'confirmed',
          utr_number: razorpay_payment_id,
          paymentMethod: 'razorpay',
        },
      });

      // Seats were already reserved when booking was created
      // No need to increment again here

      // Credit driver wallet when payment is confirmed
      if (booking.ride.driverId) {
        await tx.driver.update({
          where: { id: booking.ride.driverId },
          data: {
            total_earnings: { increment: driverEarnings },
            wallet_balance: { increment: driverEarnings },
          },
        });

        // Record driver settlement transaction (for audit)
        // await tx.driverWalletTransaction.create({
        //   data: {
        //     driverId: booking.ride.driverId,
        //     amount: driverEarnings,
        //     type: 'credit',
        //     transaction_type: 'trip_payment',
        //     description: `Driver settlement (₹${driverEarnings}) for booking ${booking.booking_number} - Payment confirmed`,
        //     bookingId: booking.id,
        //   },
        // });
      }
    });

    // Send confirmation emails/SMS (similar to verify endpoint)
    // ... (same email/SMS logic as verify endpoint)

    res.json({
      success: true,
      message: 'Payment processed successfully',
      bookingId: booking.id,
    });
  } catch (error: any) {
    console.error('Razorpay success handler error:', error);
    res.status(500).json({ error: error.message || 'Failed to process payment' });
  }
});

// Get payment status
router.get('/status/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { utr_number: transactionId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      transactionId,
      paymentStatus: booking.paymentStatus,
      amount: booking.total_fare,
      bookingId: booking.id,
    });
  } catch (error: any) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get payment status' });
  }
});

export default router;

