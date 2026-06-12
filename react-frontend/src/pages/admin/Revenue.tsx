import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  AccountBalanceWallet as RevenueIcon,
  TrendingUp as TrendingIcon,
  DateRange as DateIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StandardCard from '../../components/common/StandardCard';

export default function AdminRevenue() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    
    // Load revenue after setting dates
    const loadInitialRevenue = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminApi.getRevenue({
          startDate: startDateStr,
          endDate: endDateStr,
        });
        console.log('Initial revenue data:', data);
        setRevenueData(data);
      } catch (err: any) {
        console.error('Error loading initial revenue:', err);
        setError(err.message || 'Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialRevenue();
  }, []);

  const loadRevenue = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError('');
      
      // Format dates as YYYY-MM-DD (backend will handle timezone)
      const startDateStr = startDate; // Already in YYYY-MM-DD format
      const endDateStr = endDate; // Already in YYYY-MM-DD format
      
      console.log('Loading revenue with dates:', { startDateStr, endDateStr });
      
      const data = await adminApi.getRevenue({
        startDate: startDateStr,
        endDate: endDateStr,
      });
      
      console.log('Revenue data received:', data);
      setRevenueData(data);
    } catch (err: any) {
      console.error('Error loading revenue:', err);
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const calculateAverage = () => {
    if (!revenueData || !revenueData.totalBookings) return 0;
    return revenueData.totalRevenue / revenueData.totalBookings;
  };

  return (
    <PageContainer maxWidth="xl" title="Revenue Report" subtitle="View revenue and booking statistics">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button 
            variant="contained" 
            onClick={loadRevenue} 
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Generate Report'}
          </Button>
        </Box>
      </Paper>

      {loading && !revenueData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : revenueData ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(revenueData.totalRevenue || 0)}
                    </Typography>
                  </Box>
                  <RevenueIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </StandardCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Total Bookings
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {revenueData.totalBookings || 0}
                    </Typography>
                  </Box>
                  <TrendingIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </StandardCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Average Booking Value
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatCurrency(calculateAverage())}
                    </Typography>
                  </Box>
                  <DateIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                </Box>
              </StandardCard>
            </Grid>
          </Grid>

          {revenueData.bookings && revenueData.bookings.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueData.bookings.map((booking: any) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>
                        {booking.booking_number || booking.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {booking.customer?.user
                          ? `${booking.customer.user.first_name} ${booking.customer.user.last_name}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {booking.ride?.driver?.user
                          ? `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {booking.ride?.start_location} → {booking.ride?.end_location}
                      </TableCell>
                      <TableCell>{formatDate(booking.createdAt || booking.created_at)}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {formatCurrency(typeof booking.total_fare === 'number' ? booking.total_fare : parseFloat(booking.total_fare || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {(!revenueData.bookings || revenueData.bookings.length === 0) && (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No bookings found for the selected date range
              </Typography>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Select a date range and click "Generate Report" to view revenue data
          </Typography>
        </Paper>
      )}
    </PageContainer>
  );
}

