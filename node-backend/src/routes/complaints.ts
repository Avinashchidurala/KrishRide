import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Create Complaint
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, subject, description } = req.body;
    const userId = req.user!.userId;

    // Input validation
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (subject.trim().length > 255) {
      return res.status(400).json({ error: 'Subject must be less than 255 characters' });
    }

    // Validate booking if provided
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
        },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if user owns the booking (customer or driver)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customer: true,
          driver: true,
        },
      });

      // Get ride for driver check
      const ride = await prisma.ride.findUnique({
        where: { id: booking.rideId },
      });

      const isAuthorized = 
        (user?.customer && booking.customerId === user.customer.id) ||
        (user?.driver && ride && ride.driverId === user.driver.id) ||
        user?.role === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to create complaint for this booking' });
      }
    }

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        userId,
        bookingId: bookingId || null,
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      complaint,
      message: 'Complaint submitted successfully. Our team will review it shortly.',
    });
  } catch (error: any) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: error.message || 'Failed to create complaint' });
  }
});

// Get User's Complaints
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);

    res.json({
      complaints,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: error.message || 'Failed to get complaints' });
  }
});

// Get Complaint Details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check authorization
    if (complaint.userId !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this complaint' });
    }

    res.json({ complaint });
  } catch (error: any) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: error.message || 'Failed to get complaint' });
  }
});

export default router;

