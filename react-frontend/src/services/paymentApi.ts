import api from './api';

export const paymentApi = {
  getPaymentHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/bookings/payments', { params });
    return response.data;
  },
};
