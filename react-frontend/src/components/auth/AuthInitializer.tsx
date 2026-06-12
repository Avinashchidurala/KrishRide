import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { refreshAccessToken, fetchUser } from '../../features/auth/authSlice';

/**
 * Component to initialize authentication state on app load
 * Restores session from localStorage if tokens exist
 * Fetches user details from /me API
 */
export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedAccessToken = localStorage.getItem('accessToken');

    // If we have tokens but no user, fetch user details
    if ((storedAccessToken || storedRefreshToken) && !user) {
      // If we have access token, fetch user directly
      if (storedAccessToken) {
        dispatch(fetchUser());
      } else if (storedRefreshToken) {
        // Only refresh token available, refresh access token first
        dispatch(refreshAccessToken());
      }
    }
  }, []); // Only run once on mount

  // Handle token refresh and user fetch in sequence
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    // If refresh token was dispatched and we still don't have user, fetch user
    if (storedRefreshToken && !user && isAuthenticated) {
      dispatch(fetchUser());
    }
  }, [isAuthenticated, user, dispatch]);

  // Handle errors - clear invalid tokens
  useEffect(() => {
    if (error && !user) {
      // If we have an error and no user, tokens might be invalid
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (storedAccessToken && !storedRefreshToken) {
        // Only access token, clear it if fetch failed
        localStorage.removeItem('accessToken');
      } else if (storedRefreshToken) {
        // Try refreshing token if we have refresh token
        dispatch(refreshAccessToken());
      } else {
        // No tokens, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }, [error, user, dispatch]);

  return null; // This component doesn't render anything
}

