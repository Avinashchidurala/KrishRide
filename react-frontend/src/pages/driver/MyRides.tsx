import { useState, useEffect, useRef } from 'react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Menu,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Event as DateIcon,
  People as PeopleIcon,
  CurrencyRupee as RupeeIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  PlayArrow as StartIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { bookingsApi } from '../../services/bookingsApi';
import MapComponent from '../../components/maps/MapComponent';
import { getErrorMessage } from '../../utils/errorHandler';
import { DriverRatingDisplay } from '../../components/DriverRatingDisplay';
import { driverApi } from '../../services/driverApi';

export default function MyRides() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rides, setRides] = useState<any[]>([]);
  const [filteredRides, setFilteredRides] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [expandedRides, setExpandedRides] = useState<{ [key: string]: boolean }>({});
  const [otpInputs, setOtpInputs] = useState<{ [key: string]: string }>({});
  const [pinInputs, setPinInputs] = useState<{ [key: string]: string }>({});
  const [verifying, setVerifying] = useState<{ [key: string]: boolean }>({});
  const [currentLocations, setCurrentLocations] = useState<{ [key: string]: { lat: number; lng: number } }>({});
  const [cancelMessage, setCancelMessage] = useState('');
  const watchIdRefs = useRef<{ [key: string]: number | null }>({});
      // responsive
    const theme = useTheme();
     const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  useEffect(() => {
    loadRides();
  }, []);

  useEffect(() => {
    filterRides();
  }, [rides, search, statusFilter, tabValue]);

  // Start location tracking for started rides
  useEffect(() => {
    const startedRides = rides.filter((r) => r.status === 'started');
    
    startedRides.forEach((ride) => {
      if (!currentLocations[ride.id] && navigator.geolocation) {
        // Get initial position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocations((prev) => ({
              ...prev,
              [ride.id]: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            }));
          },
          (error) => {
            console.error('Error getting location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );

        // Watch position changes
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocations((prev) => ({
              ...prev,
              [ride.id]: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            }));
          },
          (error) => {
            console.error('Error watching location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );

        watchIdRefs.current[ride.id] = watchId;
      }
    });

    // Cleanup: stop tracking for rides that are no longer started
    Object.keys(watchIdRefs.current).forEach((rideId) => {
      const ride = rides.find((r) => r.id === rideId);
      if (!ride || ride.status !== 'started') {
        if (watchIdRefs.current[rideId] !== null) {
          navigator.geolocation.clearWatch(watchIdRefs.current[rideId]!);
          delete watchIdRefs.current[rideId];
        }
        setCurrentLocations((prev) => {
          const newLocations = { ...prev };
          delete newLocations[rideId];
          return newLocations;
        });
      }
    });

    return () => {
      // Cleanup all watchers on unmount
      Object.values(watchIdRefs.current).forEach((watchId) => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      });
    };
  }, [rides]);

  const loadRides = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await ridesApi.getMyRides();
      setRides(result.rides || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

 const filterRides = () => {
  let filtered = [...rides];

    // Mark past rides with no bookings as expired
  const now = new Date();
  filtered = filtered.map((ride) => {
    // If ride is active but scheduled time has passed, mark as expired
    if (ride.status === 'active' && new Date(ride.scheduled_time) < now && ride.seats_booked === 0) {
      return { ...ride, status: 'expired' };
    }
    return ride;
  });

    // Apply tab filter
    if (tabValue === 1) {
      filtered = filtered.filter((r) => r.status === 'active');
    } else if(tabValue === 2){
      filtered = filtered.filter((r) => r.status === 'started');
    }
    else if (tabValue === 3) {
      filtered = filtered.filter((r) => r.status === 'completed');
    } else if (tabValue === 4) {
      filtered = filtered.filter((r) => r.status === 'cancelled');
    } else if (tabValue === 5) {
    filtered = filtered.filter((r) => r.status === 'expired');
  }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.start_location?.toLowerCase().includes(searchLower) ||
          r.end_location?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by scheduled time (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_time).getTime();
      const dateB = new Date(b.scheduled_time).getTime();
      return dateB - dateA;
    });

    setFilteredRides(filtered);
  };

  const handleCancelRide = (ride: any) => {
    setSelectedRide(ride);
    setCancelDialogOpen(true);
  };

  const confirmCancelRide = async () => {
    if (!selectedRide) return;

    if(!cancelMessage.trim()){
      return alert('Please provide a reason for cancellation.');
    }

    try {
      setCancelling(true);
      await ridesApi.cancelRide(selectedRide.id);
      await driverApi.postMessageForRideCancelByDriver(selectedRide.id,cancelMessage);
      await loadRides();
      setCancelDialogOpen(false);
      setSelectedRide(null);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel ride');
    } finally {
      setCancelling(false);
    }
  };

  const toggleRideExpanded = (rideId: string) => {
    setExpandedRides((prev) => ({
      ...prev,
      [rideId]: !prev[rideId],
    }));
  };

  const handleVerifyPickupOTP = async (bookingId: string) => {
    const otp = otpInputs[bookingId];
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifying({ ...verifying, [bookingId]: true });
      await bookingsApi.verifyPickupOTP(bookingId, otp);
      setOtpInputs({ ...otpInputs, [bookingId]: '' });
      await loadRides();
      alert('Pickup verified successfully. Ride started.');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = getErrorMessage(err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setVerifying({ ...verifying, [bookingId]: false });
    }
  };

  const handleVerifyDropPIN = async (bookingId: string) => {
    const pin = pinInputs[bookingId];
    if (!pin || pin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setVerifying({ ...verifying, [`pin-${bookingId}`]: true });
      await bookingsApi.verifyDropPIN(bookingId, pin);
      setPinInputs({ ...pinInputs, [bookingId]: '' });
      await loadRides();
      alert('Drop verified successfully. Ride completed.');
    } catch (err: any) {
      console.error('PIN verification error:', err);
      const errorMessage = getErrorMessage(err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setVerifying({ ...verifying, [`pin-${bookingId}`]: false });
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'started':
        return 'primary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      case 'started':
        return 'info';
      case 'expired':
      return 'warning';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

// Update stats calculation
  const stats = {
    total: rides.length,
    active: rides.filter((r) => r.status === 'active').length,
    completed: rides.filter((r) => r.status === 'completed').length,
    cancelled: rides.filter((r) => r.status === 'cancelled').length,
    started: rides.filter((r) => r.status === 'started').length,
    expired: rides.filter((r) => r.status === 'expired').length,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          My Rides
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage all your published rides
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Rides
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stats.active}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                {stats.started}
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                Started
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                {stats.completed}
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {stats.cancelled}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
  <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'warning.light' }}>
    <CardContent>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
        {stats.expired}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Expired
      </Typography>
    </CardContent>
  </Card>
</Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="started">Started</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 5 }}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<CarIcon />}
                onClick={() => navigate('/driver/publish-ride')}
                sx={{ textTransform: 'none' }}
              >
                Publish New Ride
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        {isMobile && (
              <Box sx={{ p: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Filter"
                  value={tabValue}
                  onChange={(e) => setTabValue(Number(e.target.value))}
                >
                  <MenuItem value={0}>All ({stats.total})</MenuItem>
                  <MenuItem value={1}>Active ({stats.active})</MenuItem>
                <MenuItem value={2}>Started({stats.started})</MenuItem>
                  <MenuItem value={3}>Completed ({stats.completed})</MenuItem>
                  <MenuItem value={4}>Cancelled ({stats.cancelled})</MenuItem>
                  <MenuItem value={5}>Expired ({stats.expired})</MenuItem>

                </TextField>
              </Box>

        )}
        {!isMobile && (
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Active (${stats.active})`} />
          <Tab label={`Started (${stats.started})`}/>
          <Tab label={`Completed (${stats.completed})`} />
          <Tab label={`Cancelled (${stats.cancelled})`} />
          <Tab label={`Expired (${stats.expired})`} />
        </Tabs>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Rides List */}
      {filteredRides.length === 0 ? (
        <Card sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            No rides found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {search || statusFilter !== 'all' || tabValue !== 0
              ? 'Try adjusting your filters'
              : 'Start by publishing your first ride'}
          </Typography>
          {!search && statusFilter === 'all' && tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<CarIcon />}
              onClick={() => navigate('/driver/publish-ride')}
              sx={{ textTransform: 'none' }}
            >
              Publish Your First Ride
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredRides.map((ride) => {
            const dateTime = formatDateTime(ride.scheduled_time);
            // Use seatsBooked and availableSeats from backend (calculated from seats_booked field)
            const bookedSeats = ride.seatsBooked ?? 0;
            const availableSeats = ride.availableSeats ?? (ride.seats_available - bookedSeats);

            return (
              <Grid size={{ xs: 12 }} key={ride.id}>
                <Card sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
                  <Box sx={{ bgcolor: 'primary.main', p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Chip
                          label={ride.status.toUpperCase()}
                          color={getStatusColor(ride.status) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <DriverRatingDisplay 
                          driverId={ride.driverId} 
                          className="text-white"
                          showTrend={true}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        Ride ID: {ride.id.slice(0, 8).toUpperCase()}
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Route */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <LocationIcon sx={{ color: 'success.main', fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                FROM
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, ml: 4 }}>
                              {ride.start_city || ride.start_location}
                            </Typography>
                            {ride.start_city && (
                               <Typography variant="body2" sx={{ color: 'text.secondary' ,paddingLeft:4 }}>
                                 {ride.start_location}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ ml: 2, width: 2, height: 20, bgcolor: 'divider' }} />

                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <LocationIcon sx={{ color: 'error.main', fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                TO
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, ml: 4 }}>
                              {ride.end_city || ride.end_location}                     
                            </Typography>
                            {ride.end_city && (
                             <Typography variant="body2" sx={{ color: 'text.secondary',paddingLeft:4  }}>
                                  {ride.end_location}
                              </Typography>
                             )}
                            
                          </Box>

                          {/* Date and Time */}
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DateIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {dateTime.date}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimeIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {dateTime.time}
                              </Typography>
                            </Box>
                            {ride.distance_km && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CarIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {parseFloat(ride.distance_km).toFixed(1)} km
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: { md: 1 }, borderColor: 'divider', pl: { md: 2 } }}>
                          {/* Seats */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <PeopleIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Seats
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, ml: 3 }}>
                              {availableSeats} / {ride.seats_available} available
                            </Typography>
                          </Box>

                          {/* Price */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <RupeeIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Price per Seat
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', ml: 3 }}>
                              ₹{Number(ride.price_per_seat).toFixed(2)}
                            </Typography>
                          </Box>

                          {/* Bookings */}
                          {ride.bookings && ride.bookings.length > 0 && (
                            <Box>
                              <Button
                                fullWidth
                                onClick={() => toggleRideExpanded(ride.id)}
                                endIcon={expandedRides[ride.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{
                                  textTransform: 'none',
                                  justifyContent: 'space-between',
                                  color: 'text.primary',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                              >
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  Bookings
                                </Typography>
                                <Chip
                                  label={ride.bookings.length}
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              </Button>
                            </Box>
                          )}

                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', mt: 1 }}>
                            {ride.status === 'active' && (
                              <>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<StartIcon />}
                                  onClick={async () => {
                                    try {
                                      await ridesApi.startRide(ride.id);
                                      await loadRides();
                                    } catch (err: any) {
                                      alert(err.message || 'Failed to start ride');
                                    }
                                  }}
                                  fullWidth
                                  sx={{ textTransform: 'none' }}
                                >
                                  Start Ride
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleCancelRide(ride)}
                                  fullWidth
                                  sx={{ textTransform: 'none' }}
                                >
                                  Cancel Ride
                                </Button>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Current Location Map for Started Rides */}
                    {ride.status === 'started' && (
                      <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider'}}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                          Current Location
                        </Typography>
                        <Box sx={{ height: '300px', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                          <MapComponent
                            center={currentLocations[ride.id] || {
                              lat: parseFloat(ride.start_latitude || 0) || 17.3850,
                              lng: parseFloat(ride.start_longitude || 0) || 78.4867,
                            }}
                            zoom={15}
                            showCurrentLocation={true}
                            onLocationChange={(location) => {
                              setCurrentLocations((prev) => ({
                                ...prev,
                                [ride.id]: location,
                              }));
                            }}
                            markers={[
                              ...(currentLocations[ride.id] ? [{
                                lat: currentLocations[ride.id].lat,
                                lng: currentLocations[ride.id].lng,
                                label: 'Your Location',
                                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                              }] : []),
                              {
                                lat: parseFloat(ride.start_latitude || 0),
                                lng: parseFloat(ride.start_longitude || 0),
                                label: 'Pickup',
                                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                              },
                              {
                                lat: parseFloat(ride.end_latitude || 0),
                                lng: parseFloat(ride.end_longitude || 0),
                                label: 'Drop',
                                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                              },
                            ]}
                          />
                        </Box>
                      </Box>
                    )}

                    {/* Expanded Bookings Section */}
                    {expandedRides[ride.id] && ride.bookings && ride.bookings.length > 0 && (
                      <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Bookings ({ride.bookings.length})
                          </Typography>
                          {ride.status === 'started' && (() => {
                            const startedBookings = ride.bookings.filter((b: any) => b.status === 'started' || b.status === 'completed');
                            const allDropVerified = startedBookings.length > 0 && startedBookings.every((b: any) => b.drop_verified === true);
                            const verifiedCount = startedBookings.filter((b: any) => b.drop_verified).length;
                            const totalStarted = startedBookings.length;
                            
                            return allDropVerified && totalStarted > 0 ? (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to end this ride? All bookings will be marked as completed.')) {
                                    try {
                                      await ridesApi.endRide(ride.id);
                                      await loadRides();
                                      alert('Ride completed successfully!');
                                    } catch (err: any) {
                                      alert(err.message || 'Failed to end ride');
                                    }
                                  }
                                }}
                                sx={{ textTransform: 'none' }}
                              >
                                End Ride
                              </Button>
                            ) : totalStarted > 0 ? (
                              <Chip
                                label={`${verifiedCount}/${totalStarted} drop verified`}
                                color="warning"
                                size="small"
                              />
                            ) : null;
                          })()}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {ride.bookings.map((booking: any) => (
                            <Card key={booking.id} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Box sx={{ display: 'flex',flexDirection:{xs:'column-reverse',md:'row'}, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 2,gap:{xs:2,md:0} }}>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      {booking.customer?.user?.first_name} {booking.customer?.user?.last_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      Booking: {booking.booking_number} • {booking.passengerCount} passenger(s)
                                    </Typography>
                                   {booking.status === 'confirmed' && booking.status !== 'completed' && (
                                      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                        {booking.customer?.user?.mobile}
                                      </Typography>
                                    )}                                   
                                  </Box>
                                  <Chip
                                    label={booking.status.toUpperCase()}
                                    color={getBookingStatusColor(booking.status) as any}
                                    size="small"
                                    sx={{
                                      alignSelf: { xs: 'flex-start', md: 'center' },
                                    }}
                                  />
                                </Box>

                                {/* Pickup OTP Verification */}
                                {!booking.pickup_verified && booking.status === 'confirmed' && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                      Verify Pickup OTP
                                    </Typography>
                                    <Box sx={{ display: 'flex',flexDirection:{xs:"column",md:"row"}, gap: 1 }}>
                                      <TextField
                                        size="small"
                                        placeholder="Enter 6-digit OTP"
                                        value={otpInputs[booking.id] || ''}
                                        onChange={(e) =>
                                          setOtpInputs({ ...otpInputs, [booking.id]: e.target.value.replace(/\D/g, '').slice(0, 6) })
                                        }
                                        inputProps={{ maxLength: 6 }}
                                        sx={{ flex: 1 }}
                                      />
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleVerifyPickupOTP(booking.id)}
                                        disabled={!otpInputs[booking.id] || otpInputs[booking.id].length !== 6 || verifying[booking.id]}
                                      >
                                        {verifying[booking.id] ? <CircularProgress size={20} /> : 'Verify'}
                                      </Button>
                                    </Box>
                                  </Box>
                                )}

                                {/* Drop PIN Verification */}
                                {booking.pickup_verified && !booking.drop_verified && booking.status === 'started' && (
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                      Verify Drop PIN
                                    </Typography>
                                    <Box sx={{ display: 'flex',flexDirection:{xs:"column",md:"row"}, gap: 1 }}>
                                      <TextField
                                        size="small"
                                        placeholder="Enter 4-digit PIN"
                                        value={pinInputs[booking.id] || ''}
                                        onChange={(e) =>
                                          setPinInputs({ ...pinInputs, [booking.id]: e.target.value.replace(/\D/g, '').slice(0, 4) })
                                        }
                                        inputProps={{ maxLength: 4 }}
                                        sx={{ flex: 1 }}
                                      />
                                      <Button
                                        variant="contained"
                                        size="small"
                                        color="success"
                                        onClick={() => handleVerifyDropPIN(booking.id)}
                                        disabled={!pinInputs[booking.id] || pinInputs[booking.id].length !== 4 || verifying[`pin-${booking.id}`]}
                                      >
                                        {verifying[`pin-${booking.id}`] ? <CircularProgress size={20} /> : 'Verify'}
                                      </Button>
                                    </Box>
                                  </Box>
                                )}

                                {/* Status Indicators */}
                                {booking.pickup_verified && (
                                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                                    <CheckIcon fontSize="small" />
                                    <Typography variant="body2">Pickup verified</Typography>
                                  </Box>
                                )}
                                {booking.drop_verified && (
                                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                                    <CheckIcon fontSize="small" />
                                    <Typography variant="body2">Drop verified - Ride completed</Typography>
                                  </Box>
                                )}

                                {/* Fare */}
                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                     Fare
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    ₹{parseFloat(booking.base_fare || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Cancel Ride Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Ride</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this ride? This action cannot be undone and all bookings for this ride will be cancelled.
          </DialogContentText>

          <TextField
            label="Reason for cancellation"
            placeholder="Please enter a reason to cancel the ride"
            fullWidth
            multiline
            minRows={3}
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            required
            sx={{ mt: 2 }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ textTransform: 'none' }}>
            No, Keep Ride
          </Button>
          <Button
            onClick={confirmCancelRide}
            color="error"
            variant="contained"
            disabled={cancelling}
            sx={{ textTransform: 'none' }}
          >
            {cancelling ? <CircularProgress size={20} /> : 'Yes, Cancel Ride'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

