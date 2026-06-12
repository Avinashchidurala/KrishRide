import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Paper,
  useMediaQuery,
  useTheme,
  Container,
  Card,
  CardContent,
  Avatar,
  Divider,
  Rating,
  Drawer,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  EventSeat as SeatIcon,
  LocationOn as LocationIcon,
  SwapVert as SwapIcon,
  WbTwilight as NightIcon,
  WbSunny as MorningIcon,
  Brightness5 as AfternoonIcon,
  Brightness3 as EveningIcon,
} from '@mui/icons-material';
import PublicLayout from '../components/layouts/PublicLayout';
import LocationAutocomplete, { LocationObject } from '../components/inputs/LocationAutocomplete';
import { ridesApi } from '../services/ridesApi';
import { storePostLoginAction, RideContext } from '../utils/postLoginAction';
import { useAppSelector } from '../app/hooks';
import { toast } from 'react-hot-toast';
// import { locationStateValidator } from '../services/locationStateValidator';

// Helper function to get icon for time slot
const getTimeSlotIcon = (start: number) => {
  if (start >= 0 && start < 6) return <NightIcon sx={{ fontSize: 18 }} />;
  if (start >= 6 && start < 12) return <MorningIcon sx={{ fontSize: 18 }} />;
  if (start >= 12 && start < 18) return <AfternoonIcon sx={{ fontSize: 18 }} />;
  return <EveningIcon sx={{ fontSize: 18 }} />;
};

// Predefined 3-hour time slots (Paytm/RedBus style)
const TIME_SLOTS = [
  { id: '00-03', label: '00:00 - 03:00', start: 0, end: 3 },
  { id: '03-06', label: '03:00 - 06:00', start: 3, end: 6 },
  { id: '06-09', label: '06:00 - 09:00', start: 6, end: 9 },
  { id: '09-12', label: '09:00 - 12:00', start: 9, end: 12 },
  { id: '12-15', label: '12:00 - 15:00', start: 12, end: 15 },
  { id: '15-18', label: '15:00 - 18:00', start: 15, end: 18 },
  { id: '18-21', label: '18:00 - 21:00', start: 18, end: 21 },
  { id: '21-24', label: '21:00 - 24:00', start: 21, end: 24 },
];

interface Ride {
  id: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  price_per_seat: number;
  seats_available: number;
  availableSeats: number;
  driver: {
    user: {
      first_name: string;
      last_name: string;
      profile_photo_url?: string;
    };
  };
  stops?: Array<{ location: string; latitude: number; longitude: number }>;
}

