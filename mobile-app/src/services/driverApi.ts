import api from './api';

export const driverApi = {
  getDriverDashboardStats: async () => {
    const response = await api.get('/drivers/dashboard/stats');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/drivers/profile');
    return response.data;
  },

  submitKyc: async (data: {
    aadharNumber?: string;
    panNumber?: string;
    drivingLicenseNumber?: string;
    drivingLicenseExpiry?: string;
    aadharUrl?: string;
    panUrl?: string;
    drivingLicenseUrl?: string;
    selfieUrl?: string;
    bankName?: string;
    bankIfscCode?: string;
    bankAccountNumber?: string;
  }) => {
    const response = await api.post('/drivers/kyc', data);
    return response.data;
  },

  verifyBankAccount: async (accountNumber: string, ifscCode: string) => {
    const response = await api.post('/drivers/verify-bank-account', {
      accountNumber,
      ifscCode,
    });
    return response.data;
  },

  getKYCStatus: async () => {
    const response = await api.get('/drivers/kyc/status');
    return response.data;
  },

  getEarnings: async () => {
    const response = await api.get('/drivers/profile');
    return {
      totalEarnings: response.data.driver?.total_earnings || 0,
      walletBalance: response.data.driver?.wallet_balance || 0,
      completedRides: response.data.driver?.completed_rides || 0,
    };
  },

  getMyRides: async () => {
    const response = await api.get('/rides/driver/my-rides');
    return response.data;
  },

  deleteRide: async (rideId: string) => {
    const response = await api.delete(`/rides/${rideId}`);
    return response.data;
  },
};

