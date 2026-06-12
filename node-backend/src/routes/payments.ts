import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { config } from '../config/environment';
import { sendPaymentInvoiceEmail } from '../utils/emailService';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayPaymentDetails,
  refundRazorpayPayment,
} from '../services/razorpayService';

const router = express.Router();

async function postPaymentSideEffects(booking: any, paymentId: string) {
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

    if (booking.customer.user.email && invoiceUrl) {
      await sendPaymentInvoiceEmail(
        booking.customer.user.email,
        `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
        booking.booking_number,
        invoiceUrl,
        Number(booking.total_fare)
      );
    }
  } catch (err) {
    console.error('Post-payment side effect error:', err);
  }
}


// Razorpay - Create order for payment
router.post('/razorpay/create-order', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user!.userId;

    if (!bookingId || typeof bookingId !== 'string') {
      console.log("Valid booking ID is required")
      return res.status(400).json({ error: 'Valid booking ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.log("Valid amount is required")
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

// // Razorpay - Verify payment
// router.post('/razorpay/verify', authenticate, async (req: AuthRequest, res) => {
//   try {
//     const { orderId, paymentId, signature } = req.body;
//     const userId = req.user!.userId;

//     if (!orderId || !paymentId || !signature) {
//       return res.status(400).json({ error: 'Order ID, Payment ID, and Signature are required' });
//     }

//     // Verify signature
//     const isValid = verifyRazorpayPayment(orderId, paymentId, signature);
//     if (!isValid) {
//       return res.status(400).json({ error: 'Invalid payment signature' });
//     }

//     // Get booking by order ID (stored in utr_number)
//     const booking = await prisma.booking.findFirst({
//       where: { utr_number: orderId },
//       include: {
//         customer: {
//           include: {
//             user: true,
//           },
//         },
//         ride: {
//           include: {
//             driver: {
//               include: {
//                 user: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!booking) {
//       return res.status(404).json({ error: 'Booking not found' });
//     }

//     if (booking.customer.userId !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' });
//     }

//     // Check if payment already processed
//     if (booking.paymentStatus === 'success') {
//       return res.json({
//         success: true,
//         verified: true,
//         message: 'Payment already verified',
//         bookingId: booking.id,
//         orderId,
//         paymentId,
//       });
//     }

//     // Get payment details from Razorpay
//     const paymentDetails = await getRazorpayPaymentDetails(paymentId);

//     // Calculate driver earnings (base fare only, excluding platform fee)
//     const baseFare = Number(booking.base_fare);
//     const driverEarnings = baseFare;

//     // Update booking payment status and credit driver wallet
//     await prisma.$transaction(async (tx) => {
//       // Update booking
//       await tx.booking.update({
//         where: { id: booking.id },
//         data: {
//           paymentStatus: 'success',
//           status: 'confirmed',
//           utr_number: paymentId, // Store payment ID
//           paymentMethod: 'razorpay',
//         },
//       });

//       // Seats were already reserved when booking was created
//       // No need to increment again here

//       // Credit driver wallet when payment is confirmed
//       if (booking.ride.driverId) {
//         await tx.driver.update({
//           where: { id: booking.ride.driverId },
//           data: {
//             total_earnings: { increment: driverEarnings },
//             wallet_balance: { increment: driverEarnings },
//           },
//         });

//         // Record driver settlement transaction (for audit)
//         await tx.walletTransaction.create({
//           data: {
//             customerId: booking.customerId,
//             amount: driverEarnings,
//             type: 'credit',
//             transaction_type: 'trip_payment',
//             description: `Driver settlement (₹${driverEarnings}) for booking ${booking.booking_number} - Payment confirmed`,
//             bookingId: booking.id,
//           },
//         });
//       }
//     });

//     // Send confirmation emails/SMS (similar to PayU success handler)
//     try {
//       // Generate invoice
//       let invoiceUrl = null;
//       try {
//         const invoiceData = {
//           bookingNumber: booking.booking_number,
//           customerName: `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
//           customerMobile: booking.customer.user.mobile,
//           customerEmail: booking.customer.user.email || '',
//           driverName: booking.ride.driver?.user ? `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}` : 'Driver',
//           driverMobile: booking.ride.driver?.user?.mobile || '',
//           pickupLocation: booking.ride.start_location,
//           dropLocation: booking.ride.end_location,
//           scheduledTime: booking.ride.scheduled_time,
//           passengerCount: booking.passengerCount,
//           baseFare: Number(booking.base_fare),
//           platformFee: Number(booking.platform_fee),
//           serviceTax: Number(booking.service_tax),
//           totalFare: Number(booking.total_fare),
//           paymentStatus: 'success',
//           utrNumber: paymentId,
//           bookingDate: booking.createdAt,
//         };

//         invoiceUrl = await generateInvoicePDF(invoiceData);
//       } catch (error) {
//         console.error('Error generating invoice:', error);
//       }

//       // Send invoice email
//       if (booking.customer.user.email && invoiceUrl) {
//         await sendPaymentInvoiceEmail(
//           booking.customer.user.email,
//           `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
//           booking.booking_number,
//           invoiceUrl,
//           Number(booking.total_fare)
//         );
//       }
//     } catch (error) {
//       console.error('Error sending confirmation emails:', error);
//     }

//     res.json({
//       success: true,
//       verified: true,
//       message: 'Payment verified successfully',
//       bookingId: booking.id,
//       orderId,
//       paymentId,
//       amount: paymentDetails.amount / 100, // Convert from paise to rupees
//     });
//   } catch (error: any) {
//     console.error('Razorpay verify error:', error);
//     res.status(500).json({ error: error.message || 'Payment verification failed' });
//   }
// });

router.post('/razorpay/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const userId = req.user!.userId;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment params' });
    }

    // 1️⃣ Verify signature (NO DB)
    if (!verifyRazorpayPayment(orderId, paymentId, signature)) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 2️⃣ Fetch booking (NO TRANSACTION)
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

    // Idempotent exit
    if (booking.paymentStatus === 'success') {
      return res.json({ success: true, verified: true });
    }

    const driverEarnings = Number(booking.base_fare)
    const adminEarnings = Number(booking.total_fare) - Number(booking.base_fare);

    // 3️⃣ DB-ONLY TRANSACTION
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
        // await tx.driver.update({
        //   where: { id: booking.ride.driverId },
        //   data: {
        //     total_earnings: { increment: driverEarnings },
        //     wallet_balance: { increment: driverEarnings },
        //   },
        // });

        await tx.driverWalletTransaction.create({
          data: {
            driverId: booking.ride.driverId,
            amount: driverEarnings,
            type: 'credit',
            transaction_type: 'trip_payment',
            description: `Driver settlement (₹${driverEarnings}) for booking ${booking.booking_number} - Payment confirmed`,
            bookingId: booking.id,
          },
        });

        await tx.walletTransaction.create({
          data: {
            customerId: booking.customerId,
            amount: booking.total_fare,
            type: 'debit',
            transaction_type: 'trip_payment',
            description: `Trip payment (₹${booking.total_fare}) for booking ${booking.booking_number} - Payment confirmed`,
            bookingId: booking.id,
          },
        });

        await tx.adminWalletTransaction.create({
          data: {
            customerId: booking.customerId,
            adminId: config.adminId, // Default admin
            amount: booking.total_fare,
            type: 'credit',
            transaction_type: 'trip_payment',
            description: `Admin earnings (₹${adminEarnings}) for booking ${booking.booking_number} - Payment confirmed`,
            bookingId: booking.id,
            driverId: booking.ride.driverId,
          },
        });
        
        await tx.admin.update({
          where: { id: config.adminId },
          data: {
            wallet_balance: { increment: booking.total_fare },
          },
        });

        // await tx.customer.update({
        //   where: { id: booking.customerId },
        //   data: {
        //     total_spent: { increment: booking.total_fare },
        //   },
        // });

      }
    },{timeout:60000});

    // 4️⃣ Side effects (NO BLOCKING)
    postPaymentSideEffects(booking, paymentId).catch(console.error);

    res.json({
      success: true,
      verified: true,
      bookingId: booking.id,
      paymentId,
    });
  } catch (err: any) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});


