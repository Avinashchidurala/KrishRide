import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Chip, Card, CardContent, Grid } from '@mui/material';
import MapComponent from './MapComponent';
import { LocationOn as LocationIcon, DirectionsCar as CarIcon, AccessTime as TimeIcon, Straighten as DistanceIcon } from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import { VITE_API_BASE_URL } from '../../utils/env';

interface LiveTrackingMapProps {
  bookingId: string;
  driverLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  pickupLocation?: { lat: number; lng: number };
  dropLocation?: { lat: number; lng: number };
  routePolyline?: string;
  height?: string;
}

export default function LiveTrackingMap({
  bookingId,
  driverLocation: initialDriverLocation,
  customerLocation,
  pickupLocation,
  dropLocation,
  routePolyline,
  height = '500px',
}: LiveTrackingMapProps) {
  const [driverLocation, setDriverLocation] = useState(initialDriverLocation);
  const [isConnected, setIsConnected] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [route, setRoute] = useState<{ origin: { lat: number; lng: number }; destination: { lat: number; lng: number } } | null>(null);

  // Calculate ETA and distance when driver location updates
  useEffect(() => {
    if (driverLocation && customerLocation) {
      calculateETAAndDistance(driverLocation, customerLocation);
    } else if (driverLocation && pickupLocation) {
      calculateETAAndDistance(driverLocation, pickupLocation);
    }
  }, [driverLocation, customerLocation, pickupLocation]);

  // Set up route for map display
  useEffect(() => {
    if (pickupLocation && dropLocation) {
      setRoute({
        origin: pickupLocation,
        destination: dropLocation,
      });
    } else if (driverLocation && customerLocation) {
      setRoute({
        origin: driverLocation,
        destination: customerLocation,
      });
    }
  }, [driverLocation, customerLocation, pickupLocation, dropLocation]);

  const calculateETAAndDistance = async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            const leg = result.routes[0].legs[0];
            setDistance(leg.distance.text);
            setEta(leg.duration.text);
          }
        }
      );
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) return;

    // Connect to WebSocket
    const newSocket: Socket = io(VITE_API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join booking room
      newSocket.emit('booking:join', bookingId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for location updates
    newSocket.on('location:update', (data: { lat: number; lng: number; bookingId: string }) => {
      if (data.bookingId === bookingId) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    // Listen for ride status updates
    newSocket.on('ride:status', (data: { bookingId: string; status: string }) => {
      if (data.bookingId === bookingId) {
        console.log('Ride status updated:', data.status);
      }
    });

    return () => {
      newSocket.emit('booking:leave', bookingId);
      newSocket.disconnect();
    };
  }, [bookingId]);

  const center = driverLocation || customerLocation || pickupLocation || { lat: 17.3850, lng: 78.4867 };

  const markers = [
    ...(pickupLocation
      ? [
          {
            lat: pickupLocation.lat,
            lng: pickupLocation.lng,
            label: 'P',
            icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          },
        ]
      : []),
    ...(dropLocation
      ? [
          {
            lat: dropLocation.lat,
            lng: dropLocation.lng,
            label: 'D',
            icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
        ]
      : []),
    ...(driverLocation
      ? [
          {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            label: '🚗',
            icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          },
        ]
      : []),
    ...(customerLocation
      ? [
          {
            lat: customerLocation.lat,
            lng: customerLocation.lng,
            label: 'C',
            icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Live Tracking
        </Typography>
        <Chip
          label={isConnected ? 'Connected' : 'Connecting...'}
          color={isConnected ? 'success' : 'warning'}
          size="small"
        />
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} style={{ height }}>
        <MapComponent
          center={center}
          zoom={15}
          markers={markers}
          route={route || undefined}
          showCurrentLocation={!!customerLocation}
          trackingRadius={500}
        />
      </Paper>

      {/* ETA and Distance Info */}
      {(eta || distance) && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              {eta && (
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TimeIcon sx={{ color: '#FF6B35' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Estimated Time
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {eta}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {distance && (
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DistanceIcon sx={{ color: '#FF6B35' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Distance
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {distance}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {driverLocation && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CarIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Driver Location
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
              </Typography>
            </Box>
          </Box>
        )}
        {customerLocation && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocationIcon sx={{ color: 'success.main' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Your Location
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

