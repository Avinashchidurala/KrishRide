import api from './api';

export const bookingsApi = {
  createBooking: async (data: {
    rideId: string;
    passengerCount: number;
    paymentMethod: string;
  }) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  getCustomerBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  getBookingDetails: async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  verifyPickupOTP: async (bookingId: string, otp: string) => {
    const response = await api.post(`/bookings/${bookingId}/verify-pickup-otp`, { otp });
    return response.data;
  },

  verifyDropPIN: async (bookingId: string, pin: string) => {
    const response = await api.post(`/bookings/${bookingId}/verify-drop-pin`, { pin });
    return response.data;
  },
};

