/**
 * Example usage of location validation utility for React Native
 */

import { validateState, STATE_ERROR_MESSAGE, extractLocationDetails } from './locationValidation';
import { Alert } from 'react-native';

/**
 * Example: Validate location after getting place details from Google Places API
 */
export async function handleLocationSelection(placeId: string) {
  try {
    // Assuming you have a function to get place details
    // This is a placeholder - use your actual Google Places API implementation
    const placeDetails = await getPlaceDetails(placeId);
    
    // Validate state
    const validation = validateState(placeDetails.address_components);
    
    if (!validation.isValid) {
      // Reject the selection and show error
      Alert.alert(
        'Invalid Location',
        validation.errorMessage || STATE_ERROR_MESSAGE,
        [{ text: 'OK' }]
      );
      return null; // Reject the selection
    }
    
    // Extract location details
    const locationDetails = extractLocationDetails(placeDetails.address_components);
    
    // Proceed with valid location
    return {
      formattedAddress: placeDetails.formatted_address,
      placeId: placeDetails.place_id,
      location: {
        lat: placeDetails.geometry.location.lat,
        lng: placeDetails.geometry.location.lng,
      },
      ...locationDetails,
    };
  } catch (error) {
    console.error('Error validating location:', error);
    Alert.alert('Error', 'Failed to validate location');
    return null;
  }
}

/**
 * Example: Using with react-native-google-places-autocomplete
 */
export function createLocationAutocompleteHandler() {
  return {
    onPress: async (data: any, details: any) => {
      if (!details) {
        Alert.alert('Error', 'Location details not available');
        return;
      }
      
      // Validate state
      const validation = validateState(details.address_components);
      
      if (!validation.isValid) {
        Alert.alert(
          'Invalid Location',
          validation.errorMessage || STATE_ERROR_MESSAGE
        );
        return; // Reject selection
      }
      
      // Proceed with valid location
      console.log('Valid location selected:', {
        address: details.formatted_address,
        state: validation.state,
        coordinates: {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        },
      });
      
      // Call your onSelect handler here
      // onSelect({ ... });
    },
  };
}

// Placeholder function - replace with your actual implementation
async function getPlaceDetails(placeId: string): Promise<any> {
  // Use Google Places API to get place details
  // This is just a placeholder
  throw new Error('Implement getPlaceDetails using your Google Places API client');
}

