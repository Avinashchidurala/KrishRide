import { Routes } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { authRoutes } from './authRoutes';
import { commonRoutes } from './commonRoutes';
import { customerRoutes } from './customerRoutes';
import { driverRoutes } from './driverRoutes';
import { adminRoutes } from './adminRoutes';
import { paymentRoutes } from './paymentRoutes';

/**
 * Main routes configuration
 * Combines all route groups into a single Routes component
 */
export function AppRoutes() {
  return (
    <Routes>
      {publicRoutes}
      {authRoutes}
      {commonRoutes}
      {customerRoutes}
      {driverRoutes}
      {adminRoutes}
      {paymentRoutes}
    </Routes>
  );
}

