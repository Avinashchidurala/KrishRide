import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'ride' | 'payment' | 'sos' | 'system';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationApi = {
  getNotifications: async (page = 1, limit = 20, unreadOnly = false): Promise<NotificationResponse> => {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly: unreadOnly.toString() },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<{ notification: Notification }> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};

