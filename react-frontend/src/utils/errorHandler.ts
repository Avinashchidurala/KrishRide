/**
 * Error Handler Utility
 * Handles standardized backend error responses
 */

import { AxiosError } from 'axios';

/**
 * Standardized backend error response format
 */
export interface BackendErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Extract error message from API error response
 * Handles both standardized format and legacy formats
 */
export const getErrorMessage = (error: any): string => {
  // Check if it's an Axios error
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Standardized format: { success: false, error: { message: "...", code: ... } }
    if (data.error && typeof data.error === 'object' && data.error.message) {
      return data.error.message;
    }
    
    // Legacy format: { error: "message" }
    if (typeof data.error === 'string') {
      return data.error;
    }
    
    // Legacy format: { message: "..." }
    if (data.message) {
      return data.message;
    }
  }
  
  // Fallback to error message
  return error?.message || 'An unexpected error occurred';
};

/**
 * Extract error code from API error response
 */
export const getErrorCode = (error: any): number | null => {
  if (error?.response?.data?.error?.code) {
    return error.response.data.error.code;
  }
  return null;
};

/**
 * Extract error details from API error response
 */
export const getErrorDetails = (error: any): any => {
  if (error?.response?.data?.error?.details) {
    return error.response.data.error.details;
  }
  return null;
};

/**
 * Check if error is a specific error code
 */
export const isErrorCode = (error: any, code: number): boolean => {
  return getErrorCode(error) === code;
};

/**
 * Get full error response object
 */
export const getErrorResponse = (error: any): BackendErrorResponse | null => {
  if (error?.response?.data && error.response.data.success === false) {
    return error.response.data as BackendErrorResponse;
  }
  return null;
};

