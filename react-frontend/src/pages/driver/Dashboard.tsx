import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Fab,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  CurrencyRupee as RupeeIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Event as DateIcon,
  Cancel as CancelIcon,
  Emergency as EmergencyIcon,
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { driverApi } from '../../services/driverApi';
import { useAppSelector } from '../../app/hooks';
import StatsCard from '../../components/admin/StatsCard';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycExpiresAt, setKycExpiresAt] = useState<string | null>(null);
  const [isKycExpired, setIsKycExpired] = useState(false);
  const [stats, setStats] = useState({
    rides: { total: 0, active: 0, completed: 0 },
    bookings: { total: 0, upcoming: 0, completed: 0 },
    earnings: { total: 0, platformFee: 0, currency: 'INR' },
    rating: { average: 0, total: 0 },
  });
  const [publishedRides, setPublishedRides] = useState<any[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [StartedRide, setStartedRide] = useState<Boolean>(false)
const now = new Date();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadKYCStatus();
    loadDashboardStats();
  }, [isAuthenticated, navigate]);

  const loadKYCStatus = async () => {
    try {
      setKycLoading(true);
      const kycData = await driverApi.getKYCStatus();
      setKycStatus(kycData.kycStatus || 'pending');
      setKycExpiresAt(kycData.kycExpiresAt || null);
      setIsKycExpired(kycData.isExpired || false);
    } catch (error: any) {
      console.error('Error loading KYC status:', error);
      setKycStatus('pending');
      setIsKycExpired(false);
    } finally {
      setKycLoading(false);
    }
  };

  const loadDashboardStats = async () => {
  try {
    setLoading(true);
    const [ridesRes, dashboardStats] = await Promise.all([
      ridesApi.getMyRides(),
      driverApi.getDashboardStats(),
    ]);

    const rides = ridesRes.rides || [];
    setPublishedRides(rides);

    const now = new Date();

    // 🔹 Upcoming bookings = bookings on FUTURE rides only
    const upcomingBookingsCount = rides
      .filter((ride: any) => {
        ride.status === 'active' &&
        ride.scheduled_time &&
        new Date(ride.scheduled_time) > now
      })
      .reduce(
        (sum: number, ride: any) => sum + (ride.bookings?.length || 0),
        0
      );

    // 🔹 Completed bookings = bookings on completed rides
    const completedBookingsCount = rides
      .filter((ride: any) => ride.status === 'completed')
      .reduce(
        (sum: number, ride: any) => sum + (ride.bookings?.length || 0),
        0
      );

    // 🔹 Ride counts (time-based, same rule)
    const activeRidesCount = rides.filter(
      (ride: any) =>
        ride.status === 'active' &&
        ride.scheduled_time && new Date(ride.scheduled_time) > now
    ).length;

    const completedRidesCount = rides.filter(
      (ride: any) => ride.status === 'completed'
    ).length;

    setStats({
      rides: {
        total: dashboardStats.stats.totalRides || rides.length,
        active: activeRidesCount,
        completed: completedRidesCount,
      },
      bookings: {
        total:
          dashboardStats.stats.totalBookings ||
          upcomingBookingsCount + completedBookingsCount,
        upcoming: upcomingBookingsCount,
        completed: completedBookingsCount,
      },
      earnings: {
        total: dashboardStats.stats.totalEarnings || 0,
        platformFee: 0,
        currency: 'INR',
      },
      rating: {
        average: dashboardStats.stats.averageRating || 0,
        total: dashboardStats.stats.totalRatings || 0,
      },
    });
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  } finally {
    setLoading(false);
  }
};
const upcomingRides = publishedRides.filter(
  ride => ride.status === 'active' && ride.scheduled_time && new Date(ride.scheduled_time) > now
);

