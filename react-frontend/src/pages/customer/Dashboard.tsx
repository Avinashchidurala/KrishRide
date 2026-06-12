import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  CircularProgress,
  Collapse,
  IconButton,
  Avatar,
  Divider,
  LinearProgress,
  Fab,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Assignment as AssignmentIcon,
  AccessTime as TimeIcon,
  CardGiftcard as GiftIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AccountBalanceWallet as WalletIcon,
  Emergency as EmergencyIcon,
} from '@mui/icons-material';
import { bookingsApi } from '../../services/bookingsApi';
import { useAppSelector } from '../../app/hooks';
import StatsCard from '../../components/admin/StatsCard';
import { getCityName } from '../../utils/locationHelpers';
import { ridesApi } from '../../services/ridesApi';

interface Booking {
  id: string;
  status: string;
  ride: {
    start_location: string;
    end_location: string;
    scheduled_time: string;
  };
  createdAt: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  const [showReferralInfo, setShowReferralInfo] = useState(false);

  const [StartedRide, setStartedRide] = useState<Boolean>(false)

  useEffect(() => {
    // Check both isAuthenticated and user to ensure state is properly loaded
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const bookingsResponse = await bookingsApi.getMyBookings();
      // Handle different response structures
      const bookings = bookingsResponse.bookings || bookingsResponse.data?.bookings || (Array.isArray(bookingsResponse) ? bookingsResponse : []);
      if (Array.isArray(bookings) && bookings.length > 0) {
        setStats({
          totalBookings: bookings.length,
          upcomingBookings: bookings.filter((b: any) => ['pending', 'confirmed'].includes(b.status)).length,
          completedBookings: bookings.filter((b: any) => b.status === 'completed').length,
        });
        // Only show confirmed bookings in dashboard
        const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
        setRecentBookings(confirmedBookings.slice(0, 5) as Booking[]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

    let customerRide
  
  useEffect(() => {
    console.log(user?.customer?.id)
    const fetchStartedRide = async () => {
  
      if (user?.role === "customer") {
        customerRide = await getCustomerStartedRide(user?.customer?.id)
        console.log("Started ride for customer:", customerRide)
        if (customerRide?.startedride.length > 0) {
          setStartedRide(true)
        }
      }
    }
  
    fetchStartedRide()
  }, [])
  
  
    const getCustomerStartedRide = async (id: string) => {
      let Ride = await ridesApi.getStartedRideForCustomer(id)
      return Ride
    }
  return (
    // <></>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Welcome Section */}
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 50%, #E55A2B 100%)',
            color: 'white',
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Welcome back, {user.firstName || user.first_name || 'User'}!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Manage your rides and bookings
          </Typography>
        </Paper>

        {/* Quick Stats */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatsCard
                icon={AssignmentIcon}
                title="Total Bookings"
                value={stats.totalBookings.toString()}
                subtitle="All your bookings"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatsCard
                icon={CalendarIcon}
                title="Upcoming"
                value={stats.upcomingBookings.toString()}
                subtitle="Scheduled rides"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatsCard
                icon={CarIcon}
                title="Completed"
                value={stats.completedBookings.toString()}
                subtitle="Finished rides"
              />
            </Grid>
          </Grid>
        )}

        {/* Recent Bookings */}
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Confirmed Bookings
              </Typography>
              {recentBookings.length > 0 && (
                <Button
                  variant="text"
                  onClick={() => navigate('/customer/my-bookings')}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              )}
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : recentBookings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No confirmed bookings
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your confirmed bookings will appear here
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/customer/book-ride')}
                  sx={{ mt: 2, textTransform: 'none' }}
                >
                  Find a Ride →
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    elevation={1}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        elevation: 4,
                        borderColor: 'primary.main',
                        borderWidth: 1,
                        borderStyle: 'solid',
                      },
                    }}
                    onClick={() => navigate(`/customer/booking/${booking.id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="body1" fontWeight="medium">
                              {getCityName((booking as any).pickup_location || booking.ride?.start_location)} → {getCityName((booking as any).drop_location || booking.ride?.end_location)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 3, ml: 4, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {booking.ride?.scheduled_time ? formatDate(booking.ride.scheduled_time) : 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {booking.ride?.scheduled_time ? formatTime(booking.ride.scheduled_time) : 'N/A'}
                              </Typography>
                            </Box>
                            {booking.totalFare && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="600" color="primary.main">
                                  ₹{booking.totalFare}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                          sx={{ ml: 2, textTransform: 'capitalize' }}
                        />
                      </Box>
                      {(booking.status === 'confirmed' ||
                        booking.status === 'started' ||
                        booking.status === 'completed') && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                mt: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'warning.main',
                                backgroundColor: 'warning.lighter',
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mb: 1.5, color: 'warning.dark' }}
                              >
                                Verification Codes
                              </Typography>

                              <Grid container spacing={2}>
                                {/* Start OTP */}
                                {booking.pickup_otp && (
                                  <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" fontWeight={500}>
                                        Start OTP:
                                      </Typography>
                                      <Typography
                                        variant="h6"
                                        sx={{
                                          fontWeight: 700,
                                          color: 'warning.dark',
                                          fontFamily: 'monospace',
                                          letterSpacing: 2,
                                        }}
                                      >
                                        {booking.pickup_otp}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" fontWeight={600}>
                                       Share this OTP with the driver when boarding
                                    </Typography>
                                  </Grid>
                                )}

                                {/* End PIN */}
                                {booking.drop_pin && (
                                  <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" fontWeight={500}>
                                        End PIN:
                                      </Typography>
                                      <Typography
                                        variant="h6"
                                        sx={{
                                          fontWeight: 700,
                                          color: 'warning.dark',
                                          fontFamily: 'monospace',
                                          letterSpacing: 2,
                                        }}
                                      >
                                        {booking.drop_pin}
                                      </Typography>
                                      
                                    </Box>
                                    <Typography variant="caption" fontWeight={600}>
                                       Share this PIN with the driver at destination
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Paper>
                       )}

                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Referral Banner */}
        <Card
          elevation={2}
          sx={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Refer Now and Earn
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }} gutterBottom>
                  Get ₹100 Hush Cash for each successful referral
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Valid for 30 days after your referee completes their first ride
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                  startIcon={<GiftIcon />}
                  onClick={() => navigate('/customer/referrals')}
                >
                  Refer Now
                </Button>
                <IconButton
                  sx={{ color: 'white' }}
                  onClick={() => setShowReferralInfo(!showReferralInfo)}
                >
                  {showReferralInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>

            <Collapse in={showReferralInfo}>
              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Referral Bonus Terms & Conditions:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 1 } }}>
                  <li>Earn ₹100 for each successful referral</li>
                  <li>Referred customer must register using your referral code</li>
                  <li>Bonus credited after referee completes their first valid ride</li>
                  <li>Bonus is non-transferable and cannot be redeemed for cash</li>
                  <li>Valid for 30 days from the time credited</li>
                  <li>Company reserves the right to modify or withdraw the program</li>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>

      {/* Floating SOS Button */}
      {StartedRide && <Fab
        color="error"
        aria-label="Emergency SOS"
        onClick={() => navigate('/customer/sos')}
        sx={{
          position: 'fixed',
          bottom: {xs:74,md:24},
          right: 24,
          width: 64,
          height: 64,
          boxShadow: 6,
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: 8,
          },
          transition: 'all 0.3s',
          zIndex: 1000,
        }}
      >
        <EmergencyIcon sx={{ fontSize: 32 }} />
      </Fab>}
    </Container>
  );
}

