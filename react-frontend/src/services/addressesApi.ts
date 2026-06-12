import api from './api';

export const addressesApi = {
  getAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  getSuggestions: async () => {
    const response = await api.get('/addresses/suggestions');
    return response.data;
  },

  addAddress: async (data: {
    label: 'home' | 'work' | 'other';
    displayName: string;
    latitude: number;
    longitude: number;
  }) => {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  updateAddress: async (id: string, data: {
    address?: string;
    address_type?: 'home' | 'work' | 'other';
    latitude?: number;
    longitude?: number;
    is_default?: boolean;
  }) => {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};

