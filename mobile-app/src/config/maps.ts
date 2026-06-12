import Constants from 'expo-constants';

export interface MapsConfig {
  apiKey: string;
  countryRestrictions: string[];
  language: string;
  libraries: string[];
  placeTypes: string[];
  region: string;
}

export const getMapsConfig = (): MapsConfig | null => {
  try {
    const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey ||
                   Constants.expoConfig?.android?.config?.googleMaps?.apiKey;

    if (!apiKey) {
      console.warn('Google Maps API key not found in app config');
      return null;
    }

    return {
      apiKey,
      countryRestrictions: ['in'],
      language: 'en',
      libraries: ['places', 'geometry'],
      placeTypes: ['geocode', 'establishment'],
      region: 'IN'
    };
  } catch (error) {
    console.error('Error loading maps config:', error);
    return null;
  }
};

export const isGoogleMapsAvailable = (): boolean => {
  const config = getMapsConfig();
  return config !== null && !!config.apiKey;
};
