import api from './api';

export interface Address {
  id: string;
  label: string; // 'home', 'work', 'other'
  displayName: string; // Full address string
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export const addressesApi = {
  // Get user's saved addresses
  getUserAddresses: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    // Transform backend format to mobile format
    const addresses = response.data.addresses?.map((addr: any) => ({
      id: addr.id,
      label: addr.label,
      displayName: addr.displayName,
      latitude: parseFloat(addr.latitude),
      longitude: parseFloat(addr.longitude),
      isDefault: addr.isDefault,
    })) || [];
    return addresses;
  },

  // Add new address
  addAddress: async (addressData: { label: string; displayName: string; latitude: number; longitude: number }): Promise<Address> => {
    const response = await api.post('/addresses', addressData);
    return {
      id: response.data.address.id,
      label: response.data.address.label,
      displayName: response.data.address.displayName,
      latitude: response.data.address.latitude,
      longitude: response.data.address.longitude,
    };
  },

  // Update address
  updateAddress: async (id: string, addressData: { displayName?: string; latitude?: number; longitude?: number }): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return {
      id: response.data.address.id,
      label: response.data.address.label,
      displayName: response.data.address.displayName,
      latitude: response.data.address.latitude,
      longitude: response.data.address.longitude,
    };
  },

  // Delete address
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  // Get address suggestions (saved addresses for booking)
  getAddressSuggestions: async (): Promise<Address[]> => {
    const response = await api.get('/addresses/suggestions');
    // Transform backend format to mobile format
    const suggestions = response.data.suggestions?.map((suggestion: any) => ({
      id: suggestion.id,
      label: suggestion.label,
      displayName: suggestion.displayName,
      latitude: parseFloat(suggestion.latitude),
      longitude: parseFloat(suggestion.longitude),
      isDefault: suggestion.isDefault,
    })) || [];
    return suggestions;
  },
};
