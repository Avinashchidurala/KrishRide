import api from './api';

export const supportApi = {
  // Create a support ticket
  createTicket: async (data: {
    bookingId?: string;
    rideId?: string;
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    const response = await api.post('/support', data);
    return response.data;
  },

  // Get user's support tickets
  getTickets: async (params?: { page?: number; limit?: number; status?: string; priority?: string }) => {
    const response = await api.get('/support', { params });
    return response.data;
  },

  // Get support ticket details
  getTicket: async (id: string) => {
    const response = await api.get(`/support/${id}`);
    return response.data;
  },
};

