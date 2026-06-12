import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getMapsConfig } from '../config/maps';
import { StandardLocation } from '../utils/locationFormat';

interface Route {
  id: string;
  distance: string;
  duration: string;
  distanceKm: number;
  durationMins: number;
  polyline: string;
  waypoints: string[];
}

interface RouteSelectionProps {
  startLocation: StandardLocation;
  endLocation: StandardLocation;
  onRouteSelect: (route: Route) => void;
  perKmRate: number;
  isSurge: boolean;
  surgeMultiplier: number;
}

export default function RouteSelection({
  startLocation,
  endLocation,
  onRouteSelect,
  perKmRate,
  isSurge,
  surgeMultiplier,
}: RouteSelectionProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [suggestedCities, setSuggestedCities] = useState<string[]>([]);
  const [addedStops, setAddedStops] = useState<string[]>([]);
  const mapsConfig = getMapsConfig();

  useEffect(() => {
    if (startLocation && endLocation && mapsConfig) {
      fetchRoutes();
    }
  }, [startLocation, endLocation]);

  const fetchRoutes = async () => {
    if (!mapsConfig) return;
    
    try {
      setLoading(true);
      const origin = `${startLocation.lat},${startLocation.lng}`;
      const destination = `${endLocation.lat},${endLocation.lng}`;
      
      // Fetch multiple route alternatives
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&alternatives=true&key=${mapsConfig.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes) {
        const parsedRoutes = data.routes.map((route: any, index: number) => {
          const leg = route.legs[0];
          return {
            id: `route-${index + 1}`,
            distance: leg.distance.text,
            duration: leg.duration.text,
            distanceKm: leg.distance.value / 1000,
            durationMins: Math.round(leg.duration.value / 60),
            polyline: route.overview_polyline.points,
            waypoints: route.legs[0].steps.map((step: any) => step.end_location),
          };
        });
        
        setRoutes(parsedRoutes);
        
        // Extract cities along the route for suggestions
        extractCitiesAlongRoute(parsedRoutes[0]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractCitiesAlongRoute = async (route: Route) => {
  if (!mapsConfig) return;
  
  try {
    const cities: string[] = [];
    const seenCities = new Set<string>();
    
    // Sample every 10th waypoint to avoid too many API calls
    const sampledWaypoints = route.waypoints.filter((_, index) => index % 10 === 0);
    
    for (const waypoint of sampledWaypoints) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${waypoint.lat},${waypoint.lng}&key=${mapsConfig.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          // Find locality (city) from address components
          for (const result of data.results) {
            const cityComponent = result.address_components.find((comp: any) => 
              comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
            );
            
            if (cityComponent && !seenCities.has(cityComponent.long_name)) {
              cities.push(cityComponent.long_name);
              seenCities.add(cityComponent.long_name);
              break;
            }
          }
        }
        
        // Limit to 10 cities max
        if (cities.length >= 10) break;
        
      } catch (error) {
        console.error('Error getting city for waypoint:', error);
      }
    }
    
    setSuggestedCities(cities);
  } catch (error) {
    console.error('Error extracting cities along route:', error);
    setSuggestedCities([]);
  }
};

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    onRouteSelect(route);
  };

  const handleAddStop = () => {
    if (cityInput.trim()) {
      setAddedStops([...addedStops, cityInput.trim()]);
      setCityInput('');
      // Recalculate route with waypoints
    }
  };

  const handleAddSuggestedCity = (city: string) => {
    setAddedStops([...addedStops, city]);
    setSuggestedCities(suggestedCities.filter(c => c !== city));
  };

  const calculateTotalFare = (distanceKm: number) => {
    const rate = isSurge ? perKmRate * surgeMultiplier : perKmRate;
    return (distanceKm * rate).toFixed(2);
  };
  // Add this function inside the component, before the return statement
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Finding best routes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Select Route</Text>
    
    {/* MAP PREVIEW - Shows selected route */}
    {selectedRoute && (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (startLocation.lat + endLocation.lat) / 2,
            longitude: (startLocation.lng + endLocation.lng) / 2,
            latitudeDelta: Math.abs(startLocation.lat - endLocation.lat) * 1.5,
            longitudeDelta: Math.abs(startLocation.lng - endLocation.lng) * 1.5,
          }}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          {/* Route Polyline */}
          <Polyline
            coordinates={decodePolyline(selectedRoute.polyline)}
            strokeColor="#FF6B35"
            strokeWidth={4}
          />
          
          {/* Start Marker */}
          <Marker
            coordinate={{
              latitude: startLocation.lat,
              longitude: startLocation.lng,
            }}
            title="Start"
            pinColor="#4CAF50"
          />
          
          {/* End Marker */}
          <Marker
            coordinate={{
              latitude: endLocation.lat,
              longitude: endLocation.lng,
            }}
            title="End"
            pinColor="#F44336"
          />
        </MapView>
      </View>
    )}
      
      {/* Route Options */}
      {routes.map((route, index) => (
        <TouchableOpacity
          key={route.id}
          style={[
            styles.routeCard,
            selectedRoute?.id === route.id && styles.routeCardSelected,
          ]}
          onPress={() => handleSelectRoute(route)}
        >
          <View style={styles.routeHeader}>
            <Text style={styles.routeName}>Route {index + 1}</Text>
            <MaterialIcons
              name={selectedRoute?.id === route.id ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={selectedRoute?.id === route.id ? '#FF6B35' : '#999'}
            />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeDistance}>{route.distance}</Text>
            <Text style={styles.routeDuration}>{route.durationMins} mins</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Route Information */}
      {selectedRoute && (
        <View style={styles.routeInfo}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{selectedRoute.distance}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{selectedRoute.durationMins} mins</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Rate per km {isSurge && `(Surge ${surgeMultiplier}x)`}
            </Text>
            <Text style={styles.infoValue}>
              ₹{isSurge ? (perKmRate * surgeMultiplier).toFixed(2) : perKmRate}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Fare</Text>
            <Text style={styles.infoValueBold}>
              ₹{calculateTotalFare(selectedRoute.distanceKm)}
            </Text>
          </View>
        </View>
      )}

      {/* Add Stops */}
      {selectedRoute && (
        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Add Stops</Text>
          
          <View style={styles.addStopInput}>
            <TextInput
              style={styles.cityInput}
              placeholder="Enter city"
              value={cityInput}
              onChangeText={setCityInput}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddStop}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Added Stops */}
          {addedStops.length > 0 && (
            <View style={styles.addedStops}>
              {addedStops.map((stop, index) => (
                <View key={index} style={styles.stopChip}>
                  <Text style={styles.stopText}>{stop}</Text>
                  <TouchableOpacity
                    onPress={() => setAddedStops(addedStops.filter((_, i) => i !== index))}
                  >
                    <MaterialIcons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Suggested Cities */}
          <Text style={styles.suggestedTitle}>Suggested Cities on Selected Route</Text>
          <View style={styles.suggestedCities}>
            {suggestedCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.suggestedCity}
                onPress={() => handleAddSuggestedCity(city)}
              >
                <MaterialIcons name="add" size={16} color="#FF6B35" />
                <Text style={styles.suggestedCityText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  routeCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F5',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  routeDistance: {
    fontSize: 14,
    color: '#666',
  },
  routeDuration: {
    fontSize: 14,
    color: '#666',
  },
  routeInfo: {
    backgroundColor: '#F8F9FA',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  stopsSection: {
    padding: 16,
  },
  addStopInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addedStops: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  stopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  stopText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestedCities: {
    gap: 8,
  },
  suggestedCity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  suggestedCityText: {
    fontSize: 14,
    color: '#333',
  },
});