import { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import MapComponent from './MapComponent';
import { LocationOn as LocationIcon } from '@mui/icons-material';

interface RouteMapProps {
  startLocation: string;
  endLocation: string;
  startCoords?: { lat: number; lng: number };
  endCoords?: { lat: number; lng: number };
  height?: string;
  showMarkers?: boolean;
}

export default function RouteMap({
  startLocation,
  endLocation,
  startCoords,
  endCoords,
  height = '500px',
  showMarkers = true,
}: RouteMapProps) {
  const [route, setRoute] = useState<{
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapsReady, setIsMapsReady] = useState(false);

  // Check if Google Maps is ready
  useEffect(() => {
    const checkMapsReady = () => {
      if (typeof window !== 'undefined' && 
          window.google && 
          window.google.maps && 
          window.google.maps.Geocoder &&
          window.google.maps.DirectionsService) {
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
      if (!isMapsReady) {
        console.warn('⚠️ Google Maps API not ready for RouteMap');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isMapsReady]);

  // Geocode addresses or use provided coordinates
  const geocodeLocations = useCallback(async () => {
    if (!isMapsReady) {
      return;
    }

    // If coordinates are provided, use them directly
    if (startCoords && endCoords) {
      setRoute({
        origin: startCoords,
        destination: endCoords,
      });
      setError(null);
      return;
    }

    // If coordinates are not provided, geocode addresses
    if (!startLocation || !endLocation) {
      setRoute(null);
      return;
    }

    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Geocoder) {
      setError('Google Maps API is not loaded');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const geocoder = new window.google.maps.Geocoder();
      
      const [originResult, destinationResult] = await Promise.all([
        new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          geocoder.geocode({ address: startLocation }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              const loc = results[0].geometry.location;
              resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
              reject(new Error(`Failed to geocode start location: ${status}`));
            }
          });
        }),
        new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          geocoder.geocode({ address: endLocation }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              const loc = results[0].geometry.location;
              resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
              reject(new Error(`Failed to geocode end location: ${status}`));
            }
          });
        }),
      ]);

      setRoute({ origin: originResult, destination: destinationResult });
      setError(null);
    } catch (err: any) {
      console.error('Geocoding error:', err);
      const errorMessage = err.message || 'Failed to geocode locations';
      setError(errorMessage);
      setRoute(null);
      // Log for debugging
      console.log('RouteMap geocoding failed:', {
        startLocation,
        endLocation,
        startCoords,
        endCoords,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [startLocation, endLocation, startCoords, endCoords, isMapsReady]);

  // Geocode when locations or maps ready state changes
  useEffect(() => {
    if (isMapsReady) {
      geocodeLocations();
    }
  }, [isMapsReady, geocodeLocations]);

  // Debug logging
  useEffect(() => {
    console.log('RouteMap state:', {
      startLocation,
      endLocation,
      startCoords,
      endCoords,
      route,
      loading,
      error,
      isMapsReady,
    });
  }, [startLocation, endLocation, startCoords, endCoords, route, loading, error, isMapsReady]);

  const center = route
    ? {
        lat: (route.origin.lat + route.destination.lat) / 2,
        lng: (route.origin.lng + route.destination.lng) / 2,
      }
    : undefined;

  const markers = showMarkers && route
    ? [
        { lat: route.origin.lat, lng: route.origin.lng, label: 'A' },
        { lat: route.destination.lat, lng: route.destination.lng, label: 'B' },
      ]
    : [];

  // Show helpful message if no data available
  const hasLocationData = startLocation || endLocation || startCoords || endCoords;
  
  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
          {error.includes('geocode') && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Tip: Ensure Google Maps Geocoding API is enabled in your Google Cloud Console
            </Typography>
          )}
        </Alert>
      )}
      
      {!hasLocationData && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Location data is not available for this booking. Please contact support if this persists.
        </Alert>
      )}
      
      <Paper 
        style={{ height }}
        sx={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading route...
            </Typography>
          </Box>
        )}
        
        {route && !loading && (
          <MapComponent
            center={center}
            zoom={12}
            markers={markers}
            route={route}
          />
        )}
        
        {!route && !loading && !error && (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {startLocation && endLocation 
                ? 'Calculating route...' 
                : 'Location data not available'}
            </Typography>
            {(!startLocation || !endLocation) && (
              <Typography variant="caption" color="text.secondary">
                Please ensure both pickup and drop locations are available
              </Typography>
            )}
          </Box>
        )}
      </Paper>
      
      {(startLocation || endLocation) && (
        <Box sx={{ mt: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {startLocation && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1, minWidth: '200px' }}>
              <LocationIcon sx={{ color: '#FF6B35', mt: 0.5 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Pickup
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {startLocation}
                </Typography>
              </Box>
            </Box>
          )}
          {endLocation && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1, minWidth: '200px' }}>
              <LocationIcon sx={{ color: 'error.main', mt: 0.5 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Drop
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {endLocation}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
