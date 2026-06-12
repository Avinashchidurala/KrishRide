import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { restoreAuth } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

/**
 * AuthInitializer - Loads saved authentication state on app startup
 * This component should be rendered once in the app tree
 */
export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  
  // Register dispatch with auth service so API interceptors can trigger logout
  useEffect(() => {
    authService.setDispatch(dispatch);
  }, [dispatch]);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        console.log('🔄 Loading saved auth state...');

        // Load user and token from AsyncStorage
        const [userJson, token] = await AsyncStorage.multiGet(['user', 'token']);

        console.log('📱 AsyncStorage data:', { userJson: userJson[1], token: token[1] });

        const user = userJson[1] ? JSON.parse(userJson[1]) : null;
        const savedToken = token[1];

        if (user && savedToken) {
          console.log('✅ Restored auth state for user:', user.mobile, 'role:', user.role);
          dispatch(restoreAuth({ user, token: savedToken }));
        } else {
          console.log('ℹ️ No saved auth state found');
          dispatch(restoreAuth(null));
        }
      } catch (error) {
        console.error('❌ Error loading auth state:', error);
        // Clear potentially corrupted data
        await AsyncStorage.multiRemove(['user', 'token']);
        dispatch(restoreAuth(null));
      }
    };

    loadAuthState();
  }, [dispatch]);

  return <>{children}</>;
};

