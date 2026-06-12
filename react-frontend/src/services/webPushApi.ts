import api from './api';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const webPushApi = {
  // Get VAPID public key
  getPublicKey: async (): Promise<string> => {
    const response = await api.get('/fcm/web-push/public-key');
    return response.data.publicKey;
  },

  // Subscribe to web push notifications
  subscribe: async (subscription: PushSubscription): Promise<void> => {
    await api.post('/fcm/web-push/subscribe', { subscription });
  },

  // Unsubscribe from web push notifications
  unsubscribe: async (): Promise<void> => {
    await api.delete('/fcm/web-push/unsubscribe');
  },
};

