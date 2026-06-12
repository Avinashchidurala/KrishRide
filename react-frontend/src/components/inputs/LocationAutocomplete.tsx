import { useState, useEffect, useCallback } from 'react';
import GooglePlacesAutocomplete from '../maps/GooglePlacesAutocomplete';
import GoogleMapsLoader from '../maps/GoogleMapsLoader';

/**
 * Standardized location object returned by onSelect callback
 */
export interface LocationObject {
  label: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: 'India';
  type: 'CITY' | 'AREA' | 'LANDMARK';
  fulldata: google.maps.places.PlaceResult;
}

interface LocationAutocompleteProps {
  value: string;
  onSelect: (location: LocationObject) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  suggestions?: Array<{
    label: string;
    lat: number;
    lng: number;
    isSaved?: boolean;
  }>;
}

/**
 * Extract city, state, and location type
 */
const extractLocationDetails = (
  addressComponents: google.maps.places.PlaceResult['address_components'],
  placeTypes: string[]
): {
  city: string;
  state: string;
  type: LocationObject['type'];
} => {
  const components = addressComponents || [];

  const state =
    components.find((c) =>
      c.types.includes('administrative_area_level_1')
    )?.long_name || 'Unknown';

  const city =
    components.find(
      (c) =>
        c.types.includes('locality') ||
        c.types.includes('administrative_area_level_2')
    )?.long_name || 'Unknown';

  let type: LocationObject['type'] = 'LANDMARK';

  if (placeTypes.includes('locality')) type = 'CITY';
  else if (
    placeTypes.includes('sublocality') ||
    placeTypes.includes('sublocality_level_1') ||
    placeTypes.includes('neighborhood')
  )
    type = 'AREA';

  return { city, state, type };
};

export default function LocationAutocomplete({
  value,
  onSelect,
  disabled = false,
  error,
  helperText,
  suggestions = [], 
}: LocationAutocompleteProps) {
  
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = useCallback(
    async (address: string, location?: { lat: number; lng: number }) => {
      setCurrentValue(address);

      if (!location) return;

      if (
        typeof window !== 'undefined' &&
        window.google?.maps?.Geocoder
      ) {
        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location }, (results, status) => {
          if (
            status === window.google.maps.GeocoderStatus.OK &&
            results?.[0]
          ) {
            const place = results[0];

            const details = extractLocationDetails(
              place.address_components || [],
              place.types || []
            );

            console.log('Geocoded Place:', place, 'Details:', details);

            const locationObj: LocationObject = {
              label: place.formatted_address || address,
              lat: location.lat,
              lng: location.lng,
              city: details.city,
              state: details.state,
              country: 'India',
              type: details.type,
              fulldata: place,
            };

            onSelect(locationObj);
          }
        });
      } else {
        // Hard fallback
        onSelect({
          label: address,
          lat: location.lat,
          lng: location.lng,
          city: 'Unknown',
          state: 'Unknown',
          country: 'India',
          type: 'LANDMARK',
          fulldata: {},
        });
      }
    },
    [onSelect]
  );

  return (
    <GoogleMapsLoader>
      <GooglePlacesAutocomplete
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        error={error}
        helperText={helperText}
        suggestions={suggestions}   

      />
    </GoogleMapsLoader>
  );
}
