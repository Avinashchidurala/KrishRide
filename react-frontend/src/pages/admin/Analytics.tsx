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
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  DirectionsCar as RideIcon,
  AccountBalanceWallet as RevenueIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StandardCard from '../../components/common/StandardCard';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getAnalytics({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <PageContainer maxWidth="xl" title="Analytics & Reports" subtitle="View platform analytics and performance metrics">
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
            onClick={loadAnalytics} 
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Generate Report'}
          </Button>
        </Box>
      </Paper>

      {loading && !analytics ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : analytics ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Total Rides
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {analytics.totalRides || 0}
                    </Typography>
                  </Box>
                  <RideIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </StandardCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Completed Rides
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {analytics.completedRides || 0}
                    </Typography>
                  </Box>
                  <TrendingIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </StandardCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {analytics.completionRate?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                </Box>
              </StandardCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StandardCard>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Active Drivers
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {analytics.driverStats?.length || 0}
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </StandardCard>
            </Grid>
          </Grid>

          {analytics.driverStats && analytics.driverStats.length > 0 && (
            <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Driver Performance
                </Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Driver Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Rides</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Earnings</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Average Rating</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Payouts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.driverStats.map((driver: any) => (
                    <TableRow key={driver.id} hover>
                      <TableCell>{driver.name}</TableCell>
                      <TableCell>{driver.totalRides}</TableCell>
                      <TableCell>{formatCurrency(Number(driver.totalEarnings || 0))}</TableCell>
                      <TableCell>
                        {Number(driver.averageRating || 0).toFixed(1)} ⭐
                      </TableCell>
                      <TableCell>{driver.totalPayouts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {analytics.bookingTrends && analytics.bookingTrends.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Booking Trends
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Bookings Count</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.bookingTrends.slice(0, 10).map((trend: any, index: number) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          {new Date(trend.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{trend._count}</TableCell>
                        <TableCell>
                          {formatCurrency(Number(trend._sum?.total_fare || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Select a date range and click "Generate Report" to view analytics
          </Typography>
        </Paper>
      )}
    </PageContainer>
  );
}