// // Razorpay - Payment cancellation handler
// router.post('/razorpay/cancel', authenticate, async (req: AuthRequest, res) => {
//   try {
//     const { orderId } = req.body;
//     const userId = req.user!.userId;

//     if (!orderId) {
//       return res.status(400).json({ error: 'Order ID is required' });
//     }

//     // Find booking by order ID
//     const booking = await prisma.booking.findFirst({
//       where: { utr_number: orderId },
//       include: {
//         customer: true,
//         ride: true,
//       },
//     });

//     if (!booking) {
//       return res.status(404).json({ error: 'Booking not found' });
//     }

//     // Verify user owns this booking
//     if (booking.customer.userId !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' });
//     }

//     // Only cancel if payment hasn't been completed
//     if (booking.paymentStatus === 'success') {
//       return res.status(400).json({ error: 'Payment already completed. Cannot cancel.' });
//     }

//     // Cancel booking and release seats
//     await prisma.$transaction(async (tx) => {
//       await tx.booking.update({
//         where: { id: booking.id },
//         data: {
//           paymentStatus: 'cancelled',
//           status: 'cancelled', // Update booking status to cancelled
//         },
//       });

//       // Release seats that were reserved when booking was created
//       await tx.ride.update({
//         where: { id: booking.rideId },
//         data: {
//           seats_booked: { decrement: booking.passengerCount },
//         },
//       });

