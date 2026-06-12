/**
 * Route Preview Component
 * 
 * Displays a map with route polyline between start and end locations
 * using react-native-maps and Google Directions API
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getMapsConfig } from '../../config/maps';
import { StandardLocation } from '../utils/locationFormat';

interface RoutePreviewProps {
  startLocation: StandardLocation | null;
  endLocation: StandardLocation | null;
  height?: number;
  showMarkers?: boolean;
}

interface RouteData {
  polyline: string;
  distance: string;
  duration: string;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export default function RoutePreview({
  startLocation,
  endLocation,
  height = 300,
  showMarkers = true,
}: RoutePreviewProps) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsConfig, setMapsConfig] = useState<any>(null);

  // Load maps config once on mount
  useEffect(() => {
    const config = getMapsConfig();
    setMapsConfig(config);
  }, []);

  useEffect(() => {
    // Don't fetch if already loading or if config not ready
    if (loading || !mapsConfig) {
      return;
    }

    if (!startLocation || !endLocation) {
      setRoute(null);
      return;
    }

    // Validate coordinates
    if (
      !startLocation.lat || 
      !startLocation.lng || 
      !endLocation.lat || 
      !endLocation.lng ||
      startLocation.lat === 0 ||
      startLocation.lng === 0 ||
      endLocation.lat === 0 ||
      endLocation.lng === 0
    ) {
      setError('Invalid location coordinates');
      setRoute(null);
      return;
    }

    fetchRoute();
  }, [startLocation?.lat, startLocation?.lng, endLocation?.lat, endLocation?.lng, mapsConfig]);

  const fetchRoute = async () => {
    if (!startLocation || !endLocation || !mapsConfig) return;

    // Validate coordinates before making API call
    if (
      !startLocation.lat || 
      !startLocation.lng || 
      !endLocation.lat || 
      !endLocation.lng ||
      startLocation.lat === 0 ||
      startLocation.lng === 0 ||
      endLocation.lat === 0 ||
      endLocation.lng === 0
    ) {
      setError('Invalid location coordinates');
      setRoute(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const origin = `${startLocation.lat},${startLocation.lng}`;
      const destination = `${endLocation.lat},${endLocation.lng}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${mapsConfig.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const leg = routeData.legs[0];
        
        setRoute({
          polyline: routeData.overview_polyline.points,
          distance: leg.distance.text,
          duration: leg.duration.text,
          bounds: routeData.bounds,
        });
      } else {
        const errorMsg = data.error_message || `Could not calculate route (${data.status})`;
        setError(errorMsg);
        setRoute(null);
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      setError('Failed to load route. Please check your internet connection.');
      setRoute(null);
    } finally {
      setLoading(false);
    }
  };

  // Decode polyline points
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }

    return poly;
  };

  if (!startLocation || !endLocation) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select both locations to view route</Text>
        </View>
      </View>
    );
  }

  if (!mapsConfig) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Google Maps API key not configured</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      </View>
    );
  }

  if (error || !route) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{error || 'Could not load route'}</Text>
        </View>
      </View>
    );
  }

  const coordinates = decodePolyline(route.polyline);
  const centerLat = (route.bounds.northeast.lat + route.bounds.southwest.lat) / 2;
  const centerLng = (route.bounds.northeast.lng + route.bounds.southwest.lng) / 2;
  const latDelta = route.bounds.northeast.lat - route.bounds.southwest.lat;
  const lngDelta = route.bounds.northeast.lng - route.bounds.southwest.lng;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(latDelta * 1.3, 0.05),
          longitudeDelta: Math.max(lngDelta * 1.3, 0.05),
        }}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        {/* Route Polyline */}
        <Polyline
          coordinates={coordinates}
          strokeColor="#FF6B35"
          strokeWidth={4}
        />

        {/* Start Marker */}
        {showMarkers && (
          <Marker
            coordinate={{
              latitude: startLocation.lat,
              longitude: startLocation.lng,
            }}
            title="Start"
            pinColor="#4CAF50"
          />
        )}

        {/* End Marker */}
        {showMarkers && (
          <Marker
            coordinate={{
              latitude: endLocation.lat,
              longitude: endLocation.lng,
            }}
            title="End"
            pinColor="#F44336"
          />
        )}
      </MapView>

      {/* Route Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoText}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.infoTextContent}>{route.distance}</Text>
          <Text style={styles.infoSeparator}>•</Text>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.infoTextContent}>{route.duration}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginVertical: 10,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  infoTextContent: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  infoSeparator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
});

