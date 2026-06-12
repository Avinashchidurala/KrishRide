import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Get Wallet Balance
router.get('/balance', authenticate, authorize('customer', 'driver','admin'), async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    let balance = 0;

    if (userRole === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      balance = Number(customer.wallet_balance || 0);
    }else if (userRole === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!admin) {
        return res.status(404).json({ error: 'admin not found' });
      }

      balance = Number(admin.wallet_balance || 0);
    } 
     else if (userRole === 'driver') {
      const driver = await prisma.driver.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      balance = Number(driver.wallet_balance || 0);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      balance,
      currency: 'INR',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get wallet balance' });
  }
});

// Get Wallet Transactions
router.get('/transactions', authenticate, authorize('customer', 'driver'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userRole = req.user!.role;

    let transactions: any[] = [];
    let total = 0;

    if (userRole === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const [customerTransactions, customerTotal] = await Promise.all([
        prisma.walletTransaction.findMany({
          where: { customerId: customer.id },
          skip,
          take: Number(limit),
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.walletTransaction.count({
          where: { customerId: customer.id },
        }),
      ]);

      transactions = customerTransactions;
      total = customerTotal;
    }else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get transactions' });
  }
});
router.get('/admin/transactions', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userRole = req.user!.role;

    let transactions: any[] = [];
    let total = 0;

      const admin = await prisma.admin.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!admin) {
        return res.status(404).json({ error: 'admin not found' });
      }

      const [adminTransactions, adminTotal] = await Promise.all([
        prisma.adminWalletTransaction.findMany({
          where: { adminId: admin.id },
          skip,
          take: Number(limit),
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.adminWalletTransaction.count({
          where: { adminId: admin.id },
        }),
      ]);

      transactions = adminTransactions;
      total = adminTotal;
    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get transactions' });
  }
});

router.get('/transactions/:id', authenticate, authorize('customer', 'driver'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userRole = req.user!.role;

    console.log(req.params.id)

      const [driverTransactions, driverTotal] = await Promise.all([
        prisma.driverWalletTransaction.findMany({
          where: { driverId: req.params.id },
          skip,
          take: Number(limit),
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.driverWalletTransaction.count({
          where: { driverId: req.params.id },
        }),
      ]);

      let transactions = driverTransactions;
      let total = driverTotal;

      console.log(transactions,total);

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get transactions' });
  }
});

// Apply Wallet Balance to Booking
router.post('/apply', authenticate, authorize('customer'), async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    // Input validation
    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'Valid booking ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Use transaction to prevent race conditions on wallet balance
    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Re-check balance within transaction (prevent race condition)
      if (Number(amount) > Number(customer.wallet_balance)) {
        throw new Error('Insufficient wallet balance');
      }

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.customerId !== customer.id) {
        throw new Error('Booking not found');
      }

      if (booking.paymentStatus !== 'pending') {
        throw new Error(`Booking payment already ${booking.paymentStatus}`);
      }

      // Deduct from wallet (atomic operation)
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          wallet_balance: { decrement: Number(amount) },
        },
      });

      // Create debit transaction
      await tx.walletTransaction.create({
        data: {
          customerId: customer.id,
          amount: Number(amount),
          type: 'debit',
          transaction_type: 'trip_payment',
          description: `Payment for booking ${booking.booking_number}`,
          bookingId: booking.id,
        },
      });

      // Update booking payment status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'success',
          status: 'confirmed',
          
        },
      });

      // Seats were already reserved when booking was created
      // No need to increment again here
    });

    res.json({ message: 'Wallet balance applied successfully' });
  } catch (error: any) {
    console.error('Wallet apply error:', error);
    const statusCode = error.message?.includes('not found') || error.message?.includes('Insufficient') || error.message?.includes('already') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to apply wallet balance' });
  }
});

export default router;

