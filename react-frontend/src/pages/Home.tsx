import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { useAppSelector } from '../app/hooks';
import Header from '../components/layouts/Header';
import Footer from '../components/layouts/Footer';
import { DriversSection } from './HomePages/drivers-section';
import { SafetySection } from './HomePages/safety-section';
import { TestimonialsSection } from './HomePages/testimonials-section';
import { WhyRideSection } from './HomePages/WhyRideSection';
import images from '../assets/images'

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If user is authenticated, redirect to their dashboard based on role
    if (isAuthenticated && user) {
      if (user.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else if (user.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Don't render home content if user is authenticated
  if (isAuthenticated && user) {
    return null;
  }
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      <Header />
      <Box sx={{ flex: 1 }}>
        {/* Hero Section */}
          <Box
                sx={{
                  position: 'relative',
                  backgroundImage: {
                    // xs: 'none',
                    xs: `url(${images.Hero})`,
                  },
                  // bgcolor:{xs:'primary.main',md:'none'},
                  minHeight: { xs: 'auto', md: '60vh' },
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  py: { xs: 3, md: 8 },
                }}
              >
                {/* Overlay (desktop only) */}
                <Box
                  sx={{
                    display: { xs: 'block', md: 'block' },
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: 'none',
                    bgcolor: 'rgba(0, 0, 0, 0.65)',
                  }}
                />
                  <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
                      <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto',color:'white'}}>
                        <Typography
                          variant="h1"
                          component="h1"
                          fontWeight="bold"
                          sx={{
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                            mb: 3,
                            lineHeight: 1.2,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          Safe Ride Sharing for Everyone
                        </Typography>
                        <Typography
                          variant="h5"
                          component="p"
                          sx={{
                            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                            mb: 2,
                            opacity: 0.95,
                            lineHeight: 1.6,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          Connect with verified drivers going your way.
                        </Typography>
                        <Typography
                          variant="h6"
                          component="p"
                          sx={{
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' },
                            mb: 5,
                            opacity: 0.9,
                            lineHeight: 1.6,
                            fontWeight: 400,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          Affordable rides. Trusted drivers. Secure payments.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button
                            component={Link}
                            to="/find-ride"
                            variant="contained"
                            size="large"
                            sx={{
                          background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
                              color: 'primary.contrastText',
                              px: { xs: 4, md: 6 },
                              py: { xs: 1.5, md: 2 },
                              fontSize: { xs: '1rem', md: '1.125rem' },
                              fontWeight: 600,
                              borderRadius: '20px',
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: 'grey.100',
                              },
                            }}
                          >
                            Find a Ride
                          </Button>
                          <Button
                            component={Link}
                            to="/post-ride"
                            variant="outlined"
                            size="large"
                            sx={{
                              borderColor: 'white',
                              color: 'white',
                              px: { xs: 4, md: 6 },
                              py: { xs: 1.5, md: 2 },
                              fontSize: { xs: '1rem', md: '1.125rem' },
                              fontWeight: 600,
                              borderRadius: '8px',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: 'white',
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                          >
                            Post a Ride
                          </Button>
                        </Box>
                      </Box>
                    </Container>
          </Box>        
      </Box>
      <WhyRideSection/>
      <SafetySection/>
      <DriversSection/>
      <TestimonialsSection/>
      <Footer />
    </Box>
  );
};

export default Home;
