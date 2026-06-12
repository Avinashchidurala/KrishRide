// import Terms from '../pages/Terms';
// import Privacy from '../pages/Privacy';
// import FAQ from '../pages/FAQ';
// import Safety from '../pages/Safety';
import { Route } from 'react-router-dom';
import ProtectedLayout from '../components/layouts/ProtectedLayout';
import CustomerDashboard from '../pages/customer/Dashboard';
import BookRide from '../pages/customer/BookRide';
import SearchRides from '../pages/customer/SearchRides';
import MyBookings from '../pages/customer/MyBookings';
import BookingDetails from '../pages/customer/BookingDetails';
import Wallet from '../pages/customer/Wallet';
import Referrals from '../pages/customer/Referrals';
import CustomerProfile from '../pages/customer/Profile';
import BookingConfirmed from '../pages/customer/BookingConfirmed';
import Support from '../pages/customer/Support';
import SOS from '../pages/customer/SOS';
import Complaints from '../pages/customer/Complaints';
import SupportTickets from '../pages/customer/SupportTickets';
import CustomerAccount from '../pages/customer/CustomerAccount';
import FAQ from '../pages/customer/FAQ';
import Safety from '../pages/customer/Safety';
import Terms from '../pages/customer/Terms';
import Privacy from '../pages/customer/Privacy';

/**
 * Customer protected routes - requires authentication and customer role
 */
export const customerRoutes = (
  <>
    <Route
      path="/customer/dashboard"
      element={
        <ProtectedLayout>
          <CustomerDashboard />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/book-ride"
      element={
        <ProtectedLayout>
          <SearchRides />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/book-ride/:id"
      element={
        <ProtectedLayout>
          <BookRide />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/my-bookings"
      element={
        <ProtectedLayout>
          <MyBookings />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/booking/:id"
      element={
        <ProtectedLayout>
          <BookingDetails />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/payments"
      element={
        <ProtectedLayout>
          <MyBookings />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/wallet"
      element={
        <ProtectedLayout>
          <Wallet />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/referrals"
      element={
        <ProtectedLayout>
          <Referrals />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/profile"
      element={
        <ProtectedLayout>
          <CustomerProfile />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/booking-confirmed"
      element={
        <ProtectedLayout>
          <BookingConfirmed />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/support"
      element={
        <ProtectedLayout>
          <Support />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/sos"
      element={
        <ProtectedLayout>
          <SOS />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/complaints"
      element={
        <ProtectedLayout>
          <Complaints />
        </ProtectedLayout>
      }
    />
    <Route
      path="/customer/support-tickets"
      element={
        <ProtectedLayout>
          <SupportTickets />
        </ProtectedLayout>
      }
    />
      <Route
        path="/customer/account"
        element={
          <ProtectedLayout>
            <CustomerAccount/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/customer/faq"
        element={
          <ProtectedLayout>
            <FAQ/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/customer/safety"
        element={
          <ProtectedLayout>
            <Safety/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/customer/terms"
        element={
          <ProtectedLayout>
            <Terms/>
          </ProtectedLayout>
        }
      />
      <Route
        path="/customer/privacy"
        element={
          <ProtectedLayout>
            <Privacy/>
          </ProtectedLayout>
        }
      />
  </>
);