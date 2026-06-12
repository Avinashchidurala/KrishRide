import { Route } from 'react-router-dom';
import AdminLayout from '../components/layouts/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminKYC from '../pages/admin/KYC';
import AdminRides from '../pages/admin/Rides';
import AdminLiveRides from '../pages/admin/LiveRides';
import AdminBookings from '../pages/admin/Bookings';
import AdminComplaints from '../pages/admin/Complaints';
import AdminSOS from '../pages/admin/SOS';
import AdminRevenue from '../pages/admin/Revenue';
import AdminPayouts from '../pages/admin/Payouts';
import AdminSupportTickets from '../pages/admin/SupportTickets';
import AdminVehicles from '../pages/admin/Vehicles';
import AdminAnalytics from '../pages/admin/Analytics';
import AdminSettings from '../pages/admin/Settings';
import AdminUserDetails from '../pages/admin/UserDetails';
import AdminServiceStates from '../pages/admin/ServiceStates';
import Profile from '../pages/Profile';
import Wallet from '../pages/admin/Wallet';

/**
 * Admin protected routes - requires authentication and admin role
 */
export const adminRoutes = (
  <>
    <Route
      path="/admin/dashboard"
      element={
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/users"
      element={
        <AdminLayout>
          <AdminUsers />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/users/:id"
      element={
        <AdminLayout>
          <AdminUserDetails />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/kyc"
      element={
        <AdminLayout>
          <AdminKYC />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/rides"
      element={
        <AdminLayout>
          <AdminRides />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/rides/live"
      element={
        <AdminLayout>
          <AdminLiveRides />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/bookings"
      element={
        <AdminLayout>
          <AdminBookings />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/complaints"
      element={
        <AdminLayout>
          <AdminComplaints />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/sos"
      element={
        <AdminLayout>
          <AdminSOS />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/revenue"
      element={
        <AdminLayout>
          <AdminRevenue />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/payouts"
      element={
        <AdminLayout>
          <AdminPayouts />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/support-tickets"
      element={
        <AdminLayout>
          <AdminSupportTickets />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/vehicles"
      element={
        <AdminLayout>
          <AdminVehicles />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/analytics"
      element={
        <AdminLayout>
          <AdminAnalytics />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <AdminLayout>
          <AdminSettings />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/service-states"
      element={
        <AdminLayout>
          <AdminServiceStates />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/profile"
      element={
        <AdminLayout>
          <Profile />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/wallet"
      element={
        <AdminLayout>
          <Wallet/>
        </AdminLayout>
      }
    />
  </>
);

