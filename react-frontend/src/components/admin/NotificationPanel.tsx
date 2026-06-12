import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Badge,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  AdminNotification,
} from '../../features/notifications/notificationsSlice';

interface NotificationPanelProps {
  onNotificationClick?: (notification: AdminNotification) => void;
}

export default function NotificationPanel({ onNotificationClick }: NotificationPanelProps) {
  const dispatch = useAppDispatch();
  const { adminNotifications, adminUnreadCount, adminLoading, markingAsRead } = useAppSelector(
    (state) => state.notifications
  );
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll for notifications every 3 seconds
  useEffect(() => {
    dispatch(fetchAdminNotifications());

    const interval = setInterval(() => {
      dispatch(fetchAdminNotifications());
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Don't close if clicking on the notification bell
        if (!target.closest('button[aria-label*="notification"]') && !target.closest('.MuiBadge-root')) {
          setPanelOpen(false);
        }
      }
    };

    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [panelOpen]);

  const handleNotificationClick = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setDialogOpen(true);
    
    // Mark as read if unread
    if (!notification.read) {
      dispatch(markAdminNotificationAsRead(notification.id));
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAdminNotificationsAsRead());
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const unreadNotifications = adminNotifications.filter(n => !n.read);

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        color="inherit"
        onClick={() => setPanelOpen(!panelOpen)}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={adminUnreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification Panel */}
      {panelOpen && (
        <Paper
          ref={panelRef}
          sx={{
            position: 'absolute',
            top: 56,
            right: 16,
            width: 400,
            maxHeight: 600,
            zIndex: 1300,
            boxShadow: 4,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Notifications {adminUnreadCount > 0 && `(${adminUnreadCount})`}
            </Typography>
            <Box>
              {adminUnreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAsRead}
                  sx={{ mr: 1 }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton size="small" onClick={() => setPanelOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
            {adminLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : adminNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {adminNotifications.slice(0, 10).map((notification) => (
                  <ListItem
                    key={notification.id}
                    disablePadding
                    sx={{
                      bgcolor: notification.read ? 'background.paper' : 'action.hover',
                      borderLeft: notification.read ? 'none' : '4px solid',
                      borderColor: 'error.main',
                    }}
                  >
                    <ListItemButton onClick={() => handleNotificationClick(notification)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon color="error" sx={{ fontSize: 20 }} />
                            <Typography
                              variant="subtitle2"
                              fontWeight={notification.read ? 'normal' : 'bold'}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Chip
                                label="New"
                                size="small"
                                color="error"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {formatTime(notification.timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {adminNotifications.length > 10 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Button size="small" onClick={() => window.location.href = '/admin/sos'}>
                View All SOS Alerts
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Notification Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography variant="h6">{selectedNotification?.title}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                {selectedNotification.message}
              </Alert>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  User Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {selectedNotification.userName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {selectedNotification.userMobile}
                  </Typography>
                </Box>
                <Chip
                  label={selectedNotification.userRole}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {typeof selectedNotification.latitude === 'number' 
                      ? selectedNotification.latitude.toFixed(6) 
                      : selectedNotification.latitude}, {typeof selectedNotification.longitude === 'number'
                      ? selectedNotification.longitude.toFixed(6)
                      : selectedNotification.longitude}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  href={selectedNotification.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<LocationIcon />}
                  sx={{ mt: 1 }}
                >
                  View on Google Maps
                </Button>
              </Box>

              {selectedNotification.bookingId && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Booking ID
                    </Typography>
                    <Typography variant="body2">{selectedNotification.bookingId}</Typography>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedNotification.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {selectedNotification?.bookingId && (
            <Button
              variant="contained"
              onClick={() => {
                window.location.href = `/admin/bookings?bookingId=${selectedNotification.bookingId}`;
              }}
            >
              View Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

