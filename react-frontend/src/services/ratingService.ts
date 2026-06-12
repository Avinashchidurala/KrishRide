import api from './api';

export interface RatingData {
  bookingId: string;
  rating: number;
  review?: string;
}

export interface RatingResponse {
  message: string;
  rating: {
    id: string;
    bookingId: string;
    rating: number;
    review: string | null;
    driverId: string;
    driverAverageRating: string;
    totalRatings: number;
  };
}

export interface DriverRating {
  driverId: string;
  driverName: string;
  averageRating: string;
  totalRatings: number;
}

export interface DriverReview {
  rating: number;
  review: string | null;
  ratedAt: string;
  bookingNumber: string;
}

export interface DriverReviewsResponse {
  driver: {
    id: string;
    name: string;
    photo: string | null;
    averageRating: string;
    totalRatings: number;
  };
  reviews: DriverReview[];
}

export interface MyRating {
  ratingId: string;
  bookingId: string;
  bookingNumber: string;
  driverName: string;
  driverPhoto: string | null;
  rideRoute: string;
  rating: number;
  review: string | null;
  ratedAt: string;
}

export interface MyRatingsResponse {
  count: number;
  ratings: MyRating[];
}

// Submit a rating for a completed booking
export const submitRating = async (data: RatingData): Promise<RatingResponse> => {
  const response = await api.post<RatingResponse>('/ratings', data);
  return response.data;
};

// Get current user's ratings (ratings given by customer)
export const getMyRatings = async (): Promise<MyRatingsResponse> => {
  const response = await api.get<MyRatingsResponse>('/ratings/my-ratings');
  return response.data;
};

// Get driver's average rating and info
export const getDriverRating = async (driverId: string): Promise<DriverRating> => {
  const response = await api.get<DriverRating>(`/ratings/driver/${driverId}`);
  return response.data;
};

// Get driver's reviews and detailed rating info
export const getDriverReviews = async (driverId: string): Promise<DriverReviewsResponse> => {
  const response = await api.get<DriverReviewsResponse>(`/ratings/driver/${driverId}/reviews`);
  return response.data;
};
