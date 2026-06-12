import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      userId,
    };

    if (unreadOnly === 'true') {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message || 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message || 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.json({ notification: updated });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark all notifications as read' });
  }
});

export default router;

