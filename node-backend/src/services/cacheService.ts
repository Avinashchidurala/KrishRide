import { getRedisClient } from '../config/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

class CacheService {
  private isAvailable(): boolean {
    return getRedisClient() !== null;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const client = getRedisClient()!;
      const value = await client.get(key);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient()!;
      const serialized = JSON.stringify(value);

      if (ttl) {
        await client.setEx(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient()!;
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const client = getRedisClient()!;
      const keys = await client.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      return await client.del(keys);
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient()!;
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern: Get from cache, or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetchFn();

    // Cache it
    await this.set(key, fresh, ttl);

    return fresh;
  }

  /**
   * Invalidate a cache key (alias for delete)
   */
  async invalidate(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, by: number = 1): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const client = getRedisClient()!;
      return await client.incrBy(key, by);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient()!;
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTtl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      const client = getRedisClient()!;
      return await client.ttl(key);
    } catch (error) {
      console.error(`Cache getTtl error for key ${key}:`, error);
      return -1;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const cacheKeys = {
  // Ride cache keys
  rideSearch: (params: Record<string, any>) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `ride:search:${sortedParams}`;
  },
  rideDetails: (rideId: string) => `ride:details:${rideId}`,
  rideList: (filters: string) => `ride:list:${filters}`,

  // User cache keys
  userProfile: (userId: string) => `user:profile:${userId}`,
  userBookings: (userId: string, status?: string) => 
    `user:bookings:${userId}${status ? `:${status}` : ''}`,

  // Driver cache keys
  driverProfile: (driverId: string) => `driver:profile:${driverId}`,
  driverStats: (driverId: string) => `driver:stats:${driverId}`,
  driverVehicles: (driverId: string) => `driver:vehicles:${driverId}`,

  // Admin cache keys
  adminStats: () => 'admin:stats',
  adminRecentActivity: () => 'admin:recent-activity',
  adminUsers: (filters: string) => `admin:users:${filters}`,
  adminRides: (filters: string) => `admin:rides:${filters}`,
  adminBookings: (filters: string) => `admin:bookings:${filters}`,
  adminRevenue: (period: string) => `admin:revenue:${period}`,

  // OTP cache keys
  otp: (mobile: string, type: string) => `otp:${type}:${mobile}`,

  // Idle detection
  userActivity: (userId: string) => `activity:${userId}`,

  // Masked numbers
  maskedNumber: (driverMobile: string, customerMobile: string) => 
    `masked:${driverMobile}:${customerMobile}`,

  // Service states cache keys
  activeStates: () => 'service:states:active',
  allStates: () => 'service:states:all',
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  rideSearch: 10, // 10 seconds
  rideDetails: 300, // 5 minutes
  userProfile: 600, // 10 minutes
  driverProfile: 600, // 10 minutes
  driverStats: 300, // 5 minutes
  adminStats: 20, // 1 minute
  adminRevenue: 300, // 5 minutes
  otp: 600, // 10 minutes
  userActivity: 3600, // 1 hour
  maskedNumber: 86400, // 24 hours
  activeStates: 3600, // 1 hour
  allStates: 3600, // 1 hour
};

