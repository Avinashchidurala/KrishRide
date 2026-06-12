import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { authService } from './authService';

// Get API base URL from environment variable or fallback to defaults
// const getApiBaseUrl = (): string => {
//   return process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000/api";
// };


// console.log("API URL USED:", process.env.EXPO_PUBLIC_API_URL);


const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api";

console.log(API_BASE_URL)

// Log API configuration on startup
console.log('🚀 [API_CONFIG] Initializing API client...');
console.log('🚀 [API_CONFIG] Platform:', Platform.OS);
console.log('🚀 [API_CONFIG] Development mode:', __DEV__);
console.log('🚀 [API_CONFIG] API Base URL:', API_BASE_URL);
console.log('🚀 [API_CONFIG] Signup endpoint will be:', `${API_BASE_URL}/auth/signup`);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  
  // Enhanced logging for signup requests
  if (config.url?.includes('signup')) {
    console.log('🌐 [API_REQUEST] Signup request intercepted');
    console.log('🌐 [API_REQUEST] Full URL:', `${config.baseURL}${config.url}`);
    console.log('🌐 [API_REQUEST] Method:', config.method?.toUpperCase());
    console.log('🌐 [API_REQUEST] Base URL:', config.baseURL);
    console.log('🌐 [API_REQUEST] Endpoint:', config.url);
    console.log('🌐 [API_REQUEST] Request data:', JSON.stringify(config.data, null, 2));
    console.log('🌐 [API_REQUEST] Headers:', JSON.stringify(config.headers, null, 2));
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (__DEV__) {
      console.log('🔑 Adding token to request:', config.url, 'Token:', token.substring(0, 20) + '...');
    }
  } else {
    if (__DEV__) {
      console.warn('⚠️ No token found for request:', config.url);
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Log successful signup responses
    if (response.config.url?.includes('signup')) {
      console.log('✅ [API_RESPONSE] Signup response received');
      console.log('✅ [API_RESPONSE] Status:', response.status);
      console.log('✅ [API_RESPONSE] Status text:', response.statusText);
      console.log('✅ [API_RESPONSE] Response data:', JSON.stringify(response.data, null, 2));
    }
    return response;
  },
  async (error) => {
    // Enhanced error logging for signup
    if (error.config?.url?.includes('signup')) {
      console.error('❌ [API_RESPONSE] Signup request failed!');
      console.error('❌ [API_RESPONSE] Status:', error.response?.status);
      console.error('❌ [API_RESPONSE] Status text:', error.response?.statusText);
      console.error('❌ [API_RESPONSE] Full URL:', `${error.config?.baseURL}${error.config?.url}`);
      console.error('❌ [API_RESPONSE] Method:', error.config?.method?.toUpperCase());
      console.error('❌ [API_RESPONSE] Request data:', JSON.stringify(error.config?.data, null, 2));
      console.error('❌ [API_RESPONSE] Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ [API_RESPONSE] Error message:', error.message);
      console.error('❌ [API_RESPONSE] Full error object:', JSON.stringify(error, null, 2));
    }
    
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // Don't logout for OTP verification endpoints - these now return 400 for wrong OTP
      // But keep this check as safety measure in case any endpoint still returns 401
      // User is not logged in yet during OTP verification, so 401 shouldn't trigger logout
      const isOtpVerification = requestUrl.includes('/auth/login/verify') || 
                                 requestUrl.includes('/auth/signup/verify') ||
                                 requestUrl.includes('/users/signup/verify') ||
                                 requestUrl.includes('/drivers/signup/verify');
      
      if (isOtpVerification) {
        // This is just a wrong OTP, don't logout - user is not logged in yet
        // Note: Backend now returns 400 for invalid OTP, so this is a safety check
        console.log('⚠️ Invalid OTP during verification - not logging out (user not authenticated yet)');
        return Promise.reject(error);
      }
      
      // For other 401 errors, user is logged in but token is invalid/expired
      console.error('🚫 Unauthorized (401) - Token invalid or expired');
      console.error('Request URL:', requestUrl);
      console.error('Token used:', error.config?.headers?.Authorization?.substring(0, 30) + '...');
      
      // Clear invalid token from storage
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('🧹 Cleared invalid token from storage');
      
      // Trigger logout in Redux store (will redirect to login via AppNavigator)
      authService.handleUnauthorized();
    } else if (error.response?.status === 404) {
      console.error('🔴 [API_RESPONSE] 404 Not Found!');
      console.error('🔴 [API_RESPONSE] The endpoint does not exist on the server');
      console.error('🔴 [API_RESPONSE] Check if backend is running and endpoint is correct');
      console.error('🔴 [API_RESPONSE] Expected endpoint:', `${error.config?.baseURL}${error.config?.url}`);
    }
    return Promise.reject(error);
  }
);

export default api;

