import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Platform,
 } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDateTimePicker } from '../../hooks/useDateTimePicker';
import { ridesApi } from '../../services/ridesApi';
import { driverApi } from '../../services/driverApi';
import LocationSearchModal from '../../components/LocationSearchModal';

import { StandardLocation } from '../../utils/locationFormat';
import RouteSelection from '../../components/RouteSelection';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function PublishRideScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [formData, setFormData] = useState({
    vehicleId: '',
    startLocation: '',
    endLocation: '',
    scheduledDate: '',
    scheduledTime: '',
    seatsAvailable: '4',
    perKmRate: '7',
    isSurge: false,
    routePolyline: '',        
    routeDistanceKm: 0,       
    routeDurationMin: 0,      
    routeBufferKm: 30,   
  });
  const {
    selectedDate,
    selectedTime,
    datePickerVisible: showDatePicker,
    timePickerVisible: showTimePicker,
    showDatePicker: showDatePickerModal,
    showTimePicker: showTimePickerModal,
    hideDatePicker,
    hideTimePicker,
  } = useDateTimePicker();
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickupLocation, setPickupLocation] = useState<StandardLocation | null>(null);
  const [dropLocation, setDropLocation] = useState<StandardLocation | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'pickup' | 'drop'>('pickup');

  useEffect(() => {
    loadKYCStatus();
    loadVehicles();
  }, []);

  const loadKYCStatus = async () => {
    try {
      setKycLoading(true);
      const kycData = await driverApi.getKYCStatus();
      setKycStatus(kycData.kycStatus || 'pending');
    } catch (error) {
      console.error('Error loading KYC status:', error);
      setKycStatus('pending');
    } finally {
      setKycLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const profile = await driverApi.getProfile();
      setVehicles(profile.driver?.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };


  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      hideDatePicker();
      return;
    }

    if (selectedDate) {
      hideDatePicker();
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, scheduledDate: formattedDate }));
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === 'dismissed') {
      hideTimePicker();
      return;
    }

    if (selectedTime) {
      hideTimePicker();
      const formattedTime = selectedTime.toTimeString().slice(0, 5);
      setFormData(prev => ({ ...prev, scheduledTime: formattedTime }));
    }
  };


  const handleSubmit = async () => {
    const startLocationLabel = pickupLocation?.label || formData.startLocation;
    const endLocationLabel = dropLocation?.label || formData.endLocation;
    
    if (!formData.vehicleId || !startLocationLabel || !endLocationLabel) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
     if (!formData.routePolyline) {
    Alert.alert('Error', 'Please select a route');
    return;
  }

    try {
      setLoading(true);
      // Calculate pricePerSeat from perKmRate (assuming average distance, or could be calculated)
      // For now, using a simple formula or default value
      const pricePerSeat = parseFloat(formData.perKmRate) * 50; // Example: ₹50 per seat for avg distance
      
      await ridesApi.publishRide({
        vehicleId: formData.vehicleId,
        pickupLocation: startLocationLabel,
        pickupLatitude: pickupLocation?.lat || 0,
        pickupLongitude: pickupLocation?.lng || 0,
        dropLocation: endLocationLabel,
        dropLatitude: dropLocation?.lat || 0,
        dropLongitude: dropLocation?.lng || 0,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        seatsAvailable: parseInt(formData.seatsAvailable),
        pricePerSeat,
        perKmRate: parseFloat(formData.perKmRate),
        isSurge: formData.isSurge,
        routePolyline: formData.routePolyline,          
        routeDistanceKm: formData.routeDistanceKm,      
        routeDurationMin: formData.routeDurationMin,    
        routeBufferKm: formData.routeBufferKm,  
      });
      Alert.alert('Success', 'Ride published successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to publish ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Publish a Ride</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle *</Text>
          <View style={styles.vehicleList}>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  formData.vehicleId === vehicle.id && styles.vehicleOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, vehicleId: vehicle.id })}
              >
                <Text
                  style={[
                    styles.vehicleText,
                    formData.vehicleId === vehicle.id && styles.vehicleTextActive,
                  ]}
                >
                  {vehicle.vehicle_make} {vehicle.vehicle_model}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Location *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setLocationModalType('pickup');
              setLocationModalVisible(true);
            }}
          >
            <Text style={pickupLocation?.label ? styles.inputText : styles.inputPlaceholder}>
              {pickupLocation?.label || 'Enter pickup location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Drop Location *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setLocationModalType('drop');
              setLocationModalVisible(true);
            }}
          >
            <Text style={dropLocation?.label ? styles.inputText : styles.inputPlaceholder}>
              {dropLocation?.label || 'Enter drop location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={showDatePickerModal}
          >
            <Text style={formData.scheduledDate ? styles.inputText : styles.inputPlaceholder}>
              {formData.scheduledDate || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={showTimePickerModal}
          >
            <Text style={formData.scheduledTime ? styles.inputText : styles.inputPlaceholder}>
              {formData.scheduledTime || 'Select time'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seats Available *</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={formData.seatsAvailable}
            onChangeText={(text) => setFormData({ ...formData, seatsAvailable: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rate per km (₹) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={formData.perKmRate}
            onChangeText={(text) => setFormData({ ...formData, perKmRate: text })}
          />
        </View>

        {/* Route Preview */}
        {pickupLocation && dropLocation && pickupLocation.lat && pickupLocation.lng && dropLocation.lat && dropLocation.lng && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Route</Text>
    {/* Route Selection Component - Shows routes, cities, stops */}
    <RouteSelection
      startLocation={pickupLocation}
      endLocation={dropLocation}
      onRouteSelect={(route) => {
        console.log('Selected route:', route);
        // Save route data to formData
        setFormData(prev => ({
          ...prev,
          routePolyline: route.polyline,
          routeDistanceKm: route.distanceKm,
          routeDurationMin: route.durationMins,
          stops: stops, 
        }));
      }}
      perKmRate={parseFloat(formData.perKmRate) || 7}
      isSurge={formData.isSurge}
      surgeMultiplier={1.25}
      />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Publish Ride</Text>
          )}
        </TouchableOpacity>
      </View>

      <LocationSearchModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelect={(location) => {
          if (locationModalType === 'pickup') {
            setPickupLocation(location);
            setFormData({ ...formData, startLocation: location.label });
          } else {
            setDropLocation(location);
            setFormData({ ...formData, endLocation: location.label });
          }
        }}
        placeholder={locationModalType === 'pickup' ? 'Search pickup location' : 'Search drop location'}
      />


      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
          is24Hour={true}
        />
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  verifyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 15, fontSize: 16, justifyContent: 'center', minHeight: 48 },
  inputText: { fontSize: 16, color: '#333' },
  inputPlaceholder: { fontSize: 16, color: '#999' },
  vehicleList: { gap: 10 },
  vehicleOption: { backgroundColor: '#fff', borderRadius: 8, padding: 15, borderWidth: 2, borderColor: '#ddd' },
  vehicleOptionActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B35' },
  vehicleText: { fontSize: 16, color: '#666' },
  vehicleTextActive: { color: '#fff', fontWeight: '600' },
  submitButton: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },

});

