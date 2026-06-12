import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../utils/env';

const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add access token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and user-friendly errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, clear storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        processQueue(error, null);
        
        // Return user-friendly error
        const userError: any = new Error('Please login to continue.');
        userError.originalError = error;
        userError.statusCode = 401;
        return Promise.reject(userError);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(`${env.VITE_API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        if (accessToken) {
          // Store new access token
          localStorage.setItem('accessToken', accessToken);

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Process queued requests
          processQueue(null, accessToken);

          // Retry original request
          return api(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        processQueue(refreshError as AxiosError, null);
        window.location.href = '/login';
        
        // Return user-friendly error
        const userError: any = new Error('Session expired. Please login again.');
        userError.originalError = refreshError;
        userError.statusCode = 401;
        return Promise.reject(userError);
      } finally {
        isRefreshing = false;
      }
    }

    
    // USER-FRIENDLY ERROR MESSAGES 
    
    const userFriendlyError: any = new Error('Something went wrong. Please try again.');

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const serverMessage = (error.response.data as any)?.error?.message || (error.response.data as any)?.message;

      // Map status codes to user-friendly messages
      switch (status) {
        case 400:
          userFriendlyError.message = serverMessage || 'Invalid request. Please check your input.';
          break;
        case 401:
          userFriendlyError.message = 'Please login to continue.';
          // Auto logout on 401 
          if (!originalRequest._retry) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login';
            }
          }
          break;
        case 403:
          userFriendlyError.message = serverMessage || 'You do not have permission to perform this action.';
          break;
        case 404:
          userFriendlyError.message = serverMessage || 'The requested item was not found.';
          break;
        case 409:
          userFriendlyError.message = serverMessage || 'This item already exists.';
          break;
        case 422:
          userFriendlyError.message = serverMessage || 'Please check your input and try again.';
          break;
        case 429:
          userFriendlyError.message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          userFriendlyError.message = 'Server error. Please try again later.';
          break;
        case 502:
          userFriendlyError.message = 'Service temporarily unavailable. Please try again.';
          break;
        case 503:
          userFriendlyError.message = 'Service is currently down. Please try again later.';
          break;
        default:
          userFriendlyError.message = serverMessage || 'An error occurred. Please try again.';
      }
    } else if (error.request) {
      // Request made but no response
      userFriendlyError.message = 'Unable to connect to server. Please check your internet connection.';
    } else {
      // Other errors
      userFriendlyError.message = error.message || 'Something went wrong. Please try again.';
    }

    // Store original error for debugging
    userFriendlyError.originalError = error;
    userFriendlyError.statusCode = error.response?.status;

    return Promise.reject(userFriendlyError);
  }
);
export default api;

