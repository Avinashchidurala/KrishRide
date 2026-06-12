import api from './api';

export const authApi = {
  login: async (mobile: string) => {
    const response = await api.post('/auth/login', { mobile });
 if (response.data?.success === false) {
    throw {
      response: {
        data: response.data,
      },
    };
  }

  // Handle wrapped response
  if (response.data?.success && response.data?.data) {
    return response.data.data;
  }

  return response.data;
},

  verifyOTP: async (mobile: string, otp: string) => {
    const response = await api.post('/auth/login/verify', { mobile, otp });
    // Handle both wrapped response { success: true, data: {...} } and direct response
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    // Handle both wrapped response { success: true, data: {...} } and direct response
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  logout: async (refreshToken?: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    // Handle both wrapped response { success: true, data: {...} } and direct response
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  revokeAllTokens: async () => {
    const response = await api.post('/auth/revoke-all-tokens');
    // Handle both wrapped response { success: true, data: {...} } and direct response
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    // Handle both wrapped response { success: true, data: {...} } and direct response
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
};