//       // Decrement customer booking count
//       await tx.customer.update({
//         where: { id: booking.customerId },
//         data: {
//           total_bookings: { decrement: 1 },
//         },
//       });
//     });

//     res.json({ 
//       success: true, 
//       message: 'Payment cancelled and booking updated',
//       bookingId: booking.id,
//     });
//   } catch (error: any) {
//     console.error('Razorpay cancel handler error:', error);
//     res.status(500).json({ error: error.message || 'Failed to process payment cancellation' });
//   }
// });

router.post('/razorpay/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user!.userId;

    const booking = await prisma.booking.findFirst({
      where: { utr_number: orderId },
    });

    if (!booking || booking.customerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized or booking not found' });
    }

    if (booking.paymentStatus === 'success') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled', paymentStatus: 'cancelled' },
      });

      await tx.ride.update({
        where: { id: booking.rideId },
        data: { seats_booked: { decrement: booking.passengerCount } },
      });

      await tx.customer.update({
        where: { id: booking.customerId },
        data: { total_bookings: { decrement: 1 } },
      });
    },{timeout:60000});

    res.json({ success: true, bookingId: booking.id });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Cancel failed' });
  }
});


// // Razorpay - Payment failure handler
// router.post('/razorpay/failure', async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, error_description } = req.body;

//     if (razorpay_order_id) {
//       // Find booking by order ID
//       const booking = await prisma.booking.findFirst({
//         where: { utr_number: razorpay_order_id },
//       });

//       if (booking && booking.paymentStatus !== 'success') {
//         // Release seats and update booking status to failed
//         await prisma.$transaction(async (tx) => {
//           await tx.booking.update({
//           where: { id: booking.id },
//           data: {
//             paymentStatus: 'failed',
//             status: 'cancelled',
//           },
//           });

//           // Release seats that were reserved when booking was created
//           await tx.ride.update({
//             where: { id: booking.rideId },
//             data: {
//               seats_booked: { decrement: booking.passengerCount },
//             },
//           });

//           // Decrement customer booking count
//           await tx.customer.update({
//             where: { id: booking.customerId },
//             data: {
//               total_bookings: { decrement: 1 },
//             },
//           });
//         });
//       }
//     }

//     res.json({ success: true, message: 'Payment failure recorded' });
//   } catch (error: any) {
//     console.error('Razorpay failure handler error:', error);
//     res.status(500).json({ error: error.message || 'Failed to process payment failure' });
//   }
// });

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

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled', paymentStatus: 'failed' },
      });

      await tx.ride.update({
        where: { id: booking.rideId },
        data: { seats_booked: { decrement: booking.passengerCount } },
      });

      await tx.customer.update({
        where: { id: booking.customerId },
        data: { total_bookings: { decrement: 1 } },
      });
    },{timeout:600000});

    res.json({ success: true });
  } catch (err) {
    console.error('Failure handler error:', err);
    res.status(500).json({ error: 'Failure handling failed' });
  }
});


// // Razorpay - Payment success handler (webhook/callback)
// router.post('/razorpay/success', async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ error: 'Missing required payment parameters' });
//     }

