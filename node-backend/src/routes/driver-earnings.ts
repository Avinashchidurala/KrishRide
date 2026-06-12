import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Get Driver Earnings Summary
router.get('/summary', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get completed rides with bookings
    const completedRides = await prisma.ride.findMany({
      where: {
        driverId: driver.id,
        status: 'completed',
      },
      include: {
        bookings: {
          where: {
            status: 'completed',
          },
        },
      },
    });

    // Calculate earnings
    const totalEarnings = Number(driver.total_earnings) || 0;
    const walletBalance = Number(driver.wallet_balance) || 0;
    const totalRides = driver.completed_rides || 0;

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalPayouts = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayouts = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      summary: {
        totalEarnings,
        walletBalance,
        totalRides,
        totalPayouts,
        pendingPayouts,
        availableForPayout: walletBalance - pendingPayouts,
      },
      recentPayouts: payouts.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Get driver earnings summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to get earnings summary' });
  }
});

// Get Driver Earnings History
router.get('/history', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const where: any = {
      driverId: driver.id,
      status: 'completed',
    };

    if (startDate || endDate) {
      where.completed_at = {};
      if (startDate) {
        where.completed_at.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.completed_at.lte = new Date(endDate as string);
      }
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { completed_at: 'desc' },
        include: {
          bookings: {
            where: {
              status: 'completed',
            },
            select: {
              id: true,
              booking_number: true,
              total_fare: true,
              completed_at: true,
              customer: {
                include: {
                  user: {
                    select: {
                      first_name: true,
                      last_name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.ride.count({ where }),
    ]);

    // Calculate earnings per ride
    const earningsHistory = rides.map(ride => {
      const rideEarnings = ride.bookings.reduce((sum, booking) => {
        // Driver gets total_fare - platform fee (₹30)
        const PLATFORM_FEE = 30;
        return sum + (Number(booking.total_fare) - PLATFORM_FEE);
      }, 0);

      return {
        rideId: ride.id,
        route: `${ride.start_location} → ${ride.end_location}`,
        completedAt: ride.completed_at,
        bookings: ride.bookings.length,
        earnings: rideEarnings,
        bookings: ride.bookings,
      };
    });

    res.json({
      earnings: earningsHistory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get driver earnings history error:', error);
    res.status(500).json({ error: error.message || 'Failed to get earnings history' });
  }
});

// Request Payout
router.post('/payout/request', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const walletBalance = Number(driver.wallet_balance) || 0;

    if (amount > walletBalance) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Check for pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        driverId: driver.id,
        status: { in: ['pending', 'processing'] },
      },
    });

    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const availableBalance = walletBalance - pendingAmount;

    if (amount > availableBalance) {
      return res.status(400).json({ 
        error: `Insufficient available balance. Available: ₹${availableBalance}, Pending payouts: ₹${pendingAmount}` 
      });
    }

    // Validate bank details
    if (!driver.bank_name || !driver.bank_ifsc_code || !driver.bank_account_number) {
      return res.status(400).json({ 
        error: 'Bank details are required. Please complete your KYC with bank information.' 
      });
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        driverId: driver.id,
        amount: amount,
        payout_method: 'bank',
        status: 'pending',
      },
    });

    res.status(201).json({
      payout,
      message: 'Payout request submitted successfully. It will be processed within 2-3 business days.',
    });
  } catch (error: any) {
    console.error('Request payout error:', error);
    res.status(500).json({ error: error.message || 'Failed to request payout' });
  }
});

// Get Payout History
router.get('/payouts', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const where: any = { driverId: driver.id };
    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payout.count({ where }),
    ]);

    res.json({
      payouts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get payouts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get payouts' });
  }
});

export default router;

