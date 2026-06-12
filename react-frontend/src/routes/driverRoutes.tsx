import { Route } from 'react-router-dom';
import ProtectedLayout from '../components/layouts/ProtectedLayout';
import DriverDashboard from '../pages/driver/Dashboard';
import DriverKYC from '../pages/driver/KYC';
import PublishRide from '../pages/driver/PublishRide';
import DriverProfile from '../pages/driver/Profile';
import DriverVehicles from '../pages/driver/Vehicles';
import AddVehicle from '../pages/driver/AddVehicle';
import DriverMyBookings from '../pages/driver/MyBookings';
import DriverWallet from '../pages/driver/Wallet';
import DriverReferrals from '../pages/driver/Referrals';
import DriverMyRides from '../pages/driver/MyRides';
import ActiveRide from '../pages/driver/ActiveRide';
import Support from '../pages/driver/Support';
import SOS from '../pages/driver/SOS';
import Complaints from '../pages/driver/Complaints';
import SupportTickets from '../pages/driver/SupportTickets';
import DriverAccount from '../pages/driver/DriverAccount';
import FAQ from '../pages/driver/FAQ';
import Safety from '../pages/driver/Safety';
import Terms from '../pages/driver/Terms';
import Privacy from '../pages/driver/Privacy';  
/**
 * Driver protected routes - requires authentication and driver role
 */
export const driverRoutes = (
  <>
    <Route
      path="/driver/dashboard"
      element={
        <ProtectedLayout>
          <DriverDashboard />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/kyc"
      element={
        <ProtectedLayout>
          <DriverKYC />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/publish-ride"
      element={
        <ProtectedLayout>
          <PublishRide />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/profile"
      element={
        <ProtectedLayout>
          <DriverProfile />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/vehicles"
      element={
        <ProtectedLayout>
          <DriverVehicles />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/vehicles/add"
      element={
        <ProtectedLayout>
          <AddVehicle />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/vehicles/edit/:vehicleId"
      element={
        <ProtectedLayout>
          <AddVehicle />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/my-bookings"
      element={
        <ProtectedLayout>
          <DriverMyBookings />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/my-rides"
      element={
        <ProtectedLayout>
          <DriverMyRides />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/active-ride/:rideId"
      element={
        <ProtectedLayout>
          <ActiveRide />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/wallet"
      element={
        <ProtectedLayout>
          <DriverWallet />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/referrals"
      element={
        <ProtectedLayout>
          <DriverReferrals />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/support"
      element={
        <ProtectedLayout>
          <Support />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/sos"
      element={
        <ProtectedLayout>
          <SOS />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/complaints"
      element={
        <ProtectedLayout>
          <Complaints />
        </ProtectedLayout>
      }
    />
    <Route
      path="/driver/support-tickets"
      element={
        <ProtectedLayout>
          <SupportTickets />
        </ProtectedLayout>
      }
    />
    <Route
  path="/driver/account"
  element={
    <ProtectedLayout>
      <DriverAccount />
    </ProtectedLayout>
  }
/>
<Route
        path="/driver/faq"
        element={
          <ProtectedLayout>
            <FAQ/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/safety"
        element={
          <ProtectedLayout>
            <Safety/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/terms"
        element={
          <ProtectedLayout>
            <Terms/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/privacy"
        element={
          <ProtectedLayout>
            <Privacy/>
          </ProtectedLayout>
        }
      />
  </>
);

