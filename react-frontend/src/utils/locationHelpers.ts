/**
 * Location Helper Utilities
 * Utility functions for extracting and formatting location data
 */

import { LocationObject } from '../components/inputs/LocationAutocomplete';

/**
 * Extract location display text from LocationObject or location string
 * This function returns exactly what LocationAutocomplete shows after selecting a place:
 * - For LocationObject: returns the label (formatted_address) - same as what appears in the input field
 * - For string: returns the full string (as stored in database)
 * 
 * @param location - LocationObject with label property, or location string
 * @returns The full location label/string (matches what LocationAutocomplete displays)
 */
export const getCityName = (location: LocationObject | string | null | undefined): string => {
  if (!location) {
    return '';
  }
  
  // If LocationObject, return the label (formatted_address) - exactly what LocationAutocomplete shows
  if (typeof location === 'object' && 'label' in location) {
    return location.label || '';
  }
  
  // If string (e.g., from database), return as-is - this is what was stored
  if (typeof location === 'string') {
    return location.trim();
  }
  
  return '';
};

