import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';
import { getErrorMessage } from '../../utils/errorHandler';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Only accessToken and refreshToken are stored in localStorage
// User details are fetched from /me API endpoint
// Refresh token stored in localStorage (persists across browser sessions)
// Access token stored in localStorage (persists across browser sessions)
const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { mobile: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials.mobile);
      return response;
    } catch (error: any) {
     let message = 'Login failed';
      if (error?.response?.data?.error) {
        const err = error.response.data.error;
        message = err.message || JSON.stringify(err);
      } else if (error?.message) {
        message = error.message;
      }
      return rejectWithValue(message);
    
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (data: { mobile: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyOTP(data.mobile, data.otp);
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      // Don't store user in localStorage, will fetch from /me API
      return response;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'OTP verification failed');
    }
  }
);

// Fetch current user details from /me API
export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getMe();
      return response;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to fetch user details');
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken || localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(refreshToken);
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Token refresh failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const refreshToken = state.auth.refreshToken || localStorage.getItem('refreshToken'); // Changed to localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } 
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
         const errorMessage = action.payload as string || 'Failed to send OTP';

       if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('not registered')) {
       state.error = 'This number is not registered. Please sign up first.';
      } else if (errorMessage.toLowerCase().includes('invalid mobile')) {
       state.error = 'Please enter a valid 10-digit mobile number.';
      } else {
      // Show any other backend message directly
       state.error = errorMessage;
      }

      })
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both direct user object and nested structure
        const payload = action.payload;
        state.user = payload?.user || payload?.data?.user || null;
        state.accessToken = payload?.accessToken || payload?.data?.accessToken || null;
        state.refreshToken = payload?.refreshToken || payload?.data?.refreshToken || null;
        state.isAuthenticated = !!(state.accessToken || state.refreshToken);
        state.error = null;
        
        // If user object is missing but we have tokens, we'll fetch it via /me API
        // This is handled by AuthInitializer component
      })
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // If fetching user fails, clear auth state
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(refreshAccessToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true; // Ensure authenticated state is set
        state.error = null;
        // Update localStorage with new access token
        if (action.payload.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken);
        }
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // If refresh fails, logout user
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