//     // Verify signature
//     const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
//     if (!isValid) {
//       return res.status(400).json({ error: 'Invalid payment signature' });
//     }

//     // Get booking by order ID
//     const booking = await prisma.booking.findFirst({
//       where: { utr_number: razorpay_order_id },
//       include: {
//         customer: {
//           include: {
//             user: true,
//           },
//         },
//         ride: {
//           include: {
//             driver: {
//               include: {
//                 user: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!booking) {
//       return res.status(404).json({ error: 'Booking not found' });
//     }

//     // Check if already processed
//     if (booking.paymentStatus === 'success') {
//       return res.json({
//         success: true,
//         message: 'Payment already processed',
//         bookingId: booking.id,
//       });
//     }

//     // Process payment (same logic as verify endpoint)
//     await prisma.$transaction(async (tx) => {
//       await tx.booking.update({
//         where: { id: booking.id },
//         data: {
//           paymentStatus: 'success',
//           status: 'confirmed',
//           utr_number: razorpay_payment_id,
//           paymentMethod: 'razorpay',
//         },
//       });

//       // Seats were already reserved when booking was created
//       // No need to increment again here
//     });

//     // Send confirmation emails/SMS (same logic as verify endpoint)
//     try {
//       // Generate invoice
//       let invoiceUrl = null;
//       try {
//         const invoiceData = {
//           bookingNumber: booking.booking_number,
//           customerName: `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
//           customerMobile: booking.customer.user.mobile,
//           customerEmail: booking.customer.user.email || '',
//           driverName: booking.ride.driver?.user ? `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}` : 'Driver',
//           driverMobile: booking.ride.driver?.user?.mobile || '',
//           pickupLocation: booking.ride.start_location,
//           dropLocation: booking.ride.end_location,
//           scheduledTime: booking.ride.scheduled_time,
//           passengerCount: booking.passengerCount,
//           baseFare: Number(booking.base_fare),
//           platformFee: Number(booking.platform_fee),
//           serviceTax: Number(booking.service_tax),
//           totalFare: Number(booking.total_fare),
//           paymentStatus: 'success',
//           utrNumber: razorpay_payment_id,
//           bookingDate: booking.createdAt,
//         };

//         invoiceUrl = await generateInvoicePDF(invoiceData);
//       } catch (error) {
//         console.error('Error generating invoice:', error);
//       }

//       // Send invoice email
//       if (booking.customer.user.email && invoiceUrl) {
//         await sendPaymentInvoiceEmail(
//           booking.customer.user.email,
//           `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
//           booking.booking_number,
//           invoiceUrl,
//           Number(booking.total_fare)
//         );
//       }
//     } catch (error) {
//       console.error('Error sending confirmation emails:', error);
//     }

//     res.json({
//       success: true,
//       message: 'Payment processed successfully',
//       bookingId: booking.id,
//     });
//   } catch (error: any) {
//     console.error('Razorpay success handler error:', error);
//     res.status(500).json({ error: error.message || 'Failed to process payment' });
//   }
// });

router.post('/razorpay/success', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment parameters' });
    }

    // 1️⃣ Verify Razorpay signature (NO DB)
    const isValid = verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 2️⃣ Fetch booking (NO TRANSACTION)
    const booking = await prisma.booking.findFirst({
      where: { utr_number: razorpay_order_id },
      include: {
        customer: { include: { user: true } },
        ride: { include: { driver: { include: { user: true } } } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // 3️⃣ IDEMPOTENCY GUARD (VERY IMPORTANT)
    if (booking.paymentStatus === 'success') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        bookingId: booking.id,
      });
    }

    // 4️⃣ FAST DB TRANSACTION (DB-ONLY)
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
    },{timeout:60000});

    // 5️⃣ SIDE EFFECTS (NON-BLOCKING, SAFE)
    postPaymentSideEffects(booking, razorpay_payment_id)
      .catch(err => console.error('Post payment side effects failed:', err));

    return res.json({
      success: true,
      message: 'Payment processed successfully',
      bookingId: booking.id,
    });

  } catch (error: any) {
    console.error('Razorpay success handler error:', error);
    return res.status(500).json({
      error: 'Failed to process payment',
    });
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

