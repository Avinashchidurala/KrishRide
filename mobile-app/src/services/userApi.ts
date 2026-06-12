import api from './api';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactMobile?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  mobile: string;
  relationship?: string;
  is_primary: boolean;
}

export interface AddEmergencyContactData {
  name: string;
  mobile: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface UpdateEmergencyContactData {
  name?: string;
  mobile?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export const userApi = {
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  getDriverProfile: async () => {
    const response = await api.get('/drivers/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData, role: 'customer' | 'driver' = 'customer') => {
    // Drivers may not have a separate profile update endpoint, use users endpoint for both
    // The backend will handle authorization based on the user's role
    const endpoint = '/users/profile';
    const response = await api.put(endpoint, data);
    return response.data;
  },

  uploadProfilePhoto: async (photoUrl: string, role: 'customer' | 'driver' = 'customer') => {
    // Profile photo endpoint works for both customers and drivers
    const endpoint = '/users/profile/photo';
    const response = await api.post(endpoint, { photoUrl });
    return response.data;
  },

  // Emergency Contacts
  getEmergencyContacts: async () => {
    const response = await api.get('/emergency-contacts');
    return response.data;
  },

  addEmergencyContact: async (data: AddEmergencyContactData) => {
    const response = await api.post('/emergency-contacts', data);
    return response.data;
  },

  updateEmergencyContact: async (id: string, data: UpdateEmergencyContactData) => {
    const response = await api.put(`/emergency-contacts/${id}`, data);
    return response.data;
  },

  deleteEmergencyContact: async (id: string) => {
    const response = await api.delete(`/emergency-contacts/${id}`);
    return response.data;
  },
};

