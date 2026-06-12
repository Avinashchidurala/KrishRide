import { webPushApi, PushSubscription } from '../services/webPushApi';

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Register Service Worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription | null> => {
  try {
    // Convert VAPID public key from base64 URL to Uint8Array
    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const keyArray = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyArray.buffer as ArrayBuffer,
    });

    // Convert subscription to format expected by backend
    const subscriptionData: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
        ),
        auth: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
        ),
      },
    };

    // Send subscription to backend
    await webPushApi.subscribe(subscriptionData);

    console.log('Subscribed to push notifications');
    return subscriptionData;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (
  registration: ServiceWorkerRegistration
): Promise<void> => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await webPushApi.unsubscribe();
      console.log('Unsubscribed from push notifications');
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
  }
};

/**
 * Initialize web push notifications
 * Note: This should only be called after user interaction (e.g., button click)
 * Do not call this automatically on page load as browsers block permission requests
 * outside of user gesture handlers.
 */
export const initializeWebPush = async (): Promise<boolean> => {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push is not supported in this browser');
      return false;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      // Permission already granted, proceed with subscription
    } else if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    } else {
      // Permission not yet requested - don't request automatically
      // Return false and let the caller request permission via user interaction
      console.log('Notification permission not yet requested. Call requestNotificationPermission() after user interaction.');
      return false;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return false;
    }

    // Get VAPID public key
    const publicKey = await webPushApi.getPublicKey();
    if (!publicKey) {
      console.warn('VAPID public key not available');
      return false;
    }

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      return true;
    }

    // Subscribe to push notifications
    const subscription = await subscribeToPush(registration, publicKey);
    return subscription !== null;
  } catch (error) {
    console.error('Failed to initialize web push:', error);
    return false;
  }
};