export default function FindRide() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Store full location objects
  const [pickupLocation, setPickupLocation] = useState<LocationObject | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationObject | null>(null);
  const [date, setDate] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    minSeats: 1,
    minRating: 0,
  });

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Load from URL query params on mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const timeSlotsParam = searchParams.get('timeSlots');

    if (dateParam) {
      setDate(dateParam);
    }

    if (timeSlotsParam) {
      setSelectedTimeSlots(timeSlotsParam.split(',').filter(Boolean));
    }
  }, [searchParams]);

  // Load rides when search params change
  useEffect(() => {
    const pickupParam = searchParams.get('pickup');
    const dropParam = searchParams.get('drop');

    if (pickupParam && dropParam) {
      loadRides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTimeSlotToggle = (slotId: string) => {
    const newTimeSlots = selectedTimeSlots.includes(slotId)
      ? selectedTimeSlots.filter((id) => id !== slotId)
      : [...selectedTimeSlots, slotId];

    setSelectedTimeSlots(newTimeSlots);

    // If search is already active, update URL params and reload
    if (searchParams.get('pickup') && searchParams.get('drop')) {
      const params = new URLSearchParams(searchParams);
      if (newTimeSlots.length > 0) {
        params.set('timeSlots', newTimeSlots.join(','));
      } else {
        params.delete('timeSlots');
      }
      setSearchParams(params);
    }
  };


  const loadRides = async () => {
    const pickupParam = searchParams.get('pickup');
    const dropParam = searchParams.get('drop');
    const dateParam = searchParams.get('date');
    const timeSlotsParam = searchParams.get('timeSlots');

    if (!pickupParam || !dropParam) return;

    try {
      setLoading(true);
      setError('');

      const params: any = {
        pickup: pickupParam,
        drop: dropParam,
      };

      if (dateParam) {
        params.date = dateParam;
      }

      if (timeSlotsParam) {
        params.timeSlots = timeSlotsParam.split(',').filter(Boolean);
      }

      const result = await ridesApi.searchRides(params);

      // Apply client-side filters
      let filteredRides = result.rides || [];

      if (filters.minSeats > 1) {
        filteredRides = filteredRides.filter(
          (ride: Ride) => (ride.availableSeats || ride.seats_available || 0) >= filters.minSeats
        );
      }

      setRides(filteredRides);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load rides');
      console.error('Error loading rides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const pickupLabel = pickupLocation?.label || searchParams.get('pickup') || '';
    const dropLabel = dropLocation?.label || searchParams.get('drop') || '';

    if (!pickupLabel || !dropLabel) {
      toast.error('Please select pickup and drop locations');
      return;
    }

    // Validate locations against active service states
    validateLocations(pickupLabel, dropLabel);
  };

  const validateLocations = async (pickup: string, drop: string) => {
    try {
      setLoading(true);

      // const validation = await locationStateValidator.validateBothLocations(pickup, drop);

      // if (!validation.pickupValid) {
      //   const errorMsg = validation.pickupError || await locationStateValidator.getAvailableStatesText();
      //   toast.error(errorMsg);
      //   setError(errorMsg);
      //   setLoading(false);
      //   return;
      // }

      // if (!validation.dropValid) {
      //   const errorMsg = validation.dropError || await locationStateValidator.getAvailableStatesText();
      //   toast.error(errorMsg);
      //   setError(errorMsg);
      //   setLoading(false);
      //   return;
      // }

      // Both locations are valid, proceed with search
      proceedWithSearch(pickup, drop);
    } catch (err) {
      console.error('Location validation error:', err);
      toast.error('Error validating location. Please try again.');
      setLoading(false);
    }
  };

  const proceedWithSearch = (pickupLabel: string, dropLabel: string) => {
    // Update query params
    const params = new URLSearchParams();
    params.set('pickup', pickupLabel);
    params.set('drop', dropLabel);
    if (date) {
      params.set('date', date);
    }
    if (selectedTimeSlots.length > 0) {
      params.set('timeSlots', selectedTimeSlots.join(','));
    }
    setSearchParams(params);
    setLoading(false);
  };

  const handleSwapLocations = () => {
    const tempLocation = pickupLocation;
    setPickupLocation(dropLocation);
    setDropLocation(tempLocation);
  };

  const handleRideClick = (ride: Ride) => {
    const pickupLabel = pickupLocation?.label || searchParams.get('pickup') || '';
    const dropLabel = dropLocation?.label || searchParams.get('drop') || '';

    if (!isAuthenticated || !user) {
      const rideContext: RideContext = {
        rideId: ride.id,
        pickup: pickupLabel,
        drop: dropLabel,
        date: date || searchParams.get('date') || '',
        initialPricePerSeat: Number(ride.price_per_seat),
        filters: {},
      };
      storePostLoginAction('BOOK_RIDE', rideContext);
      navigate('/login');
    } else {
      navigate(`/customer/book-ride/${ride.id}`, {
        state: {
          ride,
          searchContext: {
            pickup: pickupLabel,
            drop: dropLabel,
            pickupLocation: pickupLocation,
            dropLocation: dropLocation,
            date: date || searchParams.get('date') || '',
            initialPricePerSeat: Number(ride.price_per_seat),
            filters: {
              filters: {},
            },
          },
        },
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Reload rides when filters change
  useEffect(() => {
    if (searchParams.get('pickup') && searchParams.get('drop')) {
      loadRides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minSeats]);

  const FiltersPanel = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <FilterIcon sx={{ fontSize: 24, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
          Filters
        </Typography>
      </Box>

      {/* Time Slots */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TimeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
            Time Slots
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {TIME_SLOTS.map((slot) => (
            <Chip
              key={slot.id}
              icon={getTimeSlotIcon(slot.start)}
              label={slot.label}
              onClick={() => handleTimeSlotToggle(slot.id)}
              color={selectedTimeSlots.includes(slot.id) ? 'primary' : 'default'}
              variant={selectedTimeSlots.includes(slot.id) ? 'filled' : 'outlined'}
              size="medium"
              sx={{
                cursor: 'pointer',
                fontWeight: selectedTimeSlots.includes(slot.id) ? 600 : 500,
                '&:hover': {
                  bgcolor: selectedTimeSlots.includes(slot.id) ? 'primary.dark' : 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>
      </Box>

      <Divider />

      {/* Minimum Seats */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SeatIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
            Minimum Seats Available
          </Typography>
        </Box>
        <FormControl fullWidth size="small">
          <Select
            value={filters.minSeats}
            onChange={(e) => setFilters({ ...filters, minSeats: e.target.value as number })}
          >
            <MenuItem value={1}>1+ seats</MenuItem>
            <MenuItem value={2}>2+ seats</MenuItem>
            <MenuItem value={3}>3+ seats</MenuItem>
            <MenuItem value={4}>4+ seats</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider />

      {/* Minimum Rating */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Rating
            value={filters.minRating}
            readOnly
            size="small"
            sx={{ '& .MuiRating-iconFilled': { color: 'warning.main' } }}
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
            Minimum Rating
          </Typography>
        </Box>
        <Rating
          value={filters.minRating}
          onChange={(_, newValue) =>
            setFilters({ ...filters, minRating: newValue || 0 })
          }
          precision={0.5}
          sx={{ '& .MuiRating-iconFilled': { color: 'warning.main' } }}
        />
      </Box>

      {/* Clear Filters Button */}
      <Button
        variant="outlined"
        fullWidth
        onClick={() => {
          setSelectedTimeSlots([]);
          setFilters({
            minSeats: 1,
            minRating: 0,
          });
        }}
      >
        Clear All Filters
      </Button>
    </Box>
  );

  return (
    <PublicLayout>
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'grey.50',
        }}
      >
        {/* Fixed Search Bar at Top */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            bgcolor: 'white',
            borderBottom: 1,
            borderColor: 'divider',
            boxShadow: 2,
            flexShrink: 0,
          }}
        >
          <Container maxWidth="xl">
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'white',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <Box sx={{ flex: isMobile ? '1 1 100%' : '1 1 0', minWidth: isMobile ? '100%' : 200 }}>
                  <LocationAutocomplete
                    value={pickupLocation?.label || searchParams.get('pickup') || ''}
                    onSelect={setPickupLocation}
                  />
                </Box>

                <IconButton
                  onClick={handleSwapLocations}
                  sx={{
                    flexShrink: 0,
                    alignSelf: isMobile ? 'center' : 'flex-start',
                    mt: isMobile ? 0 : 0.5,
                    bgcolor: 'grey.100',
                    '&:hover': {
                      bgcolor: 'grey.200',
                    },
                  }}
                >
                  <SwapIcon sx={{ color: 'primary.main' }} />
                </IconButton>

                <Box sx={{ flex: isMobile ? '1 1 100%' : '1 1 0', minWidth: isMobile ? '100%' : 200 }}>
                  <LocationAutocomplete
                    value={dropLocation?.label || searchParams.get('drop') || ''}
                    onSelect={setDropLocation}
                  />
                </Box>

                <TextField
                  label="Date"
                  type="date"
                  size="small"
                  value={date || searchParams.get('date') || ''}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDate(newDate);

                    // If search is already active, update URL params and reload
                    if (searchParams.get('pickup') && searchParams.get('drop')) {
                      const params = new URLSearchParams(searchParams);
                      if (newDate) {
                        params.set('date', newDate);
                      } else {
                        params.delete('date');
                      }
                      setSearchParams(params);
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  sx={{
                    flex: isMobile ? '1 1 100%' : '0 0 auto',
                    minWidth: isMobile ? '100%' : 180,
                    maxWidth: isMobile ? '100%' : 180,
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={(!pickupLocation && !searchParams.get('pickup')) || (!dropLocation && !searchParams.get('drop')) || (!date && !searchParams.get('date'))}
                  sx={{
                    flexShrink: 0,
                    borderRadius: 2,
                    textTransform: 'none',
                    minWidth: isMobile ? '100%' : 120,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    }
                  }}
                >
                  Search Rides
                </Button>

                {isMobile && (
                  <IconButton
                    onClick={() => setMobileFiltersOpen(true)}
                    sx={{
                      flexShrink: 0,
                      width: '100%',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                )}
              </Box>
              {error && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {error}
                </Typography>
              )}
            </Paper>
          </Container>
        </Box>

        {/* Main Content: Filters (Left) + Results (Right) */}
        <Container maxWidth="xl" sx={{ flex: 1, py: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {/* Desktop: Sticky Filters Sidebar */}
            {!isMobile && (
              <Paper
                elevation={2}
                sx={{
                  width: 320,
                  flexShrink: 0,
                  height: 'fit-content',
                  position: 'sticky',
                  top: 24,
                  bgcolor: 'white',
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <FiltersPanel />
              </Paper>
            )}

            {/* Results List */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              {loading ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                  gap: 2
                }}>
                  <CircularProgress size={48} />
                  <Typography variant="body1" color="text.secondary">
                    Searching for rides...
                  </Typography>
                </Box>
              ) : !searchParams.get('pickup') || !searchParams.get('drop') ? (
                <Paper
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 4,
                    bgcolor: 'white',
                    borderRadius: 3,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
                    Search for Rides
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Enter your pickup and drop locations above to find available rides
                  </Typography>
                </Paper>
              ) : rides.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 4,
                    bgcolor: 'white',
                    borderRadius: 3,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
                    No rides found
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    We couldn't find any rides matching your search criteria
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria or filters to find more options
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: 'text.primary' }}>
                    {rides.length} Ride{rides.length !== 1 ? 's' : ''} Available
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {rides.map((ride) => (
                      <Card
                        key={ride.id}
                        elevation={2}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          borderRadius: 3,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            elevation: 6,
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            borderColor: 'primary.main',
                          },
                        }}
                        onClick={() => handleRideClick(ride)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', gap: 3 }}>
                            {/* Driver Avatar */}
                            <Avatar
                              src={ride.driver.user.profile_photo_url}
                              sx={{
                                width: 64,
                                height: 64,
                                fontSize: 24,
                                fontWeight: 600,
                              }}
                            >
                              {ride.driver.user.first_name[0]}{ride.driver.user.last_name?.[0]}
                            </Avatar>

                            {/* Ride Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    {ride.driver.user.first_name} {ride.driver.user.last_name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <LocationIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {ride.start_location}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <LocationIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {ride.end_location}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{
                                  textAlign: 'right',
                                  ml: 2,
                                  flexShrink: 0,
                                }}>
                                  <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ lineHeight: 1.2 }}>
                                    ₹{Number(ride.price_per_seat).toFixed(0)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    per seat
                                  </Typography>
                                </Box>
                              </Box>

                              <Divider sx={{ my: 2 }} />

                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TimeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                  <Typography variant="body2" fontWeight={600} color="primary.main">
                                    {formatTime(ride.scheduled_time)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                  <Typography variant="body2" fontWeight={600} color="info.main">
                                    {formatDate(ride.scheduled_time)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <SeatIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                  <Typography variant="body2" fontWeight={600} color="success.main">
                                    {ride.availableSeats || ride.seats_available || 0} seat{(ride.availableSeats || ride.seats_available || 0) !== 1 ? 's' : ''}
                                  </Typography>
                                </Box>
                              </Box>

                              {ride.stops && ride.stops.length > 0 && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}>
                                    <LocationIcon sx={{ fontSize: 14 }} />
                                    {ride.stops.length} stop{ride.stops.length !== 1 ? 's' : ''} on route
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Container>

        {/* Mobile: Filters Bottom Sheet */}
        <Drawer
          anchor="bottom"
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          PaperProps={{
            sx: {
              maxHeight: '80vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">
              Filters
            </Typography>
            <IconButton onClick={() => setMobileFiltersOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <FiltersPanel />
        </Drawer>
      </Box>
    </PublicLayout>
  );
}
