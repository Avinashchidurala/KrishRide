import { Request, Response, NextFunction } from 'express';
import { ApiError, sendErrorResponse } from '../utils/errors';
import { ErrorCode } from '../utils/errorCodes';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    sendErrorResponse(res, err.code, err.message, err.details, err.statusCode);
    return;
  }

  // Handle validation errors (e.g., from express-validator)
  if (err.name === 'ValidationError') {
    sendErrorResponse(
      res,
      ErrorCode.VALIDATION_REQUIRED,
      err.message || 'Validation error',
      undefined,
      400
    );
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendErrorResponse(
      res,
      ErrorCode.AUTH_TOKEN_INVALID,
      'Invalid token',
      undefined,
      401
    );
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendErrorResponse(
      res,
      ErrorCode.AUTH_TOKEN_EXPIRED,
      'Token expired',
      undefined,
      401
    );
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      sendErrorResponse(
        res,
        ErrorCode.USER_ALREADY_EXISTS,
        'Record already exists',
        { field: prismaError.meta?.target },
        409
      );
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      sendErrorResponse(
        res,
        ErrorCode.USER_NOT_FOUND,
        'Record not found',
        undefined,
        404
      );
      return;
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      sendErrorResponse(
        res,
        ErrorCode.VALIDATION_INVALID_FORMAT,
        'Invalid reference',
        { field: prismaError.meta?.field_name },
        400
      );
      return;
    }
  }

  // Log unexpected errors
  console.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  sendErrorResponse(
    res,
    ErrorCode.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'Internal server error',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  sendErrorResponse(
    res,
    ErrorCode.USER_NOT_FOUND, // Generic not found for 404 routes
    `Route not found: ${req.method} ${req.path}`,
    { path: req.path, method: req.method },
    404
  );
};

