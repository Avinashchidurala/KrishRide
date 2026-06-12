import { Route } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import VerifyOTP from '../pages/auth/VerifyOTP';
import DriverSignup from '../pages/driver/Signup';
import CustomerSignup from '../pages/customer/Signup';

/**
 * Authentication routes - for login, signup, and OTP verification
 */
export const authRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/verify-otp" element={<VerifyOTP />} />
    <Route path="/driver/signup" element={<DriverSignup />} />
    <Route path="/customer/signup" element={<CustomerSignup />} />
  </>
);

