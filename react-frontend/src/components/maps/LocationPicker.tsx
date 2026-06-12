import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { TextField, Box, Paper, CircularProgress, Button } from '@mui/material';
import { LocationOn as LocationIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { getMapsConfig } from '../../config/maps';
import GoogleMapsLoader from './GoogleMapsLoader';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

const getMapContainerStyle = (height: string = '400px') => ({
  width: '100%',
  height: height,
});

const defaultCenter = {
  lat: 17.3850, // Hyderabad
  lng: 78.4867,
};

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (address: string, location: { lat: number; lng: number }) => void;
  required?: boolean;
  showMap?: boolean; // If false, only shows autosuggest field without map interaction
  mapHeight?: string; // Custom map height (default: '400px')
  showCurrentLocationButton?: boolean; // Show button to use current location
}

export default function LocationPicker({
  label,
  value,
  onChange,
  required = false,
  showMap = true, // Default to true for backward compatibility
  mapHeight = '400px',
  showCurrentLocationButton = false,
}: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isMapsReady, setIsMapsReady] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Check if Google Maps is ready
  useEffect(() => {
    const checkMapsReady = () => {
      if (typeof window !== 'undefined' && 
          window.google && 
          window.google.maps && 
          window.google.maps.places &&
          window.google.maps.Geocoder) {
        setIsMapsReady(true);
        return true;
      }
      return false;
    };

    if (checkMapsReady()) {
      return;
    }

    // Poll for Google Maps to be ready
    const interval = setInterval(() => {
      if (checkMapsReady()) {
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Geocode value when it changes (if we have coordinates, skip)
  useEffect(() => {
    if (value && !location && isMapsReady) {
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: value }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
            const loc = results[0].geometry.location;
            const newLocation = { lat: loc.lat(), lng: loc.lng() };
            setLocation(newLocation);
            setMapCenter(newLocation);
          }
        });
      }
    }
  }, [value, location, isMapsReady]);

  const handleLocationChange = useCallback((address: string, loc?: { lat: number; lng: number }) => {
    if (loc) {
      setLocation(loc);
      setMapCenter(loc);
    }
    onChange(address, loc || location || defaultCenter);
  }, [location, onChange]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setLocation(newLocation);
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: newLocation }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          onChange(results[0].formatted_address, newLocation);
        }
      });
    }
  }, [onChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        setMapCenter(newLocation);
        
        // Reverse geocode to get address
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: newLocation }, (results, status) => {
            setIsGettingCurrentLocation(false);
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              onChange(results[0].formatted_address, newLocation);
            } else {
              onChange('Current Location', newLocation);
            }
          });
        } else {
          setIsGettingCurrentLocation(false);
          onChange('Current Location', newLocation);
        }
      },
      (error) => {
        setIsGettingCurrentLocation(false);
        alert('Unable to get your current location. Please enable location permissions.');
        console.error('Error getting current location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  const mapsConfig = getMapsConfig();

  if (!mapsConfig) {
    return (
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value, location || defaultCenter)}
        fullWidth
        required={required}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
      />
    );
  }

  return (
    <Box>
      <GoogleMapsLoader>
        <GooglePlacesAutocomplete
          label={label}
          value={value}
          onChange={handleLocationChange}
          fullWidth
          required={required}
          InputProps={{
            startAdornment: <LocationIcon sx={{ color: 'text.secondary', mr: 2 }} />,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />

        {showMap && isMapsReady && (
          <Box sx={{ mt: 2 }}>
            {showCurrentLocationButton && (
              <Button
                variant="outlined"
                startIcon={isGettingCurrentLocation ? <CircularProgress size={16} /> : <MyLocationIcon />}
                onClick={handleUseCurrentLocation}
                disabled={isGettingCurrentLocation}
                sx={{
                  mb: 2,
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                {isGettingCurrentLocation ? 'Getting Location...' : 'Use Current Location'}
              </Button>
            )}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <GoogleMap
                mapContainerStyle={getMapContainerStyle(mapHeight)}
                center={mapCenter}
                zoom={location ? 15 : 13}
                onClick={onMapClick}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                }}
              >
              {location && (
                <Marker
                  position={location}
                  draggable
                  onDragEnd={(e) => {
                    if (e.latLng && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
                      const newLocation = {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng(),
                      };
                      setLocation(newLocation);
                      
                      // Reverse geocode
                      const geocoder = new window.google.maps.Geocoder();
                      geocoder.geocode({ location: newLocation }, (results, status) => {
                        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                          onChange(results[0].formatted_address, newLocation);
                        }
                      });
                    }
                  }}
                />
              )}
            </GoogleMap>
            </Paper>
          </Box>
        )}
      </GoogleMapsLoader>
    </Box>
  );
}

