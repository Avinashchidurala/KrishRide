import api from './api';

export const walletApi = {
  getWalletBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getWalletTransactions: async () => {
    const response = await api.get('/wallet/transactions');
    return response.data;
  },
};

