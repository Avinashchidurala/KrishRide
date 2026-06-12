import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, Circle } from '@react-google-maps/api';
import { Box, Typography } from '@mui/material';
import { getMapsConfig } from '../../config/maps';
import GoogleMapsLoader from './GoogleMapsLoader';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 17.3850, // Hyderabad
  lng: 78.4867,
};

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; label?: string; icon?: string }>;
  route?: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };
  showCurrentLocation?: boolean;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  trackingRadius?: number; // in meters
}

export default function MapComponent({
  center = defaultCenter,
  zoom = 13,
  markers = [],
  route,
  showCurrentLocation = false,
  onLocationChange,
  trackingRadius,
}: MapComponentProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (showCurrentLocation && navigator.geolocation) {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (onLocationChange) {
            onLocationChange(location);
          }
          if (mapRef.current) {
            mapRef.current.setCenter(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );

      // Watch location changes
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (onLocationChange) {
            onLocationChange(location);
          }
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [showCurrentLocation, onLocationChange]);

  // Calculate route when both route and map are ready
  useEffect(() => {
    if (route && isMapLoaded && directionsServiceRef.current) {
      directionsServiceRef.current.route(
        {
          origin: route.origin,
          destination: route.destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);
            }
          } else {
            console.error('Directions request failed:', status);
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [route, isMapLoaded]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
    });
    setIsMapLoaded(true);
    
    // If route is already set, calculate it now
    if (route && directionsServiceRef.current) {
      directionsServiceRef.current.route(
        {
          origin: route.origin,
          destination: route.destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);
            }
          } else {
            console.error('Directions request failed:', status);
            setDirections(null);
          }
        }
      );
    }
  };

  const onUnmount = () => {
    mapRef.current = null;
    directionsServiceRef.current = null;
    directionsRendererRef.current = null;
  };

  const mapsConfig = getMapsConfig();

  if (!mapsConfig) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
        <Typography sx={{ color: 'text.secondary' }}>Google Maps API key not configured</Typography>
      </Box>
    );
  }

  return (
    <GoogleMapsLoader>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* Route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#FF6B35',
                strokeWeight: 5,
              },
              suppressMarkers: false,
            }}
          />
        )}

        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={marker.label}
            icon={marker.icon ? { url: marker.icon } : undefined}
          />
        ))}

        {/* Tracking radius circle */}
        {showCurrentLocation && trackingRadius && center && (
          <Circle
            center={center}
            radius={trackingRadius}
            options={{
              fillColor: '#FF6B35',
              fillOpacity: 0.1,
              strokeColor: '#FF6B35',
              strokeOpacity: 0.5,
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </GoogleMapsLoader>
  );
}

