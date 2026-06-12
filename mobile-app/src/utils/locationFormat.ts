/**
 * Location Format Utilities for Mobile App
 * 
 * Standardized location format matching the web app
 */

import { validateState, extractLocationDetails, AddressComponent } from './locationValidation';

/**
 * Standardized location object format (matches web app)
 */
export interface StandardLocation {
  label: string;                    // Formatted address or place name
  lat: number;                      // Latitude
  lng: number;                      // Longitude
  city: string;                     // City name (required)
  state: string;                    // State name (required)
  country: 'India';                 // Country (always "India")
  type: 'CITY' | 'AREA' | 'LANDMARK'; // Location type (uppercase)
}

/**
 * Location type enum
 */
export type LocationType = 'CITY' | 'AREA' | 'LANDMARK';

/**
 * Map Google Place types to standardized location type
 */
export const mapPlaceTypeToLocationType = (placeTypes: string[]): LocationType => {
  if (placeTypes.includes('locality')) {
    return 'CITY';
  }
  if (placeTypes.includes('sublocality') || 
      placeTypes.includes('sublocality_level_1') ||
      placeTypes.includes('neighborhood')) {
    return 'AREA';
  }
  if (placeTypes.includes('point_of_interest')) {
    return 'LANDMARK';
  }
  
  if (placeTypes.includes('administrative_area_level_2')) {
    return 'CITY';
  }
  
  return 'LANDMARK';
};

/**
 * Extract standardized location from Google Places result
 */
export const extractStandardizedLocation = (
  place: any,
  fallbackLabel?: string
): StandardLocation => {
  const components: AddressComponent[] = place.address_components || [];
  const placeTypes: string[] = place.types || [];
  
  // Extract state (required)
  const stateComponent = components.find(
    (comp) => comp.types.includes('administrative_area_level_1')
  );
  const state = stateComponent?.long_name || 'Unknown';
  
  // Extract city (required)
  let city = '';
  const cityComponent = components.find(
    (comp) => comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
  );
  if (cityComponent) {
    city = cityComponent.long_name;
  } else {
    // Fallback: extract city from formatted address
    const formattedAddress = place.formatted_address || fallbackLabel || '';
    const parts = formattedAddress.split(',');
    if (parts.length > 0) {
      city = parts[0].trim();
    } else {
      city = 'Unknown';
    }
  }
  
  // Map place types to standardized location type
  const type = mapPlaceTypeToLocationType(placeTypes);
  
  return {
    label: place.formatted_address || place.name || fallbackLabel || 'Unknown',
    lat: place.geometry?.location?.lat || place.geometry?.location?.latitude || 0,
    lng: place.geometry?.location?.lng || place.geometry?.location?.longitude || 0,
    city,
    state,
    country: 'India',
    type,
  };
};

/**
 * Validate and extract standardized location from Google Places result
 * Returns null if state is not in allowed list
 */
export const validateAndExtractLocation = (
  place: any,
  fallbackLabel?: string
): StandardLocation | null => {
  const components: AddressComponent[] = place.address_components || [];
  
  // Validate state
  const validation = validateState(components);
  if (!validation.isValid) {
    return null;
  }
  
  // Extract standardized location
  return extractStandardizedLocation(place, fallbackLabel);
};

