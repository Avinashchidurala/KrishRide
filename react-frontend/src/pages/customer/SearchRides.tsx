import { useState, useEffect, use } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { addressesApi } from '../../services/addressesApi';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  Divider,
  Rating,
  Drawer,
  IconButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  EventSeat as SeatIcon,
  LocationOn as LocationIcon,
  WbSunny as SunIcon,
  Brightness3 as MoonIcon,
  WbTwilight as SunsetIcon,
  Brightness6 as SunriseIcon,
  SwapVert as SwapIcon,
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { storePostLoginAction, RideContext } from '../../utils/postLoginAction';
import { useAppSelector } from '../../app/hooks';
import LocationAutocomplete, { LocationObject } from '../../components/inputs/LocationAutocomplete';
// import { driverApi } from '../../services/driverApi';
import { calculateDistance } from '../../utils/distanceCalculator';
import axios from 'axios';
import { get } from 'node:http';

// Helper function to get icon for time slot
const getTimeSlotIcon = (start: number) => {
  if (start >= 0 && start < 6) {
    return <MoonIcon sx={{ fontSize: 16 }} />; // Night
  } else if (start >= 6 && start < 9) {
    return <SunriseIcon sx={{ fontSize: 16 }} />; // Early morning
  } else if (start >= 9 && start < 18) {
    return <SunIcon sx={{ fontSize: 16 }} />; // Day
  } else {
    return <SunsetIcon sx={{ fontSize: 16 }} />; // Evening/Night
  }
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

interface RideFormData {
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
}

export default function SearchRides() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Get initial search params from location state or query params
  const initialState = location.state || {};
  
  // For backward compatibility, also store string values
  const [searchData, setSearchData] = useState({
    pickup: searchParams.get('pickup') || '',
    drop: searchParams.get('drop') || '',
    date: searchParams.get('date') || '',
  });

  console.log("search Data:", searchData);

    // Store full location objects
  const [pickupLocation, setPickupLocation] = useState(
    searchParams.get('pickup')|| searchData.pickup || ""
  );
  const [dropLocation, setDropLocation] = useState(
    searchParams.get('drop') || searchData.drop || ""
  );

  console.log("pickup Location:", pickupLocation);
  console.log("drop Location:", dropLocation);

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(
    initialState.timeSlots || []
  );

  const [filters, setFilters] = useState({
    minSeats: 1,
    minRating: 0,
  });

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // console.log(rides)

    const [formData, setFormData] = useState<RideFormData>({
      startLatitude: searchParams.get('startLatitude') || '',
      startLongitude: searchParams.get('startLongitude') || '',
      endLatitude: searchParams.get('endLatitude') || '',
      endLongitude: searchParams.get('endLongitude') || ''
    });

    console.log("formData",formData)

  // Rides will only be loaded when user clicks "Search Rides" button
  // No automatic loading on search params change

  async function getCityAndState(lat: number, lng: number) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const response = await axios.get(url, {
    params: {
      latlng: `${lat},${lng}`,
      key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    },
  });

  const result = response.data.results?.[0];
  if (!result) return { city: null, state: null };

  let city: string | null = null;
  let state: string | null = null;

  for (const component of result.address_components) {
    if (component.types.includes("locality")) {
      city = component.long_name;
    }

    if (component.types.includes("administrative_area_level_1")) {
      state = component.long_name;
    }
  }

  // fallback if locality missing
  if (!city) {
    const district = result.address_components.find((c: any) =>
      c.types.includes("administrative_area_level_2")
    );
    city = district?.long_name ?? null;
  }

  return { city, state };
}

  // Update search data when location objects change
  useEffect(() => {
    if (pickupLocation) {
      setSearchData((prev) => {
        // Only update if the label is different to avoid unnecessary updates
        if (prev.pickup !== pickupLocation) {
          return { ...prev, pickup: pickupLocation };
        }
        return prev;
      });
    }
    if (dropLocation) {
      setSearchData((prev) => {
        // Only update if the label is different to avoid unnecessary updates
        if (prev.drop !== dropLocation) {
          return { ...prev, drop: dropLocation};
        }
        return prev;
      });
    }
  }, [pickupLocation, dropLocation]);

  const getGoogleDistanceKm = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<number> => {
  const result = await calculateDistance(origin, destination);
  return result.distance; // km
};

  const loadRides = async () => {
    // Use location label for API call (backward compatible)
    const pickupLabel = pickupLocation;
    const dropLabel = dropLocation;

    // Only load rides if both locations and date are provided
    if (!pickupLabel || !dropLabel || !searchData.date || !formData.startLatitude ||
    !formData.startLongitude ||
    !formData.endLatitude ||
    !formData.endLongitude) return;

    try {
      setLoading(true);
      setError('');

      const params: any = {
        pickup: pickupLabel,
        drop: dropLabel,
      };

      if (searchData.date) {
        params.date = searchData.date;
      }

      if (selectedTimeSlots.length > 0) {
        params.timeSlots = selectedTimeSlots;
      }

      if(filters.minSeats > 1){
        params.minSeats = filters.minSeats;
      }

      if(formData.startLatitude ||
    formData.startLongitude ||
    formData.endLatitude ||
    formData.endLongitude){
        params.startLatitude = formData.startLatitude;
        params.startLongitude = formData.startLongitude;
        params.endLatitude = formData.endLatitude;
        params.endLongitude = formData.endLongitude;
    }

      const result = await ridesApi.searchRides(params);

      // Apply client-side filters for seats, rating (if needed)
      let filteredRides = result.rides || [];


      const userDistanceKm = await getGoogleDistanceKm(
      {
        lat: Number(formData.startLatitude),
        lng: Number(formData.startLongitude),
      },
      {
        lat: Number(formData.endLatitude),
        lng: Number(formData.endLongitude),
      }
    );

    // console.log("User Distance (km):", userDistanceKm);


        const ridesWithPricing = filteredRides.map((ride: any) => {
      const driverTotalDistanceKm = Number(ride.distance_km); // from backend
      const driverTotalPrice = Number(ride.price_per_seat)
      const availableSeats = ride.availableSeats || ride.seats_available || 1;

      // console.log(driverTotalDistanceKm);

      // 🔐 safety checks
      if (!driverTotalDistanceKm || !driverTotalPrice) {
        return { ...ride, estimatedPrice: null };
      }

      // ✅ proportional pricing
      const userRidePrice =
        (userDistanceKm / driverTotalDistanceKm) * driverTotalPrice;

      const pricePerSeat = userRidePrice / availableSeats;

      return {
        ...ride,
        userDistanceKm: Number(userDistanceKm.toFixed(2)),
        estimatedPrice: Math.round(userRidePrice),
      };
    });

      setRides(ridesWithPricing);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load rides');
      console.error('Error loading rides:', err);
    } finally {
      setLoading(false);
    }
  };
  //  Load saved addresses for logged-in users
