import api from './api';

export const userApi = {
  signup: async (data: any) => {
    const response = await api.post('/users/signup', data);
    return response.data;
  },

  signupVerify: async (data: any) => {
    const response = await api.post('/users/signup/verify', data);
    const responseData = response.data?.data || response.data;
    if (responseData?.accessToken) {
      localStorage.setItem('accessToken', responseData.accessToken);
    }
    if (responseData?.refreshToken) {
      localStorage.setItem('refreshToken', responseData.refreshToken);
    }
    // User details will be fetched from /me API, not stored in localStorage
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

