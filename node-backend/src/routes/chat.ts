import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Create or get chat session (for customers)
router.post('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Only customers can create chat sessions
    if (userRole !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create chat sessions' });
    }

    // Check if user already has an active chat session
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        customerId: userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingSession) {
      // Return existing session
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId: existingSession.id },
        include: {
          sender: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.json({
        session: existingSession,
        messages,
      });
    }

    // Create new chat session
    const session = await prisma.chatSession.create({
      data: {
        customerId: userId,
        status: 'active',
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      session,
      messages: [],
    });
  } catch (error: any) {
    console.error('Create chat session error:', error);
    res.status(500).json({ error: error.message || 'Failed to create chat session' });
  }
});

// Get chat session with messages
router.get('/sessions/:sessionId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Check authorization
    const isCustomer = session.customerId === userId;
    const isAdmin = userRole === 'admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this chat' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      session,
      messages,
    });
  } catch (error: any) {
    console.error('Get chat session error:', error);
    res.status(500).json({ error: error.message || 'Failed to get chat session' });
  }
});

// Get all active chat sessions (for admin)
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all chat sessions' });
    }

    const { status = 'active', page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: status !== 'all' ? { status: status as string } : {},
        skip,
        take: Number(limit),
        orderBy: { lastMessageAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mobile: true,
              email: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  first_name: true,
                  last_name: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      prisma.chatSession.count({
        where: status !== 'all' ? { status: status as string } : {},
      }),
    ]);

    res.json({
      sessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get chat sessions' });
  }
});

// Close chat session (admin only)
router.patch('/sessions/:sessionId/close', authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userRole = req.user!.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can close chat sessions' });
    }

    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'closed' },
    });

    res.json({ session });
  } catch (error: any) {
    console.error('Close chat session error:', error);
    res.status(500).json({ error: error.message || 'Failed to close chat session' });
  }
});

// Mark messages as read
router.patch('/sessions/:sessionId/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    await prisma.chatMessage.updateMany({
      where: {
        sessionId,
        senderId: { not: userId }, // Mark messages from others as read
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark messages as read' });
  }
});

export default router;

