import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import crypto from 'crypto';

export interface JWTPayload {
  userId: string;
  role: string;
  mobile: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  });
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as string,
  });
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Generate a secure random token for refresh token storage
 */
export const generateRefreshTokenHash = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash refresh token for storage
 */
export const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Legacy support
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;

