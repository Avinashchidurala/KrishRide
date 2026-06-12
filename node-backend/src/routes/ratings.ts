import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Submit Rating and Review (after completed ride)
router.post('/', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const { bookingId, rating, review } = req.body;

    // Input validation
    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'Valid booking ID is required' });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    if (review !== undefined && typeof review !== 'string') {
      return res.status(400).json({ error: 'Review must be a string' });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get booking with ride and driver details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          include: {
            driver: true,
          },
        },
        rating: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customerId !== customer.id) {
      return res.status(403).json({ error: 'Not authorized to rate this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed bookings' });
    }

    // Check if booking already has a rating
    if (booking.rating) {
      return res.status(400).json({ error: 'This booking has already been rated' });
    }

    const driver = booking.ride.driver;

    // Use transaction to update rating and driver stats atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create rating record
      const newRating = await tx.rating.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          driverId: driver.id,
          rating: Math.round(rating),
          review: review || null,
        },
      });

      // Calculate new average rating for driver
      const currentTotalRatings = driver.total_ratings || 0;
      const currentAverageRating = Number(driver.average_rating) || 0;
      const newTotalRatings = currentTotalRatings + 1;
      const newAverageRating = 
        (currentAverageRating * currentTotalRatings + rating) / newTotalRatings;

      // Update driver's rating stats
      const updatedDriver = await tx.driver.update({
        where: { id: driver.id },
        data: {
          average_rating: newAverageRating,
          total_ratings: newTotalRatings,
        },
      });

      return { rating: newRating, driver: updatedDriver };
    });

    res.json({
      message: 'Rating submitted successfully',
      rating: {
        id: result.rating.id,
        bookingId: booking.id,
        rating: result.rating.rating,
        review: result.rating.review,
        driverId: driver.id,
        driverAverageRating: Number(result.driver.average_rating).toFixed(2),
        totalRatings: result.driver.total_ratings,
      },
    });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit rating' });
  }
});

// Get Driver Ratings
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        average_rating: true,
        total_ratings: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driverId: driver.id,
      driverName: `${driver.user.first_name} ${driver.user.last_name}`,
      averageRating: Number(driver.average_rating) || 0,
      totalRatings: driver.total_ratings || 0,
    });
  } catch (error: any) {
    console.error('Get driver ratings error:', error);
    res.status(500).json({ error: error.message || 'Failed to get driver ratings' });
  }
});

// Get User's Ratings (ratings given by customer)
router.get('/my-ratings', authenticate, authorize('customer'), async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all ratings given by this customer
    const ratings = await prisma.rating.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        booking: {
          include: {
            ride: {
              include: {
                driver: {
                  include: {
                    user: {
                      select: {
                        first_name: true,
                        last_name: true,
                        profile_photo_url: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    res.json({
      count: ratings.length,
      ratings: ratings.map(r => ({
        ratingId: r.id,
        bookingId: r.booking.id,
        bookingNumber: r.booking.booking_number,
        driverName: `${r.booking.ride.driver.user.first_name} ${r.booking.ride.driver.user.last_name}`,
        driverPhoto: r.booking.ride.driver.user.profile_photo_url,
        rideRoute: `${r.booking.ride.start_location} → ${r.booking.ride.end_location}`,
        rating: r.rating,
        review: r.review,
        ratedAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get my ratings error:', error);
    res.status(500).json({ error: error.message || 'Failed to get ratings' });
  }
});

// Get Driver Ratings with reviews
router.get('/driver/:driverId/reviews', async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        average_rating: true,
        total_ratings: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get recent reviews
    const reviews = await prisma.rating.findMany({
      where: {
        driverId: driverId,
      },
      include: {
        booking: {
          select: {
            booking_number: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.json({
      driver: {
        id: driver.id,
        name: `${driver.user.first_name} ${driver.user.last_name}`,
        photo: driver.user.profile_photo_url,
        averageRating: Number(driver.average_rating).toFixed(2),
        totalRatings: driver.total_ratings || 0,
      },
      reviews: reviews.map(r => ({
        rating: r.rating,
        review: r.review,
        ratedAt: r.createdAt,
        bookingNumber: r.booking.booking_number,
      })),
    });
  } catch (error: any) {
    console.error('Get driver reviews error:', error);
    res.status(500).json({ error: error.message || 'Failed to get driver reviews' });
  }
});

// Get Driver Ratings (simplified version)
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        average_rating: true,
        total_ratings: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driverId: driver.id,
      driverName: `${driver.user.first_name} ${driver.user.last_name}`,
      averageRating: Number(driver.average_rating || 0).toFixed(2),
      totalRatings: driver.total_ratings || 0,
    });
  } catch (error: any) {
    console.error('Get driver ratings error:', error);
    res.status(500).json({ error: error.message || 'Failed to get driver ratings' });
  }
});

export default router;

