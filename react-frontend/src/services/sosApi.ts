import api from './api';

export const sosApi = {
  createSOSAlert: async (data: { latitude: number; longitude: number; message?: string }) => {
    const response = await api.post('/sos', data);
    return response.data;
  },

  getSOSAlerts: async () => {
    const response = await api.get('/sos');
    return response.data;
  },

  updateSOSAlert: async (id: string, status: string) => {
    const response = await api.put(`/sos/${id}`, { status });
    return response.data;
  },
};

