import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationApi, Notification } from '../../services/notificationApi';
import { adminApi } from '../../services/adminApi';
import { getErrorMessage } from '../../utils/errorHandler';

// Admin notification interface (for SOS alerts)
export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  userName: string;
  userMobile: string;
  userRole: string;
  latitude: number;
  longitude: number;
  locationUrl: string;
  bookingId: string | null;
  timestamp: string;
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  adminNotifications: AdminNotification[];
  unreadCount: number;
  adminUnreadCount: number;
  loading: boolean;
  adminLoading: boolean;
  markingAsRead: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: NotificationsState = {
  notifications: [],
  adminNotifications: [],
  unreadCount: 0,
  adminUnreadCount: 0,
  loading: false,
  adminLoading: false,
  markingAsRead: false,
  error: null,
  lastFetched: null,
};

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20, unreadOnly = false }: { page?: number; limit?: number; unreadOnly?: boolean }, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(page, limit, unreadOnly);
      return response;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to fetch notifications');
    }
  }
);

// Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount();
      return response.count;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to fetch unread count');
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue, dispatch }) => {
    try {
      await notificationApi.markAsRead(notificationId);
      // Refresh unread count after marking as read
      dispatch(fetchUnreadCount());
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to mark notification as read');
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await notificationApi.markAllAsRead();
      // Refresh notifications and unread count
      dispatch(fetchNotifications({}));
      dispatch(fetchUnreadCount());
      return true;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to mark all notifications as read');
    }
  }
);

// Admin notifications (SOS alerts)
export const fetchAdminNotifications = createAsyncThunk(
  'notifications/fetchAdminNotifications',
  async (unreadOnly?: boolean, { rejectWithValue }) => {
    try {
      const response = await adminApi.getNotifications(unreadOnly);
      return response;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to fetch admin notifications');
    }
  }
);

export const markAdminNotificationAsRead = createAsyncThunk(
  'notifications/markAdminNotificationAsRead',
  async (notificationId: string, { rejectWithValue, dispatch }) => {
    try {
      await adminApi.markNotificationRead(notificationId);
      // Refresh admin notifications after marking as read
      dispatch(fetchAdminNotifications());
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to mark admin notification as read');
    }
  }
);

export const markAllAdminNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAdminNotificationsAsRead',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await adminApi.markAllNotificationsRead();
      // Refresh admin notifications
      dispatch(fetchAdminNotifications());
      return true;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to mark all admin notifications as read');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
    },
    clearAdminNotifications: (state) => {
      state.adminNotifications = [];
      state.adminUnreadCount = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications cases
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchUnreadCount cases
      .addCase(fetchUnreadCount.pending, (state) => {
        // Don't set loading to true for unread count to avoid UI flicker
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        // Silently fail for unread count
        console.error('Failed to fetch unread count:', action.payload);
      })
      // markNotificationAsRead cases
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markingAsRead = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markingAsRead = false;
        // Update notification in state
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          // Decrement unread count if it was unread
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markingAsRead = false;
        state.error = action.payload as string;
      })
      // markAllNotificationsAsRead cases
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.markingAsRead = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.markingAsRead = false;
        // Mark all notifications as read in state
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.markingAsRead = false;
        state.error = action.payload as string;
      })
      // fetchAdminNotifications cases
      .addCase(fetchAdminNotifications.pending, (state) => {
        state.adminLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminNotifications.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminNotifications = action.payload.notifications || [];
        state.adminUnreadCount = action.payload.unreadCount || 0;
        state.error = null;
      })
      .addCase(fetchAdminNotifications.rejected, (state, action) => {
        state.adminLoading = false;
        state.error = action.payload as string;
      })
      // markAdminNotificationAsRead cases
      .addCase(markAdminNotificationAsRead.pending, (state) => {
        state.markingAsRead = true;
        state.error = null;
      })
      .addCase(markAdminNotificationAsRead.fulfilled, (state, action) => {
        state.markingAsRead = false;
        // Update notification in state
        const notification = state.adminNotifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          // Decrement unread count if it was unread
          state.adminUnreadCount = Math.max(0, state.adminUnreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markAdminNotificationAsRead.rejected, (state, action) => {
        state.markingAsRead = false;
        state.error = action.payload as string;
      })
      // markAllAdminNotificationsAsRead cases
      .addCase(markAllAdminNotificationsAsRead.pending, (state) => {
        state.markingAsRead = true;
        state.error = null;
      })
      .addCase(markAllAdminNotificationsAsRead.fulfilled, (state) => {
        state.markingAsRead = false;
        // Mark all admin notifications as read in state
        state.adminNotifications = state.adminNotifications.map(n => ({ ...n, read: true }));
        state.adminUnreadCount = 0;
        state.error = null;
      })
      .addCase(markAllAdminNotificationsAsRead.rejected, (state, action) => {
        state.markingAsRead = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearNotifications, clearAdminNotifications, clearError } = notificationsSlice.actions;
export default notificationsSlice.reducer;

