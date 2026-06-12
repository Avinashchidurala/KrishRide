import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

/**
 * Public wrapper for BookRide page
 * If user is not logged in AND action === "BOOK", redirects to login with redirect parameter
 * This handles the case where user tries to access /book/:rideId without being logged in
 */
export default function BookRidePublic() {
  const navigate = useNavigate();
  const { rideId } = useParams<{ rideId: string }>();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!rideId) return;

    // If user is not logged in, redirect to login with redirect parameter
    if (!isAuthenticated) {
      navigate(`/login?redirect=/book/${rideId}`, { replace: true });
      return;
    }

    // If authenticated, redirect to the protected route
    // This ensures BookRide component gets the correct route parameter
    navigate(`/customer/book-ride/${rideId}`, { replace: true });
  }, [isAuthenticated, rideId, navigate]);

  // Don't render anything - redirects are handled in useEffect
  return null;
}

