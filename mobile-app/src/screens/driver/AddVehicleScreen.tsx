import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { driverApi } from '../../services/driverApi';

interface VehicleForm {
  vehicle_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: string;
  color: string;
  seating_capacity: string;
  registration_number: string;
  insurance_number: string;
  permit_number: string;
}

export default function AddVehicleScreen() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState<VehicleForm>({
    vehicle_number: '',
    vehicle_type: 'sedan',
    make: '',
    model: '',
    year: '',
    color: '',
    seating_capacity: '4',
    registration_number: '',
    insurance_number: '',
    permit_number: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});

  const vehicleTypes = [
    { label: 'Sedan', value: 'sedan', icon: 'car' },
    { label: 'SUV', value: 'suv', icon: 'car-sports' },
    { label: 'Hatchback', value: 'hatchback', icon: 'car-hatchback' },
    { label: 'SUV', value: 'suv', icon: 'car-estate' },
    { label: 'Bike', value: 'bike', icon: 'motorbike' },
    { label: 'Auto Rickshaw', value: 'auto', icon: 'taxi' },
  ];

  const seatingOptions = ['2', '4', '5', '6', '7', '8'];

  const validateForm = (): boolean => {
    const newErrors: Partial<VehicleForm> = {};

    if (!formData.vehicle_number.trim()) {
      newErrors.vehicle_number = 'Vehicle number is required';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else if (parseInt(formData.year) < 2000 || parseInt(formData.year) > new Date().getFullYear() + 1) {
      newErrors.year = 'Enter a valid year';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    }

    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registration number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    try {
      setLoading(true);

      const vehicleData = {
        ...formData,
        year: parseInt(formData.year),
        seating_capacity: parseInt(formData.seating_capacity),
      };

      await driverApi.addVehicle(vehicleData);

      Alert.alert(
        'Success',
        'Vehicle added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Add vehicle error:', error);
      Alert.alert('Error', error.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof VehicleForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Vehicle</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vehicle Type Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <View style={styles.vehicleTypeGrid}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.vehicleTypeButton,
                  formData.vehicle_type === type.value && styles.vehicleTypeButtonActive,
                ]}
                onPress={() => updateFormData('vehicle_type', type.value)}
              >
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={24}
                  color={formData.vehicle_type === type.value ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.vehicleTypeText,
                    formData.vehicle_type === type.value && styles.vehicleTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Number *</Text>
            <TextInput
              style={[styles.textInput, errors.vehicle_number && styles.inputError]}
              placeholder="e.g., KA01AB1234"
              value={formData.vehicle_number}
              onChangeText={(value) => updateFormData('vehicle_number', value.toUpperCase())}
              autoCapitalize="characters"
            />
            {errors.vehicle_number && (
              <Text style={styles.errorText}>{errors.vehicle_number}</Text>
            )}
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Make *</Text>
              <TextInput
                style={[styles.textInput, errors.make && styles.inputError]}
                placeholder="e.g., Toyota"
                value={formData.make}
                onChangeText={(value) => updateFormData('make', value)}
                autoCapitalize="words"
              />
              {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Model *</Text>
              <TextInput
                style={[styles.textInput, errors.model && styles.inputError]}
                placeholder="e.g., Camry"
                value={formData.model}
                onChangeText={(value) => updateFormData('model', value)}
                autoCapitalize="words"
              />
              {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Year *</Text>
              <TextInput
                style={[styles.textInput, errors.year && styles.inputError]}
                placeholder="e.g., 2020"
                value={formData.year}
                onChangeText={(value) => updateFormData('year', value.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={4}
              />
              {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Color *</Text>
              <TextInput
                style={[styles.textInput, errors.color && styles.inputError]}
                placeholder="e.g., White"
                value={formData.color}
                onChangeText={(value) => updateFormData('color', value)}
                autoCapitalize="words"
              />
              {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Seating Capacity</Text>
            <View style={styles.seatingContainer}>
              {seatingOptions.map((capacity) => (
                <TouchableOpacity
                  key={capacity}
                  style={[
                    styles.seatingButton,
                    formData.seating_capacity === capacity && styles.seatingButtonActive,
                  ]}
                  onPress={() => updateFormData('seating_capacity', capacity)}
                >
                  <Text
                    style={[
                      styles.seatingText,
                      formData.seating_capacity === capacity && styles.seatingTextActive,
                    ]}
                  >
                    {capacity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Registration Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Registration Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Registration Number *</Text>
            <TextInput
              style={[styles.textInput, errors.registration_number && styles.inputError]}
              placeholder="e.g., KA01AB1234"
              value={formData.registration_number}
              onChangeText={(value) => updateFormData('registration_number', value.toUpperCase())}
              autoCapitalize="characters"
            />
            {errors.registration_number && (
              <Text style={styles.errorText}>{errors.registration_number}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Insurance Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter insurance policy number"
              value={formData.insurance_number}
              onChangeText={(value) => updateFormData('insurance_number', value)}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Permit Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter permit number"
              value={formData.permit_number}
              onChangeText={(value) => updateFormData('permit_number', value)}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="car-plus" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Add Vehicle</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleTypeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  vehicleTypeTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC3545',
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
  },
  seatingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seatingButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  seatingButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  seatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  seatingTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
