import { Route } from 'react-router-dom';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentFailure from '../pages/PaymentFailure';

/**
 * Payment callback routes - handled by payment gateway redirects
 * These routes don't require authentication as they're accessed via payment gateway callbacks
 */
export const paymentRoutes = (
  <>
    <Route path="/payment/success" element={<PaymentSuccess />} />
    <Route path="/payment/failure" element={<PaymentFailure />} />
    <Route path="/payment/cancel" element={<PaymentFailure />} />
  </>
);