const loadSavedAddresses = async () => {
  if (!isAuthenticated) return;
  
  try {
    const result = await addressesApi.getSuggestions();
    setSavedAddresses(result.suggestions || []);
  } catch (error) {
    console.error('Error loading saved addresses:', error);
  }
};

  const handleSearch = () => {
    const pickupLabel = pickupLocation
    const dropLabel = dropLocation
    
    if (!pickupLabel || !dropLabel) {
      setError('Please select pickup and drop locations');
      return;
    }
    
    if (!searchData.date) {
      setError('Please select a travel date');
      return;
    }
    
    // Update query params
    const params = new URLSearchParams();
    params.set('pickup', pickupLabel);
    params.set('drop', dropLabel);
    params.set('date', searchData.date);
    params.set('startLatitude', formData.startLatitude);
    params.set('startLongitude', formData.startLongitude);
    params.set('endLatitude', formData.endLatitude);
    params.set('endLongitude', formData.endLongitude);
    if (selectedTimeSlots.length > 0) {
      params.set('timeSlots', selectedTimeSlots.join(','));
    }
    setSearchParams(params);
    
    // loadRides();
  };
  // ✅ AUTO APPLY FILTERS (Time slots, seats, rating)
// This will NOT run unless pickup, drop & date exist
    useEffect(() => {
      const pickupLabel = pickupLocation?.label || searchData.pickup;
      const dropLabel = dropLocation?.label || searchData.drop;

      if (!pickupLabel || !dropLabel || !searchData.date) return;

      loadRides();
    }, [
      pickupLocation,
      dropLocation,
      searchData.date,
      selectedTimeSlots,
      filters.minSeats,
      filters.minRating,
    ]);
    // Load saved addresses when user is logged in
