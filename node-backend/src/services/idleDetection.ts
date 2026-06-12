import prisma from '../config/database';
import { cacheService, cacheKeys, cacheTTL } from './cacheService';

const IDLE_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export const updateUserActivity = async (userId: string): Promise<void> => {
  const cacheKey = cacheKeys.userActivity(userId);
  await cacheService.set(cacheKey, new Date().toISOString(), cacheTTL.userActivity);
};

export const checkIdleUsers = async (): Promise<void> => {
  const now = new Date();
  const idleUsers: string[] = [];

  // Get all activity keys from Redis
  try {
    const { getRedisClient } = require('../config/redis');
    const client = getRedisClient();
    
    if (client) {
      // Get all activity keys
      const activityKeys = await client.keys('activity:*');
      
      for (const key of activityKeys) {
        const userId = key.replace('activity:', '');
        const lastActivityStr = await cacheService.get<string>(key);
        
        if (lastActivityStr) {
          const lastActivity = new Date(lastActivityStr);
          const idleTime = now.getTime() - lastActivity.getTime();
          
          if (idleTime >= IDLE_THRESHOLD_MS) {
            idleUsers.push(userId);
          }
        }
      }
    } else {
      // Fallback: If Redis is not available, skip idle detection
      console.log('⚠️ Redis not available, skipping idle detection');
      return;
    }
  } catch (error) {
    console.error('Error checking idle users:', error);
    return;
  }

  // Send notifications to idle users
  for (const userId of idleUsers) {
    try {
      // Check if user has active booking or ride
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customer: {
            include: {
              bookings: {
                where: {
                  status: {
                    in: ['confirmed', 'started'],
                  },
                },
              },
            },
          },
          driver: {
            include: {
              rides: {
                where: {
                  status: {
                    in: ['published', 'started'],
                  },
                },
              },
            },
          },
        },
      });

      // Note: Idle notifications removed (push notifications disabled)
      // User activity is still tracked for analytics purposes
    } catch (error) {
      console.error(`Error checking idle status for user ${userId}:`, error);
    }
  }
};

// Start idle detection service
export const startIdleDetection = (): void => {
  // Check for idle users every 5 minutes
  setInterval(() => {
    checkIdleUsers().catch((error) => {
      console.error('Idle detection error:', error);
    });
  }, CHECK_INTERVAL_MS);

  console.log('Idle detection service started');
};

// Clean up old activity records (Redis TTL handles this automatically)
export const cleanupActivityRecords = async (): Promise<void> => {
  // Redis TTL automatically expires keys, so no manual cleanup needed
  // This function is kept for compatibility but does nothing
};

