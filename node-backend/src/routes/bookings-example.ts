/**
 * Example: How to use Error Codes in Routes
 * 
 * This file demonstrates the proper usage of error codes.
 * Copy these patterns to your actual route files.
 */

import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { asyncHandler, sendErrorResponse, sendSuccessResponse, ApiError } from '../utils/errors';
import { ErrorCode } from '../utils/errorCodes';

const router = express.Router();

// Example 1: Using asyncHandler with error codes
router.post('/example', authenticate, authorize('customer'), asyncHandler(async (req: AuthRequest, res) => {
  const { rideId, passengerCount } = req.body;

  // Validation with error codes
  if (!rideId || typeof rideId !== 'string') {
    sendErrorResponse(res, ErrorCode.VALIDATION_REQUIRED, 'Valid ride ID is required', { field: 'rideId' });
    return;
  }

  if (!passengerCount || typeof passengerCount !== 'number' || passengerCount < 1 || passengerCount > 10) {
    sendErrorResponse(res, ErrorCode.BOOKING_INVALID_PASSENGER_COUNT, 'Passenger count must be between 1 and 10', { 
      min: 1, 
      max: 10,
      received: passengerCount 
    });
    return;
  }

  // Check if resource exists
  const customer = await prisma.customer.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!customer) {
    sendErrorResponse(res, ErrorCode.CUSTOMER_NOT_FOUND, 'Customer not found');
    return;
  }

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    sendErrorResponse(res, ErrorCode.RIDE_NOT_FOUND, 'Ride not found', { rideId });
    return;
  }

  // Check business logic
  if (ride.status !== 'active') {
    sendErrorResponse(res, ErrorCode.RIDE_NOT_AVAILABLE, 'Ride is not available for booking', { 
      status: ride.status 
    });
    return;
  }

  // Success response
  sendSuccessResponse(res, {
    bookingId: 'example-id',
    message: 'Booking created successfully',
  }, 'Booking created');
}));

// Example 2: Throwing ApiError (will be caught by asyncHandler)
router.get('/example/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new ApiError(ErrorCode.BOOKING_NOT_FOUND, 'Booking not found', { bookingId: id });
  }

  // Check authorization
  const customer = await prisma.customer.findUnique({
    where: { userId: req.user!.userId },
  });

  if (booking.customerId !== customer?.id && req.user!.role !== 'admin') {
    throw new ApiError(ErrorCode.BOOKING_NOT_AUTHORIZED, 'Not authorized to view this booking');
  }

  sendSuccessResponse(res, { booking });
}));

// Example 3: Using createError helper
import { createError } from '../utils/errors';

router.delete('/example/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw createError.notFound('Booking', id);
  }

  if (booking.status === 'completed') {
    throw new ApiError(ErrorCode.BOOKING_CANNOT_CANCEL, 'Cannot cancel completed booking');
  }

  // ... cancellation logic

  sendSuccessResponse(res, { message: 'Booking cancelled' });
}));

export default router;

