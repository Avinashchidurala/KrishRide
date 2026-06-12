import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { driverApi } from '../../services/driverApi';
// import { useNavigation } from 'expo-router';
import { useNavigation } from '@react-navigation/native';


export default function VehiclesScreen() {
    const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const profile = await driverApi.getProfile();
      setVehicles(profile.driver?.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVehicle = ({ item }: { item: any }) => (
    <View style={styles.vehicleCard}>
      <Text style={styles.vehicleName}>
        {item.vehicle_make} {item.vehicle_model}
      </Text>
      <Text style={styles.vehicleDetails}>
        {item.vehicle_color} • {item.vehicle_plate_number}
      </Text>
      <View style={styles.vehicleActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => Alert.alert('Delete', 'Are you sure?')}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <TouchableOpacity style={styles.addButton} onPress={()=>navigation.navigate('')}>
          <Text style={styles.addButtonText}>+ Add Vehicle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No vehicles added yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FF6B35', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8 },
  addButtonText: { color: '#FF6B35', fontSize: 14, fontWeight: '600' },
  listContent: { padding: 15 },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15 },
  vehicleName: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  vehicleDetails: { fontSize: 14, color: '#666', marginBottom: 15 },
  vehicleActions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, alignItems: 'center' },
  actionText: { fontSize: 14, color: '#333', fontWeight: '600' },
  deleteButton: { backgroundColor: '#F44336' },
  deleteText: { color: '#fff' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 50, fontSize: 14 },
});

