/**
 * Example usage of LocationAutocomplete component
 * 
 * This file demonstrates how to use the LocationAutocomplete component
 * in your application.
 */

import { useState } from 'react';
import LocationAutocomplete, { LocationObject } from './LocationAutocomplete';
import { Box, Typography, Paper } from '@mui/material';

export default function LocationAutocompleteExample() {
  const [selectedLocation, setSelectedLocation] = useState<LocationObject | null>(null);

  const handleLocationSelect = (location: LocationObject) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        Location Autocomplete Example
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <LocationAutocomplete
          value={selectedLocation?.label || ''}
          onSelect={handleLocationSelect}
        />
      </Box>

      {selectedLocation && (
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Selected Location
          </Typography>
          <Typography variant="body2">
            <strong>Label:</strong> {selectedLocation.label}
          </Typography>
          <Typography variant="body2">
            <strong>City:</strong> {selectedLocation.city}
          </Typography>
          <Typography variant="body2">
            <strong>State:</strong> {selectedLocation.state}
          </Typography>
          <Typography variant="body2">
            <strong>Country:</strong> {selectedLocation.country}
          </Typography>
          <Typography variant="body2">
            <strong>Type:</strong> {selectedLocation.type}
          </Typography>
          <Typography variant="body2">
            <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

/**
 * Example with form integration
 */
export function LocationAutocompleteFormExample() {
  const [pickupLocation, setPickupLocation] = useState<LocationObject | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationObject | null>(null);

  const handleSubmit = () => {
    if (pickupLocation && dropLocation) {
      console.log('Form submission:', {
        pickup: pickupLocation,
        drop: dropLocation,
      });
    }
  };

  return (
    <Box component="form" sx={{ p: 3, maxWidth: 600 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Pickup Location
        </Typography>
        <LocationAutocomplete
          value={pickupLocation?.label || ''}
          onSelect={setPickupLocation}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Drop Location
        </Typography>
        <LocationAutocomplete
          value={dropLocation?.label || ''}
          onSelect={setDropLocation}
        />
      </Box>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!pickupLocation || !dropLocation}
      >
        Search Rides
      </button>
    </Box>
  );
}

