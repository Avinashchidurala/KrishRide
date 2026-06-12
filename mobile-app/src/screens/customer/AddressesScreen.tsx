import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addressesApi, Address } from '../../services/addressesApi';
import LocationSearchModal from '../../components/LocationSearchModal';

export default function AddressesScreen() {
  const navigation = useNavigation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressesApi.getUserAddresses();
      setAddresses(data);
    } catch (error: any) {
      console.error('Load addresses error:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setLocationModalVisible(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setLocationModalVisible(true);
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete your ${address.label} address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAddress(address.id),
        },
      ]
    );
  };

  const deleteAddress = async (addressId: string) => {
    try {
      await addressesApi.deleteAddress(addressId);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      Alert.alert('Success', 'Address deleted successfully');
    } catch (error: any) {
      console.error('Delete address error:', error);
      Alert.alert('Error', 'Failed to delete address');
    }
  };

  const handleLocationSelect = async (location: any) => {
    setLocationModalVisible(false);

    try {
      setSaving(true);

      if (editingAddress) {
        // Update existing address
        const updatedAddress = await addressesApi.updateAddress(editingAddress.id, {
          displayName: location.label,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        setAddresses(prev =>
          prev.map(addr =>
            addr.id === editingAddress.id ? updatedAddress : addr
          )
        );
        Alert.alert('Success', 'Address updated successfully');
      } else {
        // Add new address
        const newAddress = await addressesApi.addAddress({
          label: location.type || 'other',
          displayName: location.label,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        setAddresses(prev => [...prev, newAddress]);
        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error: any) {
      console.error('Save address error:', error);
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setSaving(false);
      setEditingAddress(null);
    }
  };

  const getAddressTypeIcon = (label: string) => {
    switch (label) {
      case 'home':
        return 'home';
      case 'work':
        return 'business';
      default:
        return 'place';
    }
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressTypeContainer}>
          <MaterialCommunityIcons
            name={getAddressTypeIcon(item.label) as any}
            size={20}
            color="#FF6B35"
          />
          <Text style={styles.addressType}>
            {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
          </Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>

        <View style={styles.addressActions}>
          <TouchableOpacity
            onPress={() => handleEditAddress(item)}
            style={styles.actionButton}
          >
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteAddress(item)}
            style={styles.actionButton}
          >
            <MaterialIcons name="delete" size={20} color="#DC3545" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.addressText} numberOfLines={2}>
        {item.displayName}
      </Text>

      <Text style={styles.coordinatesText}>
        {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          onPress={handleAddAddress}
          style={styles.addButton}
          disabled={saving}
        >
          <MaterialIcons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <MaterialIcons name="info" size={20} color="#666" />
        <Text style={styles.infoText}>
          You can save up to 3 addresses (Home, Work, Other) for quick access during booking.
        </Text>
      </View>

      {/* Addresses List */}
      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="map-marker-off" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySubtitle}>
              Add your frequently used addresses for quick booking
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddAddress}
              disabled={saving}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addFirstButtonText}>Add First Address</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Button (if not empty) */}
      {addresses.length > 0 && addresses.length < 3 && (
        <View style={styles.floatingButton}>
          <TouchableOpacity
            style={[styles.addFloatingButton, saving && styles.buttonDisabled]}
            onPress={handleAddAddress}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name="add" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={locationModalVisible}
        onClose={() => {
          setLocationModalVisible(false);
          setEditingAddress(null);
        }}
        onSelect={handleLocationSelect}
      />

      {/* Loading Overlay */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#FF6B35" />
            <Text style={styles.loadingCardText}>
              {editingAddress ? 'Updating address...' : 'Adding address...'}
            </Text>
          </View>
        </View>
      )}
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
  addButton: {
    padding: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: '#28A745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addFloatingButton: {
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  loadingCardText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
