import { Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import HowItWorks from '../pages/HowItWorks';
import FAQ from '../pages/FAQ';
import Safety from '../pages/Safety';
import Cookies from '../pages/Cookies';
import HelpCenter from '../pages/HelpCenter';
import Cancellation from '../pages/Cancellation';
import FindRide from '../pages/FindRide';
import PostRide from '../pages/PostRide';
import ReferralTerms from '../pages/ReferralTerms';
import BookRidePublic from '../pages/BookRidePublic';
import Careers from '../pages/Careers';

/**
 * Public routes - accessible to all users (no authentication required)
 * Note: /book/:rideId requires authentication but is a public route that redirects to login if not authenticated
 */
export const publicRoutes = (
  <>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path='/careers' element={<Careers/>}/>
    <Route path="/contact" element={<Contact />} />
    <Route path="/help-center" element={<HelpCenter />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/how-it-works" element={<HowItWorks />} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/safety" element={<Safety />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="/cancellation" element={<Cancellation />} />
    <Route path="/find-ride" element={<FindRide />} />
    <Route path="/post-ride" element={<PostRide />} />
    <Route path="/referral-terms" element={<ReferralTerms />} />
    <Route path="/book/:rideId" element={<BookRidePublic />} />
  </>
);

