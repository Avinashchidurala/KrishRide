import { createClient, RedisClientType } from 'redis';
import { config } from './environment';

let redisClient: RedisClientType | null = null;

export const initializeRedis = async (): Promise<void> => {
  try {
    if (!config.redisUrl) {
      console.log('⚠️ Redis URL not configured. Caching will be disabled.');
      return;
    }

    redisClient = createClient({
      url: config.redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Too many reconnection attempts. Giving up.');
            return new Error('Too many reconnection attempts');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Connected and ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis initialization error:', error);
    console.log('⚠️ Caching will be disabled. App will continue without Redis.');
    redisClient = null;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis: Connection closed');
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await closeRedis();
});

