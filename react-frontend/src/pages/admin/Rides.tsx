import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminRides() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rides, setRides] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadRides();
  }, [page, limit, statusFilter]);

  const loadRides = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getRides({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setRides(data.rides || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadRides();
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
        return 'warning';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '₹0.00';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '₹0.00';
    }
    return `₹${numAmount.toFixed(2)}`;
  };

  const handleViewRide = (ride: any) => {
    setSelectedRide(ride);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedRide(null);
  };

  if (loading && rides.length === 0) {
    return (
      <PageContainer maxWidth="xl" title="Rides Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="Rides Management" subtitle="Manage all rides published by drivers">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected === '') return 'All';
                if (selected === 'active') return 'Active';
                if (selected === 'completed') return 'Completed';
                if (selected === 'cancelled') return 'Cancelled';
                return selected || 'All';
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Search
          </Button>
          <IconButton onClick={loadRides} sx={{ borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Scheduled Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Seats</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No rides found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rides.map((ride) => (
                <TableRow 
                  key={ride.id} 
                  hover 
                  onClick={() => handleViewRide(ride)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{ride.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {ride.driver?.user
                      ? `${ride.driver.user.first_name} ${ride.driver.user.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {ride.start_location}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        → {ride.end_location}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(ride.scheduled_time)}</TableCell>
                  <TableCell>
                    {ride.seats_available - ride.seats_booked} / {ride.seats_available}
                  </TableCell>
                  <TableCell>{formatCurrency(ride.price_per_seat)}</TableCell>
                  <TableCell>
                    <Chip
                      label={ride.status}
                      color={getStatusColor(ride.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(ride.createdAt)}</TableCell>
                  <TableCell>{ride?.message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => {
          setLimit(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />

      {/* Ride Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={handleCloseDetailsDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Ride Details</Typography>
            <Button
              onClick={handleCloseDetailsDialog}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRide && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Ride ID
                  </Typography>
                  <Typography variant="body1">{selectedRide.id}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedRide.status}
                    color={getStatusColor(selectedRide.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Driver
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.driver?.user
                      ? `${selectedRide.driver.user.first_name} ${selectedRide.driver.user.last_name} (${selectedRide.driver.user.mobile})`
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Pickup Location
                  </Typography>
                  <Typography variant="body1">{selectedRide.start_location || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Drop Location
                  </Typography>
                  <Typography variant="body1">{selectedRide.end_location || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Scheduled Time
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedRide.scheduled_time)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Seats Available
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.seats_available - selectedRide.seats_booked} / {selectedRide.seats_available}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Price per Seat
                  </Typography>
                  <Typography variant="body1">{formatCurrency(selectedRide.price_per_seat)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Per KM Rate
                  </Typography>
                  <Typography variant="body1">{formatCurrency(selectedRide.per_km_rate)}</Typography>
                </Grid>
                {selectedRide.distance_km && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Distance
                    </Typography>
                    <Typography variant="body1">{selectedRide.distance_km} km</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Created At
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedRide.createdAt)}</Typography>
                </Grid>
                {selectedRide.is_surge && (
                  <Grid size={{ xs: 12 }}>
                    <Chip label="Surge Pricing Applied" color="warning" size="small" />
                    {selectedRide.surge_multiplier && (
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        Multiplier: {Number(selectedRide.surge_multiplier).toFixed(2)}x
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

