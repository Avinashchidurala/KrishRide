import api from './api';

export const paymentApi = {
  /**
   * Create payment request for a booking
   * This uses the backend /payments/create endpoint which handles PayU integration
   */
  createPayment: async (bookingId: string, amount: number) => {
    const response = await api.post('/payments/create', { bookingId, amount });
    return response.data;
  },

  /**
   * Create PayU payment directly (alternative method)
   * This uses the backend /payments/payu/create-payment endpoint
   */
  createPayUPayment: async (amount: number, firstname: string, email: string, phone: string) => {
    const response = await api.post('/payments/payu/create-payment', { amount, firstname, email, phone });
    return response.data;
  },

  /**
   * Get payment status for a booking
   */
  getPaymentStatus: async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },
};

