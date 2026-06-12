import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Create Support Ticket
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, rideId, subject, description, priority } = req.body;
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

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Validate booking/ride if provided
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customer: true,
          driver: true,
        },
      });

      const isAuthorized = 
        (user?.customer && booking.customerId === user.customer.id) ||
        (user?.driver && booking.ride?.driverId === user.driver.id) ||
        user?.role === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to create ticket for this booking' });
      }
    }

    if (rideId) {
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
      });

      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          driver: true,
        },
      });

      const isAuthorized = 
        (user?.driver && ride.driverId === user.driver.id) ||
        user?.role === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to create ticket for this ride' });
      }
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        bookingId: bookingId || null,
        rideId: rideId || null,
        subject: subject.trim(),
        description: description.trim(),
        priority: ticketPriority,
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
      ticket,
      message: 'Support ticket created successfully. Ticket ID: ' + ticket.id,
    });
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: error.message || 'Failed to create support ticket' });
  }
});

// Get User's Support Tickets
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20, status, priority } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
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
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: error.message || 'Failed to get support tickets' });
  }
});

// Get Support Ticket Details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const ticket = await prisma.supportTicket.findUnique({
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
                        mobile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    // Check authorization
    if (ticket.userId !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this ticket' });
    }

    res.json({ ticket });
  } catch (error: any) {
    console.error('Get support ticket error:', error);
    res.status(500).json({ error: error.message || 'Failed to get support ticket' });
  }
});

export default router;

