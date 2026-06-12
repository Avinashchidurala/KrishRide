import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/userApi';
import { driverApi } from '../../services/driverApi';
import { fetchUser } from '../auth/authSlice';
import { getErrorMessage } from '../../utils/errorHandler';

interface UserState {
  profile: any | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  updating: false,
  error: null,
};

// Fetch user profile
export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { user: any } };
      const user = state.auth.user;
      
      // Use appropriate API based on user role
      if (user?.role === 'driver') {
        const response = await driverApi.getProfile();
        return response.driver || response;
      } else {
        const response = await userApi.getProfile();
        return response.profile || response;
      }
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to fetch profile');
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: any, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as { auth: { user: any } };
      const user = state.auth.user;
      
      // Use appropriate API based on user role
      if (user?.role === 'driver') {
        await driverApi.updateProfile(data);
      } else {
        await userApi.updateProfile(data);
      }
      
      // Refresh user data in auth slice to update name in dashboard/header
      dispatch(fetchUser());
      
      // Return the updated data
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to update profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getProfile cases
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateProfile cases
      .addCase(updateProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updating = false;
        // Update profile with new data
        if (state.profile) {
          state.profile = {
            ...state.profile,
            ...action.payload,
          };
        }
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfile, clearProfile, setError, clearError } = userSlice.actions;
export default userSlice.reducer;

