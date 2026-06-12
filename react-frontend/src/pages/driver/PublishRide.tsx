import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Paper,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Route as RouteIcon,
  CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { ridesApi } from '../../services/ridesApi';
import { driverApi } from '../../services/driverApi';
import LocationPicker from '../../components/maps/LocationPicker';
// import RouteMap from '../../components/maps/RouteMap';
import RouteMapp from '../../components/maps/RouteMapp';
import { calculateDistance } from '../../utils/distanceCalculator';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

interface Vehicle {
  id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate_number: string;
  is_active?:boolean;
}

interface RideFormData {
  vehicleId: string;
  startLocation: string;
  endLocation: string;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
  scheduledDate: string;
  scheduledTime: string;
  seatsAvailable: number;
}

const DEFAULT_PER_KM_RATE = 7;

export default function PublishRide() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);
  const [surgeSettings, setSurgeSettings] = useState<{
    enabled: boolean;
    multiplier: number;
    basePricePerKm: number;
  } | null>(null);
  const [manualPricePerSeat, setManualPricePerSeat] = useState<number | null>(null);
  const [priceInputValue, setPriceInputValue] = useState<string>('');
  const [isPriceFieldFocused, setIsPriceFieldFocused] = useState(false);
  const [useManualPrice, setUseManualPrice] = useState(false);

  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
    const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
    const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);

    const [totals, setTotals] = useState<{ distance: number; duration: number ; distanceText: string; durationText: string } | null>(null);

  const [formData, setFormData] = useState<RideFormData>({
    vehicleId: '',
    startLocation: '',
    endLocation: '',
    startLatitude: '',
    startLongitude: '',
    endLatitude: '',
    endLongitude: '',
    scheduledDate: '',
    scheduledTime: '',
    seatsAvailable: 4,
  });

  // Load initial data
  useEffect(() => {
    loadKYCStatus();
    loadVehicles();
    loadSurgeSettings();
  }, []);

  // Load surge settings when locations change (to get city-specific settings)
  useEffect(() => {
    if (formData.startLocation || formData.endLocation) {
      loadSurgeSettings();
    }
  }, [formData.startLocation, formData.endLocation]);

  const loadSurgeSettings = async () => {
    try {
      // Extract city from locations
      const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
      let city: string | undefined;
      for (const c of cities) {
        if (formData.startLocation?.toLowerCase().includes(c.toLowerCase()) || 
            formData.endLocation?.toLowerCase().includes(c.toLowerCase())) {
          city = c;
          break;
        }
      }
      
      const data = await driverApi.getSurgePricingSettings(city);
      if (data.settings) {
        setSurgeSettings({
          enabled: data.settings.enabled !== false,
          multiplier: data.settings.multiplier || 1.25,
          basePricePerKm: data.settings.basePricePerKm || 7,
        });
      }
    } catch (error) {
      console.error('Error loading surge settings:', error);
      // Use defaults if fetch fails
      setSurgeSettings({
        enabled: true,
        multiplier: 1.25,
        basePricePerKm: 7,
      });
    }
  };

  // Auto-calculate distance when both locations are available
  useEffect(() => {
    const calculateRouteDistance = async () => {
      if (
        formData.startLatitude &&
        formData.startLongitude &&
        formData.endLatitude &&
        formData.endLongitude
      ) {
        try {
          setCalculatingDistance(true);
          setError('');
          
          const origin = {
            lat: parseFloat(formData.startLatitude),
            lng: parseFloat(formData.startLongitude),
          };
          const destination = {
            lat: parseFloat(formData.endLatitude),
            lng: parseFloat(formData.endLongitude),
          };

          const result = await calculateDistance(origin, destination);
          setCalculatedDistance(result.distance);
          setCalculatedDuration(result.duration);
        } catch (err: any) {
          console.error('Error calculating distance:', err);
          setError('Failed to calculate distance. Please check your locations.');
          setCalculatedDistance(null);
          setCalculatedDuration(null);
        } finally {
          setCalculatingDistance(false);
        }
      } else {
        setCalculatedDistance(null);
        setCalculatedDuration(null);
      }
    };

    const timeoutId = setTimeout(calculateRouteDistance, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.startLatitude, formData.startLongitude, formData.endLatitude, formData.endLongitude]);

  const loadKYCStatus = async () => {
    try {
      setKycLoading(true);
      const kycData = await driverApi.getKYCStatus();
      setKycStatus(kycData.kycStatus || 'pending');
    } catch (error) {
      console.error('Error loading KYC status:', error);
      setKycStatus('pending');
    } finally {
      setKycLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const profile = await driverApi.getProfile();
      const vehicleList = profile.driver?.vehicles || [];
      setVehicles(vehicleList);
      
      // Auto-select first vehicle if available
      if (vehicleList.length > 0 && !formData.vehicleId) {
        setFormData(prev => ({ ...prev, vehicleId: vehicleList[0].id }));
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleInputChange = useCallback((field: keyof RideFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' 
      ? parseInt(e.target.value) || 0 
      : e.target.value;
    
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLocationChange = useCallback((
    type: 'start' | 'end',
    address: string,
    location: { lat: number; lng: number },
    results?: any[]
  ) => {
    if (type === 'start') {
      setFormData(prev => ({
        ...prev,
        startLocation: address,
        startLatitude: location.lat.toString(),
        startLongitude: location.lng.toString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        endLocation: address,
        endLatitude: location.lat.toString(),
        endLongitude: location.lng.toString(),
      }));
    }
    console.log("Location change results:", results);
  }, []);

  const validateForm = (): string | null => {
    if (!formData.vehicleId) {
      return 'Please select a vehicle';
    }
    if (!formData.startLocation || !formData.startLatitude || !formData.startLongitude) {
      return 'Please select a valid pickup location';
    }
    if (!formData.endLocation || !formData.endLatitude || !formData.endLongitude) {
      return 'Please select a valid drop location';
    }
    if (!formData.scheduledDate) {
      return 'Please select a date';
    }
    if (!formData.scheduledTime) {
      return 'Please select a time';
    }
    if (formData.seatsAvailable < 1 || formData.seatsAvailable > 7) {
      return 'Seats available must be between 1 and 7';
    }

    // Validate future date/time
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      return 'Scheduled time must be in the future';
    }

    // Validate distance calculation
    if (calculatingDistance) {
      return 'Please wait for distance calculation to complete';
    }
    if (!calculatedDistance || calculatedDistance < 1) {
      return 'Please wait for distance calculation or check your locations';
    }

    return null;
  };

  const getEffectiveRatePerKm = (): number => {
    const baseRate = surgeSettings?.basePricePerKm || DEFAULT_PER_KM_RATE;
    if (surgeSettings?.enabled && surgeSettings.multiplier > 1.0) {
      return baseRate * surgeSettings.multiplier;
    }
    return baseRate;
  };

  const calculateTotalFare = (): number => {
    if (!calculatedDistance) return 0;
    const ratePerKm = getEffectiveRatePerKm();
    return totals?.distance * ratePerKm;
  };

  const calculateFarePerSeat = (): number => {
    if (useManualPrice && manualPricePerSeat !== null && manualPricePerSeat > 0) {
      return Math.round(manualPricePerSeat);
    }
    const totalFare = calculateTotalFare();
    if (totalFare === 0 || formData.seatsAvailable === 0) return 0;
    const farePerSeat = totalFare / formData.seatsAvailable;
    return Math.round(farePerSeat);
  };

  const getTotalFare = (): number => {
    const pricePerSeat = calculateFarePerSeat();
    const totalFare = pricePerSeat * formData.seatsAvailable;
    return Math.round(totalFare);
  };

  const handleManualPriceChange = (inputValue: string) => {
    // Handle empty string - allow empty temporarily
    if (!inputValue || inputValue.trim() === '') {
      setPriceInputValue('');
      setManualPricePerSeat(null);
      setUseManualPrice(false);
      return;
    }

    // Remove leading zeros (keep single 0 if input is just "0")
    let cleanValue = inputValue.trim();
    if (cleanValue.length > 1 && cleanValue.startsWith('0') && !cleanValue.startsWith('0.')) {
      cleanValue = cleanValue.replace(/^0+/, '');
    }
    
    // If after removing zeros we have nothing, keep as empty
    if (cleanValue === '') {
      setPriceInputValue('');
      setManualPricePerSeat(null);
      setUseManualPrice(false);
      return;
    }
    
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue) || numericValue < 0) {
      setPriceInputValue('');
      setManualPricePerSeat(null);
      setUseManualPrice(false);
    } else {
      // Update with cleaned value to remove leading zeros from display
      setPriceInputValue(cleanValue);
      setManualPricePerSeat(numericValue);
      setUseManualPrice(numericValue > 0);
    }
  };

  const adjustManualPrice = (delta: number) => {
    const currentPrice = manualPricePerSeat !== null ? manualPricePerSeat : calculateFarePerSeat();
    const newPrice = Math.max(0, currentPrice + delta);
    setPriceInputValue(newPrice.toString());
    handleManualPriceChange(newPrice.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if(routePolyline === null){
      alert("Please select a route on the map.");
      setError('Please select a valid route on the map.'); 
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const pricePerSeat = calculateFarePerSeat();
      // If using manual price, calculate the effective rate per km for backend
      // Otherwise use the calculated rate
      const baseRatePerKm = useManualPrice && calculatedDistance && calculatedDistance > 0
        ? (pricePerSeat * formData.seatsAvailable) / calculatedDistance
        : (surgeSettings?.basePricePerKm || DEFAULT_PER_KM_RATE);

      await ridesApi.publishRide({
        vehicleId: formData.vehicleId,
        pickupLocation: formData.startLocation,
        dropLocation: formData.endLocation,
        pickupLatitude: parseFloat(formData.startLatitude),
        pickupLongitude: parseFloat(formData.startLongitude),
        dropLatitude: parseFloat(formData.endLatitude),
        dropLongitude: parseFloat(formData.endLongitude),
        scheduledDateTime: scheduledDateTime.toISOString(),
        seatsAvailable: formData.seatsAvailable,
        pricePerSeat: pricePerSeat,
        perKmRate: baseRatePerKm,
        distanceKm: totals?.distance,
        routePolyline: routePolyline!,
        routeDurationMin: routeDurationMin,
        routeDistanceKm: routeDistanceKm,
        routeBufferKm: 10,
      });

      navigate('/driver/dashboard', { 
        state: { message: 'Ride published successfully!' } 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to publish ride');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (kycLoading) {
    return (
      <PageContainer maxWidth="md" title="Publish a Ride">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  // KYC not approved
  if (kycStatus !== 'approved') {
    return (
      <PageContainer maxWidth="md" title="Publish a Ride">
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Verification Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please complete your KYC verification before publishing rides.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/driver/kyc')}
            sx={{ textTransform: 'none', mt: 1, borderRadius: 2 }}
          >
            Complete Verification
          </Button>
        </Alert>
      </PageContainer>
    );
  }

  // No vehicles
  if (vehicles.length === 0) {
    return (
      <PageContainer maxWidth="md" title="Publish a Ride">
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please add a vehicle first before publishing rides.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/driver/vehicles')}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add Vehicle
        </Button>
      </PageContainer>
    );
  }

  const hasRoute = formData.startLocation && formData.endLocation && 
    formData.startLatitude && formData.startLongitude && 
    formData.endLatitude && formData.endLongitude;

    // console.log("formData", formData);

  return (
    <PageContainer maxWidth="lg" title="Publish a Ride" subtitle="Share your ride and start earning">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <StandardCard>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Vehicle Selection */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CarIcon sx={{ color: 'primary.main' }} />
                    Select Vehicle
                  </Typography>
                    <TextField
                      select
                      value={formData.vehicleId}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    >
                      {vehicles.filter((vehicle) => vehicle.is_active).map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_make} {vehicle.vehicle_model} - {vehicle.vehicle_plate_number}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Divider />

                  {/* Route Selection */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RouteIcon sx={{ color: 'primary.main' }} />
                      Route Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <LocationPicker
                        label="Pickup Location"
                        value={formData.startLocation}
                        onChange={(address, location) => handleLocationChange('start', address, location)}
                        required
                        showMap={false}
                      />

                      <LocationPicker
                        label="Drop Location"
                        value={formData.endLocation}
                        onChange={(address, location) => handleLocationChange('end', address, location)}
                        required
                        showMap={false}
                      />
                    </Box>
                  </Box>

                  {/* Route Information */}
                  {(calculatingDistance || calculatedDistance) && (
                    <Paper sx={{ p: 3, bgcolor: 'white', border: '1px solid', borderColor: 'info.main', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ color: 'info.main' }} />
                        Route Information
                      </Typography>
                      {calculatingDistance ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Calculating distance...
                          </Typography>
                        </Box>
                      ) : calculatedDistance ? (
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6, sm: 4 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Distance
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                              {totals?.distanceText}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 4 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Duration
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                              {totals?.durationText}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Rate per km
                              {surgeSettings?.enabled && surgeSettings.multiplier > 1.0 && (
                                <Typography component="span" sx={{ color: 'warning.main', ml: 0.5, fontWeight: 600 }}>
                                  (Surge {surgeSettings.multiplier}x)
                                </Typography>
                              )}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                              ₹{getEffectiveRatePerKm().toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      ) : null}
                    </Paper>
                  )}

                  <Divider />

                  {/* Schedule */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: 'primary.main' }} />
                      Schedule
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Date"
                          type="date"
                          value={formData.scheduledDate}
                          onChange={handleInputChange('scheduledDate')}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: new Date().toISOString().split('T')[0] }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Time"
                          type="time"
                          value={formData.scheduledTime}
                          onChange={handleInputChange('scheduledTime')}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Seating */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ color: 'primary.main' }} />
                      Seating Details
                    </Typography>
                    <TextField
                      label="Seats Available"
                      type="number"
                      value={formData.seatsAvailable}
                      onChange={handleInputChange('seatsAvailable')}
                      required
                      fullWidth
                      inputProps={{ min: 1, max: 7 }}
                      helperText="Number of seats available for passengers"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Box>

                  <Divider />

                  {/* Price Editing */}
                  {calculatedDistance && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <RupeeIcon sx={{ color: 'primary.main' }} />
                        Price Per Seat
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Responsive controls */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          {/* Minus buttons (Top on mobile, Left on desktop) */}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              order: { xs: 1, sm: 0 },
                            }}
                          >
                            <Button
                              variant="outlined"
                              onClick={() => adjustManualPrice(-10)}
                              sx={{ minWidth: 50 }}
                            >
                              -10
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => adjustManualPrice(-5)}
                              sx={{ minWidth: 50 }}
                            >
                              -5
                            </Button>
                          </Box>

                          {/* Price input (Always centered) */}
                          <TextField
                            label="Price per Seat (₹)"
                            type="number"
                            fullWidth
                            value={
                              isPriceFieldFocused || priceInputValue !== ''
                                ? priceInputValue
                                : manualPricePerSeat !== null
                                ? manualPricePerSeat
                                : calculateFarePerSeat()
                            }
                            onChange={(e) => handleManualPriceChange(e.target.value)}
                            onFocus={() => {
                              setIsPriceFieldFocused(true);
                              if (priceInputValue === '' && manualPricePerSeat === null) {
                                const calculatedPrice = calculateFarePerSeat();
                                setPriceInputValue(calculatedPrice.toString());
                              }
                            }}
                            onBlur={() => {
                              setIsPriceFieldFocused(false);
                              if (priceInputValue === '' || priceInputValue === null) {
                                setPriceInputValue('');
                                setManualPricePerSeat(null);
                                setUseManualPrice(false);
                              }
                            }}
                            inputProps={{ min: 0, step: 1 }}
                            sx={{
                              maxWidth: { sm: 260 },
                              '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                              order: 2,
                            }}
                          />

                          {/* Plus buttons (Bottom on mobile, Right on desktop) */}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              order: { xs: 3, sm: 0 },
                            }}
                          >
                            <Button
                              variant="outlined"
                              onClick={() => adjustManualPrice(5)}
                              sx={{ minWidth: 50 }}
                            >
                              +5
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => adjustManualPrice(10)}
                              sx={{ minWidth: 50 }}
                            >
                              +10
                            </Button>
                          </Box>
                        </Box>

                        {/* Reset button */}
                        {useManualPrice && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => {
                              setPriceInputValue('');
                              setUseManualPrice(false);
                              setManualPricePerSeat(null);
                            }}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Reset to Auto-calculated
                          </Button>
                        )}
                      </Box>
                    </Box>
                   )}
                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || calculatingDistance}
                    sx={{
                      textTransform: 'none',
                      py: 1.5,
                      mt: 2,
                      borderRadius: '8px',
                    }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {loading ? 'Publishing...' : 'Publish Ride'}
                  </Button>
                </Box>
              </form>
          </StandardCard>
        </Grid>

        {/* Right Column - Preview */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Route Map */}
            {hasRoute && (
              <StandardCard>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RouteIcon sx={{ color: 'primary.main' }} />
                  Route Preview
                </Typography>
                {/* <RouteMap
                  startLocation={formData.startLocation}
                  endLocation={formData.endLocation}
                  startCoords={{
                    lat: parseFloat(formData.startLatitude),
                    lng: parseFloat(formData.startLongitude),
                  }}
                  endCoords={{
                    lat: parseFloat(formData.endLatitude),
                    lng: parseFloat(formData.endLongitude),
                  }}
                  height="300px"
                  showMarkers={true}
                /> */}

                    <div style={{ padding: 20 }}>
                      <h2>Driver Route Selection Demo</h2>
                
                      {formData.startLocation && formData.endLocation && (
                        <RouteMapp
                          startLocation={formData.startLocation}
                          endLocation={formData.endLocation}
                          onRouteSelect={(data) => {
                            console.log("✅ SELECTED ROUTE DATA:", data);
                            setRoutePolyline(data.selectedRoute.overview_polyline);
                            setRouteDistanceKm(data.totals.distance);
                            setRouteDurationMin(data.totals.duration);
                            setTotals(data.totals);
                          }}
                        />
                      )}
                    </div>


              </StandardCard>
            )}

            {/* Fare Preview */}
            {calculatedDistance && (
              <Card sx={{ borderRadius: 2, boxShadow: 2, bgcolor: 'white', border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RupeeIcon sx={{ color: 'primary.dark' }} />
                    Fare Preview
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Price Per Seat (Customer Pays)
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                        ₹{calculateFarePerSeat()}
                        {useManualPrice && (
                          <Typography component="span" sx={{ fontSize: '0.75rem', color: 'warning.main', ml: 1 }}>
                            (Manual)
                          </Typography>
                        )}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Platform Fee (per seat)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        - ₹20
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'success.light', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                        You Receive (per seat)
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>
                        ₹{Math.max(0, calculateFarePerSeat())}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Total Customer Payment ({formData.seatsAvailable} seats)
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          ₹{getTotalFare()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Total Platform Fee
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          - ₹{20}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                        Your Total Earnings
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                        ₹{Math.max(0, getTotalFare() - (20))}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
