/**
 * Shared Google Maps Configuration
 * 
 * This configuration file provides a centralized way to manage Google Maps API settings
 * for both React Web and React Native (Expo) applications.
 * 
 * Environment Variables Required:
 * - React Web (Vite): VITE_GOOGLE_MAPS_API_KEY
 * - React Native (Expo): EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
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
 * Get Google Maps API key from environment variables
 * Supports both React Web (Vite) and React Native (Expo)
 */
export const getGoogleMapsApiKey = (): string => {
  // React Web (Vite) - uses import.meta.env
  // Note: import.meta.env is available at build time in Vite
  try {
    // @ts-ignore - import.meta is available in Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const viteKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (viteKey && viteKey.trim() !== '' && viteKey !== 'your_google_maps_api_key_here') {
        return viteKey;
      }
    }
  } catch (e) {
    // import.meta not available, continue to other options
  }
  
  // React Native (Expo) - uses process.env or Constants
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
  
  // Try Expo Constants if available (for React Native)
  // Skip this entirely in web builds to avoid bundling expo-constants
  // This code path is only for React Native/Expo environments
  // In web builds, we rely on import.meta.env (Vite) or process.env
  
  return '';
};

/**
 * Default Google Maps configuration
 */
export const defaultMapsConfig: Omit<MapsConfig, 'apiKey'> = {
  libraries: ['places', 'directions'],
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
 * Check if Google Maps API is available
 */
export const isGoogleMapsAvailable = (): boolean => {
  const config = getMapsConfig();
  return config !== null && typeof google !== 'undefined';
};

/**
 * Places Autocomplete options
 */
export interface AutocompleteOptions {
  types?: string[];
  componentRestrictions?: { country: string | string[] };
  fields?: string[];
  bounds?: google.maps.LatLngBounds;
  strictBounds?: boolean;
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

/**
 * Load Google Maps script (for React Web)
 */
export const loadGoogleMapsScript = (
  apiKey: string,
  libraries: string[] = ['places', 'directions'],
  callback?: () => void
): void => {
  if (typeof window === 'undefined') return;
  
  // Check if script is already loaded
  if (window.google && window.google.maps) {
    callback?.();
    return;
  }
  
  // Check if script is already in the DOM
  const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
  if (existingScript) {
    existingScript.addEventListener('load', () => callback?.());
    return;
  }
  
  // Create and append script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&language=en&region=IN`;
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    callback?.();
  };
  
  script.onerror = () => {
    console.error('Failed to load Google Maps script');
  };
  
  document.head.appendChild(script);
};

