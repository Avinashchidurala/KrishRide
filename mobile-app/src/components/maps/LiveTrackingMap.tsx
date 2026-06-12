import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { bookingsApi } from '../../services/bookingsApi';

const { width, height } = Dimensions.get('window');

interface LiveTrackingMapProps {
  bookingId: string;
  driverLocation?: { latitude: number; longitude: number };
  customerLocation?: { latitude: number; longitude: number };
  pickupLocation?: { latitude: number; longitude: number };
  dropLocation?: { latitude: number; longitude: number };
  routePolyline?: string;
  height?: number;
}

export default function LiveTrackingMap({
  bookingId,
  driverLocation: initialDriverLocation,
  customerLocation,
  pickupLocation,
  dropLocation,
  routePolyline,
  height = 400,
}: LiveTrackingMapProps) {
  const [driverLocation, setDriverLocation] = useState(initialDriverLocation);
  const [isConnected, setIsConnected] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<MapView>(null);

  // Calculate ETA and distance
  const calculateETAAndDistance = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ) => {
    // Simple distance calculation (in a real app, you'd use Google Distance Matrix API)
    const R = 6371; // Earth's radius in km
    const dLat = (to.latitude - from.latitude) * Math.PI / 180;
    const dLon = (to.longitude - from.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Estimate ETA (assuming average speed of 30 km/h in city)
    const etaMinutes = Math.round((distance / 30) * 60);

    setDistance(`${distance.toFixed(1)} km`);
    setEta(`${etaMinutes} mins`);
  };

  // Set up WebSocket connection for real-time tracking
  useEffect(() => {
    const initSocket = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        socketRef.current = io('ws://10.0.2.2:3000', {
          auth: { token },
          transports: ['websocket'],
        });

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          console.log('📡 Connected to live tracking');
          socketRef.current?.emit('join-booking', bookingId);
        });

        socketRef.current.on('disconnect', () => {
          setIsConnected(false);
          console.log('📡 Disconnected from live tracking');
        });

        socketRef.current.on('driver-location-update', (data: any) => {
          if (data.bookingId === bookingId && data.location) {
            const newLocation = {
              latitude: data.location.lat,
              longitude: data.location.lng,
            };
            setDriverLocation(newLocation);

            // Update ETA and distance
            if (customerLocation) {
              calculateETAAndDistance(newLocation, customerLocation);
            } else if (pickupLocation) {
              calculateETAAndDistance(newLocation, pickupLocation);
            }
          }
        });

        socketRef.current.on('booking-status-update', (data: any) => {
          if (data.bookingId === bookingId) {
            console.log('📋 Booking status update:', data.status);
          }
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [bookingId]);

  // Get auth token for socket authentication
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // This would typically get the token from AsyncStorage
      // For now, return null
      return null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  };

  // Calculate map region
  const getMapRegion = () => {
    const locations = [
      driverLocation,
      customerLocation,
      pickupLocation,
      dropLocation,
    ].filter(Boolean) as { latitude: number; longitude: number }[];

    if (locations.length === 0) {
      return {
        latitude: 20.5937, // Default to India center
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };
    }

    const lats = locations.map(loc => loc.latitude);
    const lngs = locations.map(loc => loc.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const longitudeDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  };

  // Parse route polyline (if available)
  const getRouteCoordinates = (): { latitude: number; longitude: number }[] => {
    if (!routePolyline) return [];

    try {
      // Decode Google Maps polyline (simplified version)
      // In a real app, you'd use a proper polyline decoder
      return [];
    } catch (error) {
      console.error('Failed to decode route polyline:', error);
      return [];
    }
  };

  const routeCoordinates = getRouteCoordinates();

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={getMapRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Driver Location */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver Location"
            description="Your driver is here"
          >
            <View style={styles.driverMarker}>
              <MaterialCommunityIcons name="car" size={24} color="#FF6B35" />
            </View>
          </Marker>
        )}

        {/* Customer Location */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Your Location"
            pinColor="blue"
          >
            <View style={styles.customerMarker}>
              <MaterialIcons name="person" size={20} color="#007AFF" />
            </View>
          </Marker>
        )}

        {/* Pickup Location */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            pinColor="green"
          >
            <View style={styles.pickupMarker}>
              <MaterialIcons name="radio-button-checked" size={20} color="#28A745" />
            </View>
          </Marker>
        )}

        {/* Drop Location */}
        {dropLocation && (
          <Marker
            coordinate={dropLocation}
            title="Drop Location"
            pinColor="red"
          >
            <View style={styles.dropMarker}>
              <MaterialIcons name="location-on" size={20} color="#DC3545" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FF6B35"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#28A745' : '#DC3545' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Live Tracking Active' : 'Connecting...'}
        </Text>
        {isConnected && (
          <ActivityIndicator size="small" color="#28A745" />
        )}
      </View>

      {/* ETA and Distance Info */}
      {(eta || distance) && (
        <View style={styles.infoContainer}>
          {eta && (
            <View style={styles.infoItem}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <Text style={styles.infoText}>{eta}</Text>
            </View>
          )}
          {distance && (
            <View style={styles.infoItem}>
              <MaterialIcons name="straighten" size={16} color="#666" />
              <Text style={styles.infoText}>{distance}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  driverMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  customerMarker: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  dropMarker: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
});
