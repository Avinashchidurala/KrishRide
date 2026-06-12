import api from './api';

export const driverApi = {
  signup: async (data: {
    mobile: string;
    firstName: string;
    lastName: string;
    email?: string;
    gender?: string;
    emergencyContactName?: string;
    emergencyContactMobile?: string;
    agreeTerms: boolean;
  }) => {
    const response = await api.post('/drivers/signup', data);
    return response.data;
  },

  signupVerify: async (data: {
    mobile: string;
    firstName: string;
    lastName: string;
    email?: string;
    gender?: string;
    emergencyContactName?: string;
    emergencyContactMobile?: string;
    referralCode?: string;
    otp: string;
  }) => {
    const response = await api.post('/drivers/signup/verify', data);
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

  submitKYC: async (data: {
    aadharNumber?: string;
    panNumber?: string;
    drivingLicenseNumber: string;
    drivingLicenseExpiry: string;
    aadharUrl?: string;
    panUrl?: string;
    drivingLicenseUrl?: string;
    selfieUrl: string;
    bankName?: string;
    bankIfscCode?: string;
    bankAccountNumber?: string;
  }) => {
    const response = await api.post('/drivers/kyc', data);
    return response.data;
  },

  getKYCStatus: async () => {
    const response = await api.get('/drivers/kyc/status');
    return response.data;
  },

  addVehicle: async (data: {
    model: string; // Combined make + model or just model
    color: string;
    plateNumber: string;
    photos?: string[]; // Legacy: Combined array of photo URLs (first 2 are outside, rest are inside)
    insidePhotos?: string[]; // New: Array of inside photo URLs (up to 4)
    outsidePhotos?: string[]; // New: Array of outside photo URLs (up to 4)
    registrationDocument?: string;
  }) => {
    const response = await api.post('/drivers/vehicles', data);
    return response.data;
  },

  getVehicles: async () => {
    const response = await api.get('/drivers/vehicles');
    return response.data;
  },

  updateVehicle: async (vehicleId: string, data: {
    model?: string;
    color?: string;
    plateNumber?: string;
    photos?: string[]; // Legacy: Combined array
    insidePhotos?: string[]; // New: Array of inside photo URLs (up to 4)
    outsidePhotos?: string[]; // New: Array of outside photo URLs (up to 4)
    registrationDocument?: string;
  }) => {
    const response = await api.put(`/drivers/vehicles/${vehicleId}`, data);
    return response.data;
  },

  activateVehicle: async (vehicleId: string) => {
    const response = await api.put(`/drivers/vehicles/${vehicleId}/activate`);
    return response.data;
  },

  deleteVehicle: async (vehicleId: string) => {
    const response = await api.delete(`/drivers/vehicles/${vehicleId}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/drivers/profile');
    return response.data;
  },

  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    gender?: string;
    emergencyContactName?: string;
    emergencyContactMobile?: string;
  }) => {
    const response = await api.put('/drivers/profile', data);
    return response.data;
  },

  getSurgePricingSettings: async (city?: string) => {
    const params = city ? { city } : {};
    const response = await api.get('/rides/surge-pricing-settings', { params });
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get('/drivers/dashboard/stats');
    return response.data;
  },
  getStartedRideForDriver: async (id: string) => {
    const response = await api.get(`/rides/get-started-ride-for-driver/${id}`);
    return response.data;
  },

  postMessageForRideCancelByDriver: async(id:string,message:string) => {
    const response = await api.post(`/rides/driver-ride-cancel/${id}`,{message});
    return response.data;
  }
};


