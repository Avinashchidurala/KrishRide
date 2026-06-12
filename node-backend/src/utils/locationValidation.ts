/**
 * Location Validation Utility
 * 
 * Validates location states for ride search and creation requests.
 * 100% database-driven - checks if state exists in service_states table and is_active = true
 */

import { stateValidationService } from '../services/stateValidationService';

// Single consistent error message used across all validations
const UNAVAILABLE_LOCATION_MESSAGE = 'Services are not available for the location you are searching.';

/**
 * Location object interface (matches frontend standardized format)
 */
export interface LocationObject {
  label: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: 'India';
  type: 'CITY' | 'AREA' | 'LANDMARK';
}

/**
 * Validation result
 */
export interface LocationValidationResult {
  isValid: boolean;
  error?: string;
  state?: string;
}

/**
 * Validate if a state is available and active in the database
 * 
 * @param state - State name to validate
 * @returns Validation result with isValid flag and error message if invalid
 */
export const validateState = async (state: string | undefined | null): Promise<LocationValidationResult> => {
  if (!state || typeof state !== 'string') {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  const normalizedState = state.trim();
  const isAvailable = await stateValidationService.isStateAvailable(normalizedState);

  if (!isAvailable) {
    return {
      isValid: false,
      state: normalizedState,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  // Get exact state name from database (handles case variations)
  const exactStateName = await stateValidationService.getExactStateName(normalizedState);

  return {
    isValid: true,
    state: exactStateName || normalizedState,
  };
};

/**
 * Validate a location object
 * 
 * @param location - Location object with state information
 * @param locationName - Name of the location field (e.g., "pickup" or "drop") for error messages
 * @returns Validation result - validates state exists and is active in database
 */
export const validateLocation = async (
  location: LocationObject | string | undefined | null,
  locationName: string = 'location'
): Promise<LocationValidationResult> => {
  if (!location) {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  // If it's a string, reject (state information is required)
  if (typeof location === 'string') {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  // Validate the location object has state
  if (typeof location !== 'object' || !location.state) {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  // Validate state is active in database
  return validateState(location.state);
};

/**
 * Validate both pickup and drop locations for search/host requests
 * Enforces that both locations must have valid state information and the state must be active.
 * 
 * @param from - Pickup location (LocationObject required)
 * @param to - Drop location (LocationObject required)
 * @returns Validation result - both must be valid location objects from active service states
 */
export const validateSearchLocations = async (
  from: LocationObject | string | undefined | null,
  to: LocationObject | string | undefined | null
): Promise<LocationValidationResult> => {
  // Validate pickup location
  if (!from || typeof from !== 'object' || !from.state) {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  const fromValidation = await validateState(from.state);
  if (!fromValidation.isValid) {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
      state: fromValidation.state,
    };
  }

  // Validate drop location
  if (!to || typeof to !== 'object' || !to.state) {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
    };
  }

  const toValidation = await validateState(to.state);
  if (!toValidation.isValid) {
    return {
      isValid: false,
      error: UNAVAILABLE_LOCATION_MESSAGE,
      state: toValidation.state,
    };
  }

  // Both locations are valid and in active service states
  return {
    isValid: true,
    state: fromValidation.state,
  };
};

