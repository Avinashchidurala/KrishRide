import express from 'express';
import { sendOTP, verifyOTP } from '../utils/otp';
import { generateTokenPair, hashRefreshToken, verifyRefreshToken } from '../utils/jwt';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { config } from '../config/environment';
import { asyncHandler, sendErrorResponse, sendSuccessResponse, ApiError } from '../utils/errors';
import { ErrorCode } from '../utils/errorCodes';

const router = express.Router();

// Request OTP for login (OTP-only authentication)
router.post('/login', asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    sendErrorResponse(res, ErrorCode.VALIDATION_REQUIRED, 'Mobile number is required', { field: 'mobile' });
    return;
  }

  // Check if user exists before sending OTP - users must register first
  const cleanMobile = mobile.replace(/\D/g, '');
  const formattedMobile = `+91${cleanMobile}`;
  
  const user = await prisma.user.findUnique({
    where: { mobile: formattedMobile },
  });

  if (!user) {
    sendErrorResponse(res, ErrorCode.AUTH_USER_NOT_FOUND, 'User not found. Please sign up first.');
    return;
  }

  // Mobile validation is handled in sendOTP
  const result = await sendOTP(mobile);
  
  // In dev mode, OTP is logged to console even if Twilio fails
  // So we still allow the request to succeed
  if (!result.success) {
    // Check if it's a Twilio auth error - if so, allow dev mode
    if (result.message.includes('Authenticate') || result.message.includes('Twilio')) {
      console.warn('[Auth] Twilio authentication failed - OTP logged to console (dev mode)');
      // Still return success since OTP is stored and logged
      sendSuccessResponse(res, { 
        message: 'OTP sent successfully. Valid for 5 minutes. (Check console for OTP in dev mode)',
        devMode: true 
      });
      return;
    }
    // For other errors, return error
    sendErrorResponse(res, ErrorCode.AUTH_OTP_NOT_SENT, result.message);
    return;
  }

  sendSuccessResponse(res, { message: 'OTP sent successfully. Valid for 5 minutes.' });
}));

// Verify OTP and login (OTP-only authentication)
router.post('/login/verify', asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    sendErrorResponse(res, ErrorCode.VALIDATION_REQUIRED, 'Mobile number and OTP are required', { fields: ['mobile', 'otp'] });
    return;
  }

  // Verify OTP (expires after 5 minutes)
  if (!verifyOTP(mobile, otp)) {
    sendErrorResponse(res, ErrorCode.AUTH_OTP_INVALID, 'Invalid or expired OTP');
    return;
  }

    // Format mobile number consistently
    const cleanMobile = mobile.replace(/\D/g, '');
    const formattedMobile = `+91${cleanMobile}`;
    
    // Check if user exists - users must register first
    const user = await prisma.user.findUnique({
      where: { mobile: formattedMobile },
      include: {
        driver: true,
        customer: true,
        admin: true,
      },
    });

    if (!user) {
      // User not registered - must signup first
      sendErrorResponse(res, ErrorCode.AUTH_USER_NOT_FOUND, 'User not found. Please sign up first.');
      return;
    }

      // Update phone verification status and last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          is_phone_verified: true,
          last_login: new Date(),
          auth_provider: 'otp', // Ensure auth_provider is set to OTP
        },
      });

    // Validate user role (must be customer, driver, or admin)
    if (!['customer', 'driver', 'admin'].includes(user.role)) {
      sendErrorResponse(res, ErrorCode.AUTH_ROLE_INVALID, 'Invalid user role', { role: user.role });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      sendErrorResponse(res, ErrorCode.AUTH_USER_INACTIVE, 'User account is inactive');
      return;
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

    sendSuccessResponse(res, {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        mobile: user.mobile,
        role: user.role,
        profileCompleted: user.profile_completed,
        isPhoneVerified: user.is_phone_verified,
      },
    });
}));

// Refresh access token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    sendErrorResponse(res, ErrorCode.AUTH_REFRESH_TOKEN_INVALID, 'Refresh token required');
    return;
  }

  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    sendErrorResponse(res, ErrorCode.AUTH_REFRESH_TOKEN_INVALID, 'Invalid or expired refresh token');
    return;
  }

  // Check if refresh token exists in database and is not revoked
  const hashedToken = hashRefreshToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    sendErrorResponse(res, ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED, 'Invalid or expired refresh token');
    return;
  }

  // Check if user is still active
  if (!storedToken.user.is_active) {
    // Revoke all tokens for inactive user
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revoked: true, revokedAt: new Date() },
    });
    sendErrorResponse(res, ErrorCode.AUTH_USER_INACTIVE, 'User account is inactive');
    return;
  }

  // Generate new access token
  const { generateAccessToken } = require('../utils/jwt');
  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    role: payload.role,
    mobile: payload.mobile,
  });

  sendSuccessResponse(res, {
    accessToken: newAccessToken,
  });
}));

// Logout - Revoke refresh token
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = (req as any).user?.userId;

    if (refreshToken && userId) {
      // Revoke the specific refresh token
      const hashedToken = hashRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          token: hashedToken,
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });
    } else if (userId) {
      // Revoke all refresh tokens for the user
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

// Revoke all refresh tokens (for security - e.g., account compromise)
router.post('/revoke-all-tokens', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Revoke all refresh tokens for the user
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    res.json({ message: 'All tokens revoked successfully' });
  } catch (error: any) {
    console.error('Revoke tokens error:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke tokens' });
  }
});

// Get current user details
router.get('/me', authenticate, asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    sendErrorResponse(res, ErrorCode.AUTH_UNAUTHORIZED, 'Unauthorized');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      driver: true,
      customer: true,
      admin: true,
    },
  });

  if (!user) {
    sendErrorResponse(res, ErrorCode.USER_NOT_FOUND, 'User not found', { userId });
    return;
  }

  sendSuccessResponse(res, {
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      profileCompleted: user.profile_completed,
      isPhoneVerified: user.is_phone_verified,
      profile_photo_url: user.profile_photo_url,
      driver: user.driver,
      customer: user.customer,
      admin: user.admin,
    },
  });
}));

export default router;

