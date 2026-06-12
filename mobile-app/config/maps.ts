/**
 * Shared Google Maps Configuration for React Native (Expo)
 * 
 * This configuration file provides a centralized way to manage Google Maps API settings
 * for React Native (Expo) applications.
 * 
 * Environment Variables Required:
 * - React Native (Expo): EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 * 
 * To use this in app.json/app.config.js:
 * ```json
 * {
 *   "expo": {
 *     "extra": {
 *       "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *     }
 *   }
 * }
 * ```
 */

/**
 * Google Maps Places API configuration
 */
export interface MapsConfig {
  apiKey: string;
  libraries: string[];
  region: string;
  language: string;
  countryRestrictions?: string[];
  placeTypes?: string[];
}

/**
 * Get Google Maps API key from environment variables (React Native/Expo)
 */
export const getGoogleMapsApiKey = (): string => {
  // Expo uses process.env for EXPO_PUBLIC_ prefixed vars
  if (typeof process !== 'undefined' && process.env) {
    // Try Expo's EXPO_PUBLIC_ prefix first
    if (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    }
    // Fallback to regular env var
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return process.env.GOOGLE_MAPS_API_KEY;
    }
  }
  
  // Try Expo Constants if available
  try {
    const Constants = require('expo-constants');
    if (Constants.default?.expoConfig?.extra?.googleMapsApiKey) {
      return Constants.default.expoConfig.extra.googleMapsApiKey;
    }
  } catch (e) {
    // Expo Constants not available, continue
  }
  
  return '';
};

/**
 * Default Google Maps configuration
 */
export const defaultMapsConfig: Omit<MapsConfig, 'apiKey'> = {
  libraries: ['places'],
  region: 'IN', // India
  language: 'en',
  countryRestrictions: ['in'], // Restrict to India
  placeTypes: ['geocode', 'establishment'], // Addresses and establishments
};

/**
 * Get complete maps configuration
 */
export const getMapsConfig = (): MapsConfig | null => {
  const apiKey = getGoogleMapsApiKey();
  
  if (!apiKey) {
    console.warn('Google Maps API key is not configured. Location autocomplete will be disabled.');
    return null;
  }
  
  return {
    apiKey,
    ...defaultMapsConfig,
  };
};

/**
 * Check if Google Maps API is configured
 */
export const isGoogleMapsConfigured = (): boolean => {
  const config = getMapsConfig();
  return config !== null;
};

/**
 * Places Autocomplete options for React Native
 */
export interface AutocompleteOptions {
  types?: string[];
  componentRestrictions?: { country: string | string[] };
  fields?: string[];
}

/**
 * Get default autocomplete options
 */
export const getAutocompleteOptions = (
  customOptions?: Partial<AutocompleteOptions>
): AutocompleteOptions => {
  const config = getMapsConfig();
  
  return {
    types: config?.placeTypes || ['geocode', 'establishment'],
    componentRestrictions: {
      country: config?.countryRestrictions || ['in'],
    },
    fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
    ...customOptions,
  };
};

