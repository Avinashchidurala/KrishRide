/**
 * Location Format Utilities
 * 
 * Standardized location format for the application.
 * All locations are represented using this format for consistency.
 */

/**
 * Standardized location object format
 * All locations throughout the application use this format
 */
export interface StandardLocation {
  label: string;                    // Formatted address or place name
  lat: number;                      // Latitude
  lng: number;                      // Longitude
  city: string;                     // City name (required)
  state: string;                    // State name (required)
  country: 'India';                 // Country (always "India" for this app)
  type: 'CITY' | 'AREA' | 'LANDMARK'; // Location type (uppercase)
}

/**
 * Location type enum
 */
export type LocationType = 'CITY' | 'AREA' | 'LANDMARK';

/**
 * Map Google Place types to standardized location type
 * Rules:
 * - locality → CITY
 * - sublocality / neighborhood → AREA
 * - point_of_interest → LANDMARK
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
  
  // Default fallback based on other types
  if (placeTypes.includes('administrative_area_level_2')) {
    return 'CITY';
  }
  
  // Default to LANDMARK for establishments and other types
  return 'LANDMARK';
};

/**
 * Extract standardized location from Google Places result
 * Returns location in the standardized format
 */
export const extractStandardizedLocation = (
  place: google.maps.places.PlaceResult,
  fallbackLabel?: string
): StandardLocation => {
  const components = place.address_components || [];
  const placeTypes = place.types || [];
  
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
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
    city,
    state,
    country: 'India',
    type,
  };
};

