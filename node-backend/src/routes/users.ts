import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { cacheService, cacheKeys, cacheTTL } from '../services/cacheService';
import { sendOTP, verifyOTP } from '../utils/otp';
import { generateTokenPair, hashRefreshToken } from '../utils/jwt';

const router = express.Router();

// User Signup - Step 1: Basic Info
router.post('/signup', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      gender,
      emergencyContactName,
      emergencyContactMobile,
      agreeTerms,
    } = req.body;

    if (!agreeTerms) {
      return res.status(400).json({ error: 'Must agree to Terms & Conditions' });
    }

    // Send OTP
    const otpResult = await sendOTP(mobile);
    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.message });
    }

    res.json({ message: 'OTP sent. Please verify to complete signup.' });
  } catch (error: any) {
    console.error('User signup error:', error);
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

// User Signup - Step 2: Verify OTP and Create Account
router.post('/signup/verify', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      gender,
      emergencyContactName,
      emergencyContactMobile,
      referralCode,
      otp,
    } = req.body;

    console.log(req.body)

    // Verify OTP
    if (!verifyOTP(mobile, otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Format mobile number consistently (OTP-only authentication)
    const cleanMobile = mobile.replace(/\D/g, '');
    const formattedMobile = `+91${cleanMobile}`;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { mobile: formattedMobile },
    });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate referral code for new user
    const userReferralCode = `HUSH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create user (OTP-only authentication, email is optional)
    user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        mobile: formattedMobile,
        email: email || null, // Email is optional
        gender: gender && gender.trim() !== '' ? gender.trim() : null, // Handle empty strings
        age: 25, // Default, should be collected
        role: 'customer',
        is_phone_verified: true,
        profile_completed: false,
        auth_provider: 'otp', // OTP-only authentication
      },
    });

    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
      },
    });

    // Create emergency contact
    if (emergencyContactName && emergencyContactMobile) {
      await prisma.emergencyContact.create({
        data: {
          userId: user.id,
          name: emergencyContactName,
          mobile: emergencyContactMobile,
          is_primary: true,
        },
      });
    }

    // Handle referral code if provided
    let referralCredit = null;
    if (referralCode) {
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

      if (referrer && referrer.referrals.length > 0) {
        const referral = referrer.referrals[0];
        
        // Update referral record
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            refereeId: customer.id,
            status: 'pending', // Will be completed after first ride
          },
        });
      }
    }

    // Generate token pair (access + refresh)
    const tokenPair = generateTokenPair({
      userId: user.id,
      role: user.role,
      mobile: user.mobile,
    });

    // Calculate refresh token expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database (hashed)
    const hashedToken = hashRefreshToken(tokenPair.refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send welcome email and SMS
    try {
      const userName = `${user.first_name} ${user.last_name}`.trim();
      
      // Send welcome SMS
      if (user.mobile) {
        const { sendWelcomeSMS } = await import('../utils/smsService');
        await sendWelcomeSMS(user.mobile, userName, 'customer');
      }

      // Send welcome email
      if (user.email) {
        const { sendWelcomeEmail } = await import('../utils/emailService');
        await sendWelcomeEmail(user.email, userName, 'customer');
      }
    } catch (error) {
      console.error('Error sending welcome notifications:', error);
      // Don't fail the signup if notifications fail
    }

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        referralCode: userReferralCode,
      },
      customer: {
        id: customer.id,
      },
      message: 'User account created successfully',
    });
  } catch (error: any) {
    console.error('User signup verify error:', error);
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

// Get User Profile (for customers and admins)
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // For customers
    if (userRole === 'customer') {
      const cacheKey = cacheKeys.userProfile(userId);

      // Try to get from cache
      const cachedProfile = await cacheService.get(cacheKey);
      if (cachedProfile) {
        return res.json({ profile: cachedProfile });
      }

      const customer = await prisma.customer.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              emergencyContacts: true,
              savedAddresses: true,
            },
          },
          bookings: {
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
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
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const profile = {
        firstName: customer.user.first_name,
        lastName: customer.user.last_name,
        mobile: customer.user.mobile,
        email: customer.user.email,
        gender: customer.user.gender,
        emergencyContacts: customer.user.emergencyContacts,
        savedAddresses: customer.user.savedAddresses,
        walletBalance: customer.wallet_balance,
        totalBookings: customer.total_bookings,
        completedBookings: customer.completed_bookings,
        averageRating: customer.average_rating,
        recentBookings: customer.bookings,
      };

      // Cache the profile
      await cacheService.set(cacheKey, profile, cacheTTL.userProfile);

      return res.json({ profile });
    }

    // For admins
    if (userRole === 'admin') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          admin: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = {
        firstName: user.first_name,
        lastName: user.last_name,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender,
        role: user.role,
      };

      return res.json({ profile });
    }

    return res.status(403).json({ error: 'Unauthorized to access profile' });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to get profile' });
  }
});

// Update User Profile (for customers and admins)
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { firstName, lastName, email, gender, emergencyContactName, emergencyContactMobile } = req.body;

    // For customers, check if customer record exists
    if (userRole === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: customer.userId },
        data: {
          first_name: firstName || customer.user.first_name,
          last_name: lastName || customer.user.last_name,
          email: email !== undefined ? email : customer.user.email,
          gender: gender !== undefined && gender !== '' ? gender : customer.user.gender,
        },
      });

      // Update emergency contact if provided
      if (emergencyContactName && emergencyContactMobile) {
        const cleanEmergency = emergencyContactMobile.replace(/\D/g, '');
        const formattedEmergency = `+91${cleanEmergency}`;

        const userClean = (customer.user.mobile || '').replace(/\D/g, '');  
        if (userClean && cleanEmergency && userClean.endsWith(cleanEmergency)) {
           return res.status(400).json({ error: "Emergency contact cannot be same as user mobile" });
        }

        const existingContact = await prisma.emergencyContact.findFirst({
          where: { userId: customer.userId, is_primary: true },
        });

        if (existingContact) {
          await prisma.emergencyContact.update({
            where: { id: existingContact.id },
            data: {
              name: emergencyContactName,
              mobile: formattedEmergency,
            },
          });
        } else {
          await prisma.emergencyContact.create({
            data: {
              userId: customer.userId,
              name: emergencyContactName,
              mobile: formattedEmergency,
              is_primary: true,
            },
          });
        }
      }

      // Invalidate profile cache
      const cacheKey = cacheKeys.userProfile(userId);
      await cacheService.delete(cacheKey);

      return res.json({ message: 'Profile updated successfully', user: updatedUser });
    }

    // For admins, update directly
    if (userRole === 'admin') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          first_name: firstName || user.first_name,
          last_name: lastName || user.last_name,
          email: email !== undefined ? email : user.email,
          gender: gender !== undefined && gender !== '' ? gender : user.gender,
        },
      });

      return res.json({ message: 'Profile updated successfully', user: updatedUser });
    }

    return res.status(403).json({ error: 'Unauthorized to update profile' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Upload Profile Photo
router.post('/profile/photo', authenticate, async (req: AuthRequest, res) => {
  try {
    const { photoUrl } = req.body;
    const userId = req.user!.userId;

    if (!photoUrl || typeof photoUrl !== 'string') {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    // Validate URL format
    try {
      new URL(photoUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid photo URL format' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profile_photo_url: photoUrl,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        profile_photo_url: true,
      },
    });

    // Invalidate profile cache
    const cacheKey = `user:profile:${userId}`;
    const { cacheService } = require('../services/cacheService');
    await cacheService.delete(cacheKey);

    res.json({
      message: 'Profile photo updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update profile photo error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile photo' });
  }
});

export default router;

