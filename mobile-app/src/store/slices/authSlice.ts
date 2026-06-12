import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  mobile: string;
  email?: string;
  role: 'customer' | 'driver' | 'admin';
  profileCompleted?: boolean;
  isPhoneVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading until we check AsyncStorage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Persist user to AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(action.payload));
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      // Token is already saved by authApi, but we update state
    },
    setAuthData: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Persist to AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(action.payload.user));
      AsyncStorage.setItem('token', action.payload.token);
    },
    restoreAuth: (state, action: PayloadAction<{ user: User; token: string } | null>) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      }
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Clear AsyncStorage
      AsyncStorage.multiRemove(['user', 'token']);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, setToken, setAuthData, restoreAuth, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
