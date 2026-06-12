import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { generateReferralCode } from '../utils/helpers';

const router = express.Router();

// Get User's Referral Code
router.get('/code', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find existing referral record where this customer is the referrer
    let referral = await prisma.referral.findFirst({
      where: {
        referrerId: customer.id,
        refereeId: null, // This is the "template" referral code for referring others
      },
    });

    let referralCode: string;

    if (!referral) {
      // Generate new referral code
      referralCode = generateReferralCode();
      
      // Create referral record (without refereeId - this is the customer's referral code)
      // We create a "pending" referral that will be used when someone uses this code
      referral = await prisma.referral.create({
        data: {
          referrerId: customer.id,
          referral_code: referralCode,
          status: 'pending',
          valid_till: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
        },
      });
    } else {
      referralCode = referral.referral_code;
    }

    res.json({
      referralCode,
      message: 'Refer now and Earn ₹100 Hush Cash',
      terms: 'Earn ₹100 for each successful referral when the referred customer registers using your referral code and completes their first valid Ride. The bonus is non-transferable, cannot be redeemed for cash, and will be credited after your referee completes the first successful trip.',
    });
  } catch (error: any) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral code' });
  }
});

// Get Referral Stats
router.get('/stats', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all referrals where this customer is the referrer
    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: customer.id,
        refereeId: { not: null }, // Only count referrals that have been used
      },
      include: {
        referee: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    // Calculate stats
    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter(r => r.status === 'completed').length;
    
    // Calculate total earnings from completed referrals
    const completedReferrals = referrals.filter(r => r.status === 'completed');
    const totalEarnings = completedReferrals.length * 100; // ₹100 per successful referral

    // Get pending referrals (applied but not yet completed)
    const pendingReferrals = referrals.filter(r => r.status === 'pending');

    res.json({
      totalReferrals,
      successfulReferrals,
      pendingReferrals: pendingReferrals.length,
      totalEarnings,
      referrals: referrals.map(r => ({
        id: r.id,
        referralCode: r.referral_code,
        status: r.status,
        createdAt: r.createdAt,
        creditedAt: r.credited_at,
        referee: r.referee ? {
          name: `${r.referee.user.first_name} ${r.referee.user.last_name}`,
          mobile: r.referee.user.mobile,
        } : null,
      })),
    });
  } catch (error: any) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral stats' });
  }
});

// Apply Referral Code (during signup)
router.post('/apply', async (req, res) => {
  try {
    const { referralCode, customerId } = req.body;

    const referrer = await prisma.customer.findFirst({
      where: {
        referrals: {
          some: {
            referral_code: referralCode,
            status: 'pending',
          },
        },
      },
      include: {
        referrals: {
          where: {
            referral_code: referralCode,
          },
        },
      },
    });

    if (!referrer || referrer.referrals.length === 0) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    const referral = referrer.referrals[0];

    // Update referral record
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        refereeId: customerId,
        status: 'pending', // Will be completed after first ride
      },
    });

    res.json({ message: 'Referral code applied successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to apply referral code' });
  }
});

// Process Referral Bonus after First Ride (for customers) or First Ride Post (for drivers)
export const processReferralBonus = async (customerId: string, bookingId?: string) => {
  try {
    const referral = await prisma.referral.findFirst({
      where: {
        refereeId: customerId,
        status: 'pending',
      },
    });

    if (!referral) {
      return; // No referral to process
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: true,
      },
    });

    if (!customer) {
      return;
    }

    // Check if this is for a customer (booking) or driver (ride post)
    const isDriver = customer.user.role === 'driver';
    
    if (isDriver) {
      // For drivers: check if this is their first ride post
      const driver = await prisma.driver.findUnique({
        where: { userId: customer.userId },
      });

      if (!driver || Number(driver.total_rides) !== 1) {
        return; // Not first ride post
      }
    } else {
      // For customers: check if this is their first completed ride
      if (!bookingId || Number(customer.completed_bookings) !== 1) {
        return; // Not first completed ride
      }
    }

    // Calculate expiry (30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Credit ₹100 to referrer's wallet
    await prisma.customer.update({
      where: { id: referral.referrerId },
      data: {
        wallet_balance: { increment: 100 },
      },
    });

    // Create wallet transaction for referrer
    const bonusDescription = isDriver 
      ? 'Referral bonus - ₹100 (Driver posted first ride)'
      : 'Referral bonus - ₹100';
    
    await prisma.walletTransaction.create({
      data: {
        customerId: referral.referrerId,
        amount: 100,
        type: 'credit',
        transaction_type: 'referral',
        description: bonusDescription,
        referralId: referral.id,
        valid_till: expiryDate,
      },
    });

    // Credit ₹100 to referee's wallet (only if they're a customer, not a driver)
    if (!isDriver) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          wallet_balance: { increment: 100 },
        },
      });

      // Create wallet transaction for referee (customer)
      await prisma.walletTransaction.create({
        data: {
          customerId,
          amount: 100,
          type: 'credit',
          transaction_type: 'referral',
          description: 'Referral bonus - ₹100',
          referralId: referral.id,
          valid_till: expiryDate,
        },
      });
    }

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        credited_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Process referral bonus error:', error);
  }
};


export default router;

