import { Route } from 'react-router-dom';
import ProtectedLayout from '../components/layouts/ProtectedLayout';
import Profile from '../pages/Profile';

/**
 * Common protected routes - accessible to all authenticated users regardless of role
 */
export const commonRoutes = (
  <>
    <Route
      path="/profile"
      element={
        <ProtectedLayout>
          <Profile />
        </ProtectedLayout>
      }
    />
  </>
);

