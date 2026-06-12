import axios from 'axios';
import { VITE_API_BASE_URL } from '../utils/env';


const api = axios.create({
  baseURL: `${VITE_API_BASE_URL}/admin`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh (similar to main api.ts)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (response.config.url?.includes('/bookings')) {
      console.log('Admin bookings API response:', response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken'); // Changed to localStorage

      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        processQueue(error, null);
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${VITE_API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const adminApi = {
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  exportUsers: async (params?: { role?: string; search?: string }) => {
    const response = await api.get('/lists/export-users', { 
      params,
      responseType: 'blob', 
    });
    return response.data;
  },
  exportBookings: async (params?: { status?: string; paymentStatus?: string }) => {
    const response = await api.get('/lists/export-bookings', { 
      params,
      responseType: 'blob', 
    });
    return response.data;
  },
  

  getUserDetails: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    role: 'customer' | 'driver' | 'admin';
    gender?: string;
    age?: number;
    emergencyContactName?: string;
    emergencyContactMobile?: string;
  }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/users/${id}/status`, { isActive: isActive });
    return response.data;
  },

  getRides: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get('/rides', { params });
    return response.data;
  },

  getLiveRides: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/rides/live', { params });
    return response.data;
  },

  getBookings: async (params?: { page?: number; limit?: number; status?: string; paymentStatus?: string }) => {
    try {
      console.log('Admin API getBookings called with params:', params);
      const response = await api.get('/bookings', { params });
      console.log('Admin API getBookings response:', response);
      console.log('Admin API getBookings response.data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Admin API getBookings error:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  updateBookingPaymentStatus: async (bookingId: string, paymentStatus: string) => {
    const response = await api.put(`/bookings/${bookingId}/payment-status`, { paymentStatus });
    return response.data;
  },

  getPendingKYC: async () => {
    const response = await api.get('/kyc/pending');
    return response.data;
  },

  verifyKYC: async (id: string, status: 'approved' | 'rejected', remarks?: string) => {
    const response = await api.put(`/kyc/${id}/verify`, { status, remarks });
    return response.data;
  },

  getComplaints: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  updateComplaint: async (id: string, status: string, resolution?: string) => {
    const response = await api.put(`/complaints/${id}`, { status, resolution });
    return response.data;
  },

  getSOSAlerts: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/sos', { params });
    return response.data;
  },

  updateSOSAlertStatus: async (id: string, status: 'active' | 'acknowledged' | 'resolved') => {
    const response = await api.put(`/sos/${id}`, { status });
    return response.data;
  },

  getRevenue: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/revenue', { params });
    return response.data;
  },

  // Payouts
  getPayouts: async (params?: { page?: number; limit?: number; status?: string; driverId?: string }) => {
    const response = await api.get('/payouts', { params });
    return response.data;
  },

  updatePayoutStatus: async (id: string, status: string, transactionId?: string) => {
    const response = await api.put(`/payouts/${id}/status`, { status, transactionId });
    return response.data;
  },

  getDriversWalletBalances: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/drivers/wallet-balances', { params });
    return response.data;
  },

  createPayout: async (data: { driverId: string; amount: number; payoutMethod?: string; transactionId?: string }) => {
    const response = await api.post('/payouts/create', data);
    return response.data;
  },

  // Support Tickets
  getSupportTickets: async (params?: { page?: number; limit?: number; status?: string; priority?: string; assignedTo?: string }) => {
    const response = await api.get('/support-tickets', { params });
    return response.data;
  },

  updateSupportTicket: async (id: string, data: { status?: string; priority?: string; assignedTo?: string }) => {
    const response = await api.put(`/support-tickets/${id}`, data);
    return response.data;
  },

  // Vehicles
  getVehicles: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },

  updateVehicleStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/vehicles/${id}/status`, { isActive });
    return response.data;
  },


  // Analytics
  getAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics', { params });
    return response.data;
  },

  // Surge Pricing Settings
  getSurgePricingSettings: async () => {
    const response = await api.get('/settings/surge-pricing');
    return response.data;
  },

  updateSurgePricingSettings: async (settings: {
    enabled?: boolean;
    multiplier?: number;
    basePricePerKm?: number;
    scope?: 'global' | 'city';
    city?: string;
  }) => {
    const response = await api.put('/settings/surge-pricing', settings);
    return response.data;
  },
  deleteCitySurgePricingSettings: async (city: string) => {
    const response = await api.delete(`/settings/surge-pricing/city/${encodeURIComponent(city)}`);
    return response.data;
  },

  // Notifications
  getNotifications: async (unreadOnly?: boolean) => {
    const response = await api.get('/notifications', { 
      params: unreadOnly ? { unreadOnly: 'true' } : {} 
    });
    return response.data;
  },

  markNotificationRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  createDummySOS: async () => {
    const response = await api.post('/notifications/dummy-sos');
    return response.data;
  },

  AdminBookingCancel: async (bookingId: string, data?: { paymentStatus?: string }) => {
    const response = await api.post(`/${bookingId}/cancel`, data);
    return response.data;
  },

  EditUserDetails: async (userId:string,data:{}) => {
    const response = await api.put(`profile-update/${userId}`, data);
    return response.data;
  },

  getAdminWalletBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },
  getAdminWalletHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/wallet/history', { params });
    return response.data;
  },
  GetDriverDetailsByUserId: async (userId:string) => {
    const response = await api.get(`driver-profile/${userId}`);
    return response.data;
  },

  EditDriverDetails: async (userId:string,data:{bank_name?:string;bank_ifsc_code?:string;bank_account_number?:string;}) => {
    const response = await api.put(`update-driver-profile/${userId}`, data);
    return response.data;
  }




};

