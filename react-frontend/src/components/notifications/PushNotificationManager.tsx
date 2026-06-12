import { useEffect, useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { initializeWebPush, requestNotificationPermission } from '../../utils/webPush';

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const handleEnableNotifications = async () => {
    try {
      // Request permission
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        // Initialize web push
        const success = await initializeWebPush();
        if (success) {
          setIsSubscribed(true);
          setSnackbar({
            open: true,
            message: 'Push notifications enabled successfully!',
            severity: 'success',
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to enable push notifications. Please try again.',
            severity: 'error',
          });
        }
      } else if (newPermission === 'denied') {
        setSnackbar({
          open: true,
          message: 'Notification permission denied. Please enable it in your browser settings.',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while enabling notifications.',
        severity: 'error',
      });
    }
  };

  if (permission === 'granted' && isSubscribed) {
    return null; // Don't show button if already subscribed
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleEnableNotifications}
        disabled={permission === 'denied'}
        sx={{ textTransform: 'none' }}
      >
        {permission === 'denied' ? 'Notifications Blocked' : 'Enable Push Notifications'}
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

