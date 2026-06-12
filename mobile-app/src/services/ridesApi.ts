import api from './api';

export const ridesApi = {
  searchRides: async (params: {
    pickup?: string;
    drop?: string;
    date?: string;
    timeSlots?: string;
    minPrice?: number;
    maxPrice?: number;
    startLatitude?: string;
    startLongitude?: string;
    endLatitude?: string;
    endLongitude?: string;
  }) => {
    const response = await api.get('/rides', { params });
    return response.data;
  },

  getRideDetails: async (id: string) => {
    const response = await api.get(`/rides/${id}`);
    return response.data;
  },

  publishRide: async (data: {
    vehicleId?: string;
    pickupLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropLocation: string;
    dropLatitude: number;
    dropLongitude: number;
    scheduledDate: string;
    scheduledTime: string;
    seatsAvailable: number;
    pricePerSeat: number;
    perKmRate?: number;
    distanceKm?: number;
    stops?: Array<{ location: string; latitude: number; longitude: number }>;
    isSurge?: boolean;
  }) => {
    const response = await api.post('/rides', data);
    return response.data;
  },

  getMyRides: async () => {
    const response = await api.get('/rides/driver/my-rides');
    return response.data;
  },
};

