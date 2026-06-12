import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get API base URL from environment variable or fallback to defaults
// const getApiBaseUrl = (): string => {
//   if (process.env.EXPO_PUBLIC_API_URL) {
//     return process.env.EXPO_PUBLIC_API_URL;
//   }
//   if (__DEV__) {
//     if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:3000/api';
//     }
//     return 'http://localhost:3000/api';
//   }
//   return 'https://api.hushryd.com/api';
// };

const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

// Log API configuration
console.log('🚀 [AUTH_API_CONFIG] Initializing Auth API client...');
console.log('🚀 [AUTH_API_CONFIG] Platform:', Platform.OS);
console.log('🚀 [AUTH_API_CONFIG] Development mode:', __DEV__);
console.log('🚀 [AUTH_API_CONFIG] API Base URL:', API_BASE_URL);
console.log('🚀 [AUTH_API_CONFIG] Signup endpoints:');
console.log('🚀 [AUTH_API_CONFIG]   - Customer:', `${API_BASE_URL}/users/signup`);
console.log('🚀 [AUTH_API_CONFIG]   - Driver:', `${API_BASE_URL}/drivers/signup`);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (mobile: string) => {
    const response = await api.post('/auth/login', { mobile });
    return response.data;
  },

  verifyLoginOtp: async (mobile: string, otp: string) => {
    const response = await api.post('/auth/login/verify', { mobile, otp });
    if (response.data.token && response.data.user) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (data: {
    role: 'customer' | 'driver';
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    gender: string;
  }) => {
    console.log('🔵 [AUTH_API] signup() called');
    console.log('🔵 [AUTH_API] API Base URL:', API_BASE_URL);
    console.log('🔵 [AUTH_API] Role:', data.role);
    
    // Use correct endpoint based on role
    const endpoint = data.role === 'driver' ? '/drivers/signup' : '/users/signup';
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    console.log('🔵 [AUTH_API] Endpoint:', endpoint);
    console.log('🔵 [AUTH_API] Full endpoint URL:', fullUrl);
    console.log('🔵 [AUTH_API] Request data:', JSON.stringify(data, null, 2));
    
    // Backend requires agreeTerms field
    const requestData = {
      ...data,
      agreeTerms: true, // Required by backend
    };
    
    try {
      const response = await api.post(endpoint, requestData);
      console.log('✅ [AUTH_API] Signup response received');
      console.log('✅ [AUTH_API] Response status:', response.status);
      console.log('✅ [AUTH_API] Response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('❌ [AUTH_API] Signup request failed');
      console.error('❌ [AUTH_API] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        fullUrl: `${error?.config?.baseURL}${error?.config?.url}`,
        method: error?.config?.method,
        data: error?.config?.data,
        responseData: error?.response?.data,
      });
      throw error;
    }
  },

  verifySignupOtp: async (
    mobile: string, 
    otp: string, 
    role: 'customer' | 'driver' = 'customer',
    signupData?: {
      firstName: string;
      lastName: string;
      email?: string;
      gender: string;
      emergencyContactName?: string;
      emergencyContactMobile?: string;
      referralCode?: string;
    }
  ) => {
    // Use correct endpoint based on role
    const endpoint = role === 'driver' ? '/drivers/signup/verify' : '/users/signup/verify';
    console.log('🔵 [AUTH_API] verifySignupOtp() called');
    console.log('🔵 [AUTH_API] Role:', role);
    console.log('🔵 [AUTH_API] Endpoint:', endpoint);
    console.log('🔵 [AUTH_API] Full endpoint URL:', `${API_BASE_URL}${endpoint}`);
    
    // Backend requires all signup data along with OTP
    const requestData = {
      mobile,
      otp,
      ...(signupData || {}),
    };
    
    console.log('🔵 [AUTH_API] Request data:', JSON.stringify(requestData, null, 2));
    
    try {
      const response = await api.post(endpoint, requestData);
      console.log('✅ [AUTH_API] OTP verification response received');
      console.log('✅ [AUTH_API] Response status:', response.status);
      console.log('✅ [AUTH_API] Response data:', JSON.stringify(response.data, null, 2));
      
      // Handle different response formats
      const responseData = response.data.data || response.data;
      
      if (responseData.accessToken && responseData.user) {
        await AsyncStorage.setItem('token', responseData.accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(responseData.user));
      } else if (responseData.token && responseData.user) {
        await AsyncStorage.setItem('token', responseData.token);
        await AsyncStorage.setItem('user', JSON.stringify(responseData.user));
      }
      
      return responseData;
    } catch (error: any) {
      console.error('❌ [AUTH_API] OTP verification failed');
      console.error('❌ [AUTH_API] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        fullUrl: `${error?.config?.baseURL}${error?.config?.url}`,
        method: error?.config?.method,
        requestData: error?.config?.data,
        responseData: error?.response?.data,
        errorStack: error?.stack,
      });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
  },
};

