import api from './api';

export const sosApi = {
  createSOSAlert: async (data: { latitude: number; longitude: number }) => {
    const response = await api.post('/sos', data);
    return response.data;
  },
};