const upcomingBookingsCount = upcomingRides.reduce(
  (sum, ride) => sum + (ride.bookings?.length || 0),
  0
);
  const handleCancelRide = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    try {
      await ridesApi.cancelRide(rideId);
      // Reload rides
      loadDashboardStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel ride');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };


  let driverRide
  
  useEffect(() => {
    const fetchStartedRide = async () => {
      if (user?.role === "driver") {
         driverRide = await getDriverStartedRide(user?.driver?.id)
        console.log("Started ride for driver:", driverRide)
        if (driverRide?.startedride.length > 0) {
          setStartedRide(true)
        }
      }
    }
  
    fetchStartedRide()
  }, [])
  
    const getDriverStartedRide = async (id: string) => {
      let Ride = await driverApi.getStartedRideForDriver(id)
      return Ride
    }


  // Only show verification action if KYC is not approved or expired
  const quickActions = [
    {
      icon: CarIcon,
      title: 'Publish a Ride',
      subtitle: 'Share your ride and earn',
      path: '/driver/publish-ride',
    },
    // Only show verification action if needed
    ...(kycStatus !== 'approved' || isKycExpired ? [{
      icon: PeopleIcon,
      title: isKycExpired ? 'Complete Re-verification' : 'Complete Verification',
      subtitle: 'Get verified to publish rides',
      path: '/driver/kyc',
    }] : []),
  ];

  // Show verification prompt if not verified or expired
  if (kycLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (kycStatus !== 'approved' || isKycExpired) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 50%, #E55A2B 100%)',
            color: 'white',
            p: 4,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <WarningIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" fontWeight="bold">
              Complete Your Verification
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Please complete your KYC verification to access the dashboard and publish rides.
          </Typography>
        </Paper>

        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <VerifiedIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Verification Required
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                To start publishing rides and earning, you need to complete your KYC verification.
                This includes:
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">1</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="600">Identity Proof</Typography>
                  <Typography variant="body2" color="text.secondary">Upload Aadhar or PAN card</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">2</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="600">Driving License</Typography>
                  <Typography variant="body2" color="text.secondary">Upload your valid driving license</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">3</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="600">Bank Account Details</Typography>
                  <Typography variant="body2" color="text.secondary">Provide bank account for payments</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">4</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="600">Selfie</Typography>
                  <Typography variant="body2" color="text.secondary">Upload a clear selfie</Typography>
                </Box>
              </Box>
            </Box>

            {kycStatus === 'pending' && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Your KYC verification is pending. It usually takes 1-2 hours for approval.
              </Alert>
            )}

            {kycStatus === 'rejected' && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Your KYC verification was rejected. Please resubmit with correct documents.
              </Alert>
            )}

            {isKycExpired && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Your KYC verification has expired. Please complete re-verification to continue.
                {kycExpiresAt && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Expired on: {new Date(kycExpiresAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                )}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate('/driver/kyc')}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              {isKycExpired ? 'Complete Re-verification' : 'Complete Verification Now'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Show actual dashboard if verified
  return (
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Welcome, {user.firstName}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Ready to publish your next ride and start earning?
            </Typography>
          </Box>
          <VerifiedIcon sx={{ fontSize: 48, opacity: 0.9 }} />
        </Box>
      </Paper>

      {/* Quick Stats */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              icon={CarIcon}
              title="Published Rides"
              value={stats.rides.total.toString()}
              subtitle={`${stats.rides.active} active, ${stats.rides.completed} completed`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              icon={RupeeIcon}
              title="Total Earnings"
              value={formatCurrency(stats.earnings.total)}
              subtitle="80% of completed rides"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              icon={AssignmentIcon}
              title="Bookings"
              value={upcomingBookingsCount.toString()}
              subtitle={`${upcomingRides.length} upcoming ride${upcomingRides.length !== 1 ? 's' : ''}`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              icon={StarIcon}
              title="Rating"
              value={stats.rating.average.toFixed(1)}
              subtitle={`${stats.rating.total} reviews`}
            />
            
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Grid size={{ xs: 12, md: 6 }} key={action.title}>
                  <Card
                    elevation={1}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        elevation: 4,
                        borderColor: 'primary.main',
                        borderWidth: 2,
                        borderStyle: 'solid',
                      },
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'primary.contrastText',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="h6" fontWeight="medium" gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.subtitle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Rides Section (Added as per request) */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Upcoming Scheduled Rides
            </Typography>
            {publishedRides.filter(r => r.status === 'active').length === 0 && (
              <Button
                variant="contained"
                startIcon={<CarIcon />}
                onClick={() => navigate('/driver/publish-ride')}
                sx={{ textTransform: 'none' }}
              >
                Publish New Ride
              </Button>
            )}
          </Box>

          {loadingRides ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : publishedRides.filter(r => r.status === 'active').length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No upcoming scheduled rides
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {publishedRides
                .filter(ride => ride.status === 'active') // Only show active (scheduled) rides
                .slice(0, 3) // Show top 3
                .map((ride: any) => {
                  const dateTime = formatDateTime(ride.scheduled_time);
                  const bookingsCount = ride.bookings?.length || 0;
                  
                  return (
                    <Paper
                      key={ride.id}
                      elevation={1}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                        },
                        cursor: 'pointer'
                      }}
                     // Assuming detail page exists or just for visual
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight="600">
                              {ride.start_location} → {ride.end_location}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {dateTime.date}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {dateTime.time}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {/* {ride.seats_available - (ride.seats_booked || 0)} seats left */}
                                {Math.max(0, ride.seats_available - (ride.seats_booked || 0))} seats left
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: 'success.light',
                              color: 'success.dark',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            Scheduled
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            ₹{ride.price_per_seat}/seat
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight="medium">
                             {bookingsCount} Booking{bookingsCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      {!loading && stats.earnings.total > 0 && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              Earnings Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'primary.light',
                    p: 3,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2"  gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.contrastText">
                    {formatCurrency(stats.earnings.total)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'primary.light',
                    p: 3,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Platform Fee
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.contrastText">
                    {formatCurrency(stats.earnings.platformFee)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'primary.light',
                    p: 3,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Completed Rides
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.contrastText">
                    {stats.rides.completed}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* All Published Rides (History) */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex',flexDirection:{xs:'column',md:'row'}, justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Published Rides
            </Typography>
            <Button
              variant="contained"
              startIcon={<CarIcon />}
              onClick={() => navigate('/driver/publish-ride')}
              sx={{ textTransform: 'none' }}
            >
              Publish New Ride
            </Button>
          </Box>

          {loadingRides ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : publishedRides.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No published rides yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by publishing your first ride!
              </Typography>
              <Button
                variant="contained"
                startIcon={<CarIcon />}
                onClick={() => navigate('/driver/publish-ride')}
                sx={{ textTransform: 'none' }}
              >
                Publish Your First Ride
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {publishedRides.map((ride: any) => {
                const dateTime = formatDateTime(ride.scheduled_time);
                const bookingsCount = ride.bookings?.length || 0;
                
                return (
                  <Paper
                    key={ride.id}
                    elevation={1}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="h6" fontWeight="600">
                            {ride.start_location} → {ride.end_location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {dateTime.date}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {dateTime.time}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {ride.seats_available} seats available
                            </Typography>
                          </Box>
                          {ride.distance_km && (
                            <Typography variant="body2" color="text.secondary">
                              {typeof ride.distance_km === 'number' 
                                ? ride.distance_km.toFixed(1) 
                                : parseFloat(ride.distance_km)?.toFixed(1) || '0.0'} km
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: `${getStatusColor(ride.status)}.light`,
                              color: `${getStatusColor(ride.status)}.dark`,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            {ride.status}
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          ₹{ride.price_per_seat}/seat
                        </Typography>
                        {bookingsCount > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            {bookingsCount} booking{bookingsCount !== 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {ride.status === 'active' && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelRide(ride.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          Cancel Ride
                        </Button>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Floating SOS Button */}
      {StartedRide && 
      <Fab
        color="error"
        aria-label="Emergency SOS"
        onClick={() => navigate('/driver/sos')}
        sx={{
          position: 'fixed',
          bottom: {xs:74,md:24},
          right: 20,
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
      </Fab>
      }
    </Box>
  );
}

