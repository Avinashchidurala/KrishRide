import { ErrorCode, getErrorStatus } from './errorCodes';
import { Response } from 'express';

/**
 * Custom API Error Class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = getErrorStatus(code);
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Send standardized error response
 */
export const sendErrorResponse = (
  res: Response,
  code: ErrorCode,
  message: string,
  details?: any,
  statusCode?: number
): void => {
  const status = statusCode || getErrorStatus(code);
  const response: ErrorResponse = {
    success: false,
    error: {
      code: code as number,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
  };

  res.status(status).json(response);
};

/**
 * Send standardized success response
 */
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  res.status(statusCode).json(response);
};

/**
 * Handle errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: any, res: Response, next: any) => Promise<any>
) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (error instanceof ApiError) {
        sendErrorResponse(res, error.code, error.message, error.details, error.statusCode);
      } else {
        console.error('Unhandled error:', error);
        sendErrorResponse(
          res,
          ErrorCode.INTERNAL_SERVER_ERROR,
          error.message || 'An unexpected error occurred',
          process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
        );
      }
    });
  };
};

/**
 * Common error creators for convenience
 */
export const createError = {
  notFound: (resource: string, id?: string) => {
    // Map resource to appropriate error code
    const codeMap: Record<string, ErrorCode> = {
      'user': ErrorCode.USER_NOT_FOUND,
      'customer': ErrorCode.CUSTOMER_NOT_FOUND,
      'driver': ErrorCode.DRIVER_NOT_FOUND,
      'ride': ErrorCode.RIDE_NOT_FOUND,
      'booking': ErrorCode.BOOKING_NOT_FOUND,
      'vehicle': ErrorCode.VEHICLE_NOT_FOUND,
      'address': ErrorCode.ADDRESS_NOT_FOUND,
      'payment': ErrorCode.PAYMENT_NOT_FOUND,
      'complaint': ErrorCode.COMPLAINT_NOT_FOUND,
      'support ticket': ErrorCode.SUPPORT_TICKET_NOT_FOUND,
      'emergency contact': ErrorCode.EMERGENCY_CONTACT_NOT_FOUND,
      'rating': ErrorCode.RATING_NOT_FOUND,
      'sos alert': ErrorCode.SOS_ALERT_NOT_FOUND,
      'payout': ErrorCode.PAYOUT_NOT_FOUND,
    };
    const code = codeMap[resource.toLowerCase()] || ErrorCode.INTERNAL_SERVER_ERROR;
    return new ApiError(
      code,
      `${resource} not found${id ? `: ${id}` : ''}`,
      { resource, id }
    );
  },

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(ErrorCode.AUTH_UNAUTHORIZED, message),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(ErrorCode.AUTH_FORBIDDEN, message),

  validation: (message: string, field?: string) =>
    new ApiError(
      ErrorCode.VALIDATION_REQUIRED,
      message,
      field ? { field } : undefined
    ),

  badRequest: (message: string, details?: any) =>
    new ApiError(ErrorCode.VALIDATION_REQUIRED, message, details),

  conflict: (message: string, details?: any) =>
    new ApiError(ErrorCode.USER_ALREADY_EXISTS, message, details),

  internal: (message: string = 'Internal server error', details?: any) =>
    new ApiError(ErrorCode.INTERNAL_SERVER_ERROR, message, details),
};

