/**
 * Auth Service - Centralized auth state management
 * Allows API interceptors to trigger logout without circular dependencies
 */

import { AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';

class AuthService {
  private dispatch: AppDispatch | null = null;

  setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  handleUnauthorized() {
    console.log('🚫 Handling unauthorized access - logging out');
    if (this.dispatch) {
      this.dispatch(logout());
    } else {
      console.warn('⚠️ AuthService dispatch not set - cannot logout');
    }
  }
}

export const authService = new AuthService();

