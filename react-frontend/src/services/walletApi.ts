import api from './api';

export const walletApi = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getTransactions: async (params: any) => {
    const response = await api.get('/wallet/transactions', { params });
    return response.data;
  },

  applyWallet: async (data: any) => {
    const response = await api.post('/wallet/apply', data);
    return response.data;
  },

  getDriverTransactions: async(params:any,id:string) => {
    const response = await api.get(`/wallet/transactions/${id}`,{params});
    return response.data
  },

  getAdminTransactions:async(params:any) => {
    const response = await api.get('/wallet/admin/transactions',{params});
    return response.data
  }
};

