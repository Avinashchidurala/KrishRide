import api from './api';

export const referralsApi = {
  getReferralCode: async () => {
    const response = await api.get('/referrals/code');
    return response.data;
  },

  getReferralStats: async () => {
    const response = await api.get('/referrals/stats');
    return response.data;
  },
};

