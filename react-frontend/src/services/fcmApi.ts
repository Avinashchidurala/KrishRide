import api from './api';

export const fcmApi = {
  registerToken: async (fcmToken: string) => {
    const response = await api.post('/fcm/token', { fcmToken });
    return response.data;
  },

  removeToken: async () => {
    const response = await api.delete('/fcm/token');
    return response.data;
  },
};

