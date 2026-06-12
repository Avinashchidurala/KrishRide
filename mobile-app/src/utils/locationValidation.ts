/**
 * Location Validation Utility for React Native
 * 
 * Validates if a selected location is within allowed states.
 * Use this utility when integrating Google Places API with React Native.
 */

// Allowed states for filtering
export const ALLOWED_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
] as const;

// Error message for invalid states
export const STATE_ERROR_MESSAGE = 'Currently available only in Andhra Pradesh, Telangana, Karnataka and Tamil Nadu';

/**
 * Address component interface (matches Google Places API structure)
 */
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/**
 * Validation result
 */
export interface StateValidationResult {
  isValid: boolean;
  state?: string;
  errorMessage?: string;
}

/**
 * Validate if the state from address_components is allowed
 * 
 * @param addressComponents - Address components from Google Places API
 * @returns Validation result with isValid flag and state name
 * 
 * @example
 * ```typescript
 * const placeDetails = await getPlaceDetails(placeId);
 * const validation = validateState(placeDetails.address_components);
 * 
 * if (!validation.isValid) {
 *   Alert.alert('Invalid Location', validation.errorMessage);
 *   return;
 * }
 * 
 * // Proceed with valid location
 * console.log('State:', validation.state);
 * ```
 */
export const validateState = (
  addressComponents: AddressComponent[] | undefined | null
): StateValidationResult => {
  if (!addressComponents || addressComponents.length === 0) {
    return {
      isValid: false,
      errorMessage: STATE_ERROR_MESSAGE,
    };
  }
  
  // Extract state from administrative_area_level_1
  const stateComponent = addressComponents.find(
    (comp) => comp.types.includes('administrative_area_level_1')
  );
  
  if (!stateComponent) {
    return {
      isValid: false,
      errorMessage: STATE_ERROR_MESSAGE,
    };
  }
  
  const state = stateComponent.long_name;
  const isValid = ALLOWED_STATES.includes(state as typeof ALLOWED_STATES[number]);
  
  return {
    isValid,
    state,
    errorMessage: isValid ? undefined : STATE_ERROR_MESSAGE,
  };
};

/**
 * Extract location details from address components
 */
export interface LocationDetails {
  city?: string;
  area?: string;
  state?: string;
  country?: string;
}

export const extractLocationDetails = (
  addressComponents: AddressComponent[] | undefined | null
): LocationDetails => {
  if (!addressComponents) {
    return {};
  }
  
  const details: LocationDetails = {};
  
  // Extract state
  const stateComponent = addressComponents.find(
    (comp) => comp.types.includes('administrative_area_level_1')
  );
  if (stateComponent) {
    details.state = stateComponent.long_name;
  }
  
  // Extract city (locality or administrative_area_level_2)
  const cityComponent = addressComponents.find(
    (comp) => comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
  );
  if (cityComponent) {
    details.city = cityComponent.long_name;
  }
  
  // Extract area (sublocality or neighborhood)
  const areaComponent = addressComponents.find(
    (comp) => comp.types.includes('sublocality') || 
              comp.types.includes('sublocality_level_1') ||
              comp.types.includes('neighborhood')
  );
  if (areaComponent) {
    details.area = areaComponent.long_name;
  }
  
  // Extract country
  const countryComponent = addressComponents.find(
    (comp) => comp.types.includes('country')
  );
  if (countryComponent) {
    details.country = countryComponent.long_name;
  }
  
  return details;
};

