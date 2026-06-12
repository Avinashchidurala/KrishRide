import { getGoogleMapsApiKey } from '../config/maps';

interface EnvConfig {
  VITE_API_BASE_URL: string;
  VITE_GOOGLE_MAPS_API_KEY: string;
}

export const env: EnvConfig = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  VITE_GOOGLE_MAPS_API_KEY: getGoogleMapsApiKey(),
};

export const VITE_API_BASE_URL = env.VITE_API_BASE_URL;
export const VITE_GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY;

export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';

export const validateEnv = (): void => {
  const requiredEnvVars: Array<keyof EnvConfig> = ['VITE_API_BASE_URL'];

  const missingVars: string[] = [];
  for (const key of requiredEnvVars) {
    if (!env[key]) {
      missingVars.push(key);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`;
    console.error(errorMessage);
    if (isProduction) {
      throw new Error(errorMessage);
    }
  }
};

