import api from './api';

export const ridesApi = {
  searchRides: async (params: {
    pickup?: string | any; // Can be string or LocationObject
    drop?: string | any; // Can be string or LocationObject
    date?: string;
    timeSlots?: string | string[]; // Time slot filters (e.g., '00-03,06-09' or ['00-03', '06-09'])
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) => {
    // Convert timeSlots array to comma-separated string for query params
    const queryParams: any = { ...params };
    
    // Extract label from location objects if provided
    if (queryParams.pickup && typeof queryParams.pickup === 'object' && queryParams.pickup.label) {
      queryParams.pickup = queryParams.pickup.label;
    }
    if (queryParams.drop && typeof queryParams.drop === 'object' && queryParams.drop.label) {
      queryParams.drop = queryParams.drop.label;
    }
    
    if (Array.isArray(queryParams.timeSlots)) {
      queryParams.timeSlots = queryParams.timeSlots.join(',');
    }
    const response = await api.get('/rides', { params: queryParams });
    return response.data;
  },

  getRideDetails: async (rideId: string) => {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  },

  publishRide: async (data: {
    vehicleId?: string;
    pickupLocation: string;
    dropLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropLatitude: number;
    dropLongitude: number;
    scheduledDate?: string;
    scheduledTime?: string;
    scheduledDateTime?: string; // ISO string format
    seatsAvailable: number;
    pricePerSeat: number;
    perKmRate?: number;
    distanceKm?: number;
    routePolyline?: string;
    routeDurationMin?: number;
    routeDistanceKm?: number;
    
    // isSurge is automatically determined by backend based on admin settings and date/time
    stops?: Array<{ location: string; latitude: number; longitude: number }>;
  }) => {
    const response = await api.post('/rides', data);
    return response.data;
  },

  getMyRides: async () => {
    const response = await api.get('/rides/driver/my-rides');
    return response.data;
  },

  cancelRide: async (rideId: string) => {
    const response = await api.delete(`/rides/${rideId}`);
    return response.data;
  },

  startRide: async (rideId: string) => {
    const response = await api.post(`/rides/${rideId}/start`);
    return response.data;
  },

  endRide: async (rideId: string) => {
    const response = await api.post(`/rides/${rideId}/end`);
    return response.data;
  },

  getStartedRideForCustomer: async (id: string) => {
    const response = await api.get(`/rides/startedRideForCustomer/${id}`);
    return response.data;
  },

  getActiveStates: async () => {
    const response = await api.get('/service-states');
    return response.data;
  },
};