useEffect(() => {
  if (isAuthenticated) {
    loadSavedAddresses();
  }
}, [isAuthenticated]);


  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSwapLocations = () => {
    const tempLocation = pickupLocation;
    const tempLabel = searchData.pickup;
    
    setPickupLocation(dropLocation);
    setDropLocation(tempLocation);
    setSearchData({
      ...searchData,
      pickup: searchData.drop,
      drop: tempLabel,
    });
  };

  const handleRideClick = (ride: Ride) => {
    const pickupLabel = pickupLocation
    const dropLabel = dropLocation
    
    if (!isAuthenticated || !user) {
      const rideContext: RideContext = {
        rideId: ride.id,
        pickup: pickupLabel,
        drop: dropLabel,
        date: searchData.date,
        initialPricePerSeat: Number(ride.estimatedPrice),
        startLatitude: formData.startLatitude,
        startLongitude: formData.startLongitude,
        endLatitude: formData.endLatitude,
        endLongitude: formData.endLongitude,
        pickupLocation: pickupLocation,
        dropLocation: dropLocation,
        filters: {},
        formData: formData,
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
            date: searchData.date,
            initialPricePerSeat: Number(ride.estimatedPrice),
            startLatitude: formData.startLatitude,
            startLongitude: formData.startLongitude,
            endLatitude: formData.endLatitude,
            endLongitude: formData.endLongitude,
            filters: {},
            formData: formData,
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

  const FiltersPanel = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
          Filters
        </Typography>
      </Box>

      {/* Time Slots */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TimeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
          Time Slots
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTimeSlots.includes(slot.id);
            return (
            <Chip
              key={slot.id}
                icon={getTimeSlotIcon(slot.start)}
              label={slot.label}
              onClick={() => handleTimeSlotToggle(slot.id)}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                size="medium"
              sx={{ 
                cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'all 0.2s ease-in-out',
                  height: 36,
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isSelected ? 2 : 1,
                  },
                  '& .MuiChip-icon': {
                    color: isSelected ? 'inherit' : 'text.secondary',
                  },
                  ...(isSelected && {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }),
              }}
            />
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* Minimum Seats */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <SeatIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
          Minimum Seats Available
        </Typography>
        </Box>
        <FormControl fullWidth size="small">
          <Select
            value={filters.minSeats}
            onChange={(e) => setFilters({ ...filters, minSeats: e.target.value as number })}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              }
            }}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Rating
            value={0}
            readOnly
            size="small"
            sx={{ '& .MuiRating-iconFilled': { color: 'primary.main' } }}
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
          Minimum Rating
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating
            value={filters.minRating}
            onChange={(_, newValue) =>
              setFilters({ ...filters, minRating: newValue || 0 })
            }
            precision={0.5}
            size="large"
          />
          {filters.minRating > 0 && (
            <Typography variant="body2" color="text.secondary">
              {filters.minRating}+
            </Typography>
          )}
        </Box>
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
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          py: 1.5,
          mt: 2,
          fontWeight: 600,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            bgcolor: 'error.light',
            borderColor: 'error.main',
            color: 'error.main',
          },
        }}
      >
        Clear All Filters
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.50',
      }}
    >
      {/* Enhanced Header */}
      <Box
        component="header"
        sx={{
          bgcolor: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 2, md: 4 },
          py: 2.5,
          display: 'flex',
          flexDirection:{
            xs:'column',
            md:'row',
          },
          gap:{
            xs:2,
            md:0
          },
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SearchIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>
            Find a Ride
          </Typography>
        </Box>
        {isAuthenticated && user && (
          <Button
            variant="outlined"
            onClick={() => navigate('/customer/dashboard')}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
            }}
          >
            Dashboard
          </Button>
        )}
      </Box>

      {/* Enhanced Search Bar */}
      <Paper
        elevation={2}
        sx={{
          mx: { xs: 2, md: 4 },
          mt: 3,
          mb: 2,
          p: 3.5,
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: isMobile ? '1 1 100%' : '1 1 auto', minWidth: 180 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontWeight: 500 }}>
                        Pickup Location
                </Typography>
              <LocationAutocomplete
                 value={pickupLocation}
                 onSelect={(loc) => {
             getCityAndState(loc.lat, loc.lng).then(({ city, state }) => {
             setPickupLocation(city)
          })
         setSearchData((prev) => ({ ...prev, pickup: loc.label }));
         setFormData((p) => ({
        ...p,
        startLatitude: loc.lat.toString(),
        startLongitude: loc.lng.toString(),
        }));
      }}
       suggestions={savedAddresses.map(addr => ({
               label: addr.displayName,
               lat: parseFloat(addr.latitude || '0'),
               lng: parseFloat(addr.longitude || '0'),
               isSaved: true,
          }))}
              />
            </Box>
            
            <IconButton
              onClick={handleSwapLocations}
              sx={{
                flexShrink: 0,
                alignSelf: isMobile ? 'center' : 'flex-end',
                mt: isMobile ? 0 : 0.5,
                bgcolor: 'grey.100',
                '&:hover': {
                  bgcolor: 'grey.200',
                },
              }}
            >
              <SwapIcon sx={{ color: 'primary.main'}} />
            </IconButton>
            
            <Box sx={{ flex: isMobile ? '1 1 100%' : '1 1 auto', minWidth: 180 }}>
                 <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontWeight: 500 }}>
                          Drop Location
               </Typography>
       <LocationAutocomplete
          value={dropLocation}
             onSelect={(loc) => {
               getCityAndState(loc.lat, loc.lng).then(({ city, state }) => {
                 setDropLocation(city)
                   })
                  setSearchData((prev) => ({ ...prev, drop: loc.label }));
                setFormData((p) => ({
          ...p,
          endLatitude: loc.lat.toString(),
          endLongitude: loc.lng.toString(),
            }));
      console.log("Selected Drop Location:", loc);
          }}
        suggestions={savedAddresses.map(addr => ({
              label: addr.displayName,
               lat: parseFloat(addr.latitude || '0'),
               lng: parseFloat(addr.longitude || '0'),
               isSaved: true,
             }))}
             />
            </Box>
            
            <TextField
              label="Travel Date"
              type="date"
              size="small"
              value={searchData.date}
              onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              InputProps={{
                startAdornment: (
                  <CalendarIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                ),
              }}
              sx={{ 
                flex: isMobile ? '1 1 100%' : '1 1 auto', 
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={(!pickupLocation && !searchData.pickup) || (!dropLocation && !searchData.drop) || !searchData.date}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
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
                  bgcolor: 'grey.100',
                  '&:hover': {
                    bgcolor: 'grey.200',
                  }
                }}
              >
                <FilterIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error" variant="body2" sx={{ 
              p: 1.5, 
              bgcolor: 'error.light', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {error}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Main Content: Filters + Results */}
      <Box sx={{ display: 'flex', flex: 1, gap: 3, px: { xs: 2, md: 4 }, pb: 4 }}>
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
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>
                  {rides.length} Ride{rides.length !== 1 ? 's' : ''} Available
                </Typography>
                {isMobile && (
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setMobileFiltersOpen(true)}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Filters
                  </Button>
                )}
              </Box>
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
                      <Box sx={{ display: 'flex',flexDirection:{xs:'column',md:'row'} ,gap: 3 }}>
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
                                  {ride?.start_location}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <LocationIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {ride?.end_location}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ 
                              textAlign: 'right',
                              ml: 2,
                              flexShrink: 0,
                            }}>
                              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ lineHeight: 1.2 }}>
                                {/* ₹{Number(ride.price_per_seat).toFixed(0)} */}
                                ₹{Number(ride?.estimatedPrice).toFixed(0)}
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
                                {ride.seats_available - ride.seats_booked} seat{ride.seats_available - ride.seats_booked !== 1 ? 's' : ''}
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
  );
}
