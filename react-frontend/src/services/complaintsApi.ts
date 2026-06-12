import api from './api';

export const complaintsApi = {
  // Create a complaint
  createComplaint: async (data: {
    bookingId?: string;
    subject: string;
    description: string;
  }) => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  // Get user's complaints
  getComplaints: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  // Get complaint details
  getComplaint: async (id: string) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },
};

