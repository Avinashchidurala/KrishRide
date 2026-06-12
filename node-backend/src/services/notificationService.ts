import prisma from '../config/database';

export interface CreateNotificationParams {
  userId: string;
  type: 'booking' | 'ride' | 'payment' | 'sos' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.relatedId,
        metadata: params.metadata || {},
        read: false,
      },
    });
    return notification;
  } catch (error: any) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createAdminNotification(params: Omit<CreateNotificationParams, 'userId'>) {
  try {
    // Find all admin users
    const admins = await prisma.admin.findMany({
      include: {
        user: true,
      },
    });

    // Create notification for each admin
    const notifications = await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            relatedId: params.relatedId,
            metadata: params.metadata || {},
            read: false,
          },
        })
      )
    );

    return notifications;
  } catch (error: any) {
    console.error('Error creating admin notifications:', error);
    throw error;
  }
}

