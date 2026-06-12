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
  CircularProgress,
  Alert,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminLiveRides() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rides, setRides] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadLiveRides();
  }, [page, limit]);

  const loadLiveRides = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getLiveRides({
        page: page + 1,
        limit,
      });
      setRides(data.liveRides || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load live rides');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
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
      <PageContainer maxWidth="xl" title="Live Rides">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="Live Rides" action={
      <IconButton onClick={loadLiveRides} disabled={loading} sx={{ borderRadius: 2 }}>
        <RefreshIcon />
      </IconButton>
    }>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {rides.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No active rides
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ride ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Passengers</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Started At</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rides.map((ride) => (
                  <TableRow 
                    key={ride.id} 
                    hover
                    onClick={() => handleViewRide(ride)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{ride.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      {ride.driver?.name || `${ride.driver?.user?.first_name || ''} ${ride.driver?.user?.last_name || ''}`}
                      <br />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {ride.driver?.mobile || ride.driver?.user?.mobile}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {ride.route?.startLocation || ride.start_location} → {ride.route?.endLocation || ride.end_location}
                    </TableCell>
                    <TableCell>
                      {ride.vehicle?.model || ride.vehicle?.vehicle_model} ({ride.vehicle?.plateNumber || ride.vehicle?.vehicle_plate_number})
                    </TableCell>
                    <TableCell>
                      {ride.bookings?.reduce((sum: number, b: any) => sum + (b.passengerCount || 0), 0) || 0}
                    </TableCell>
                    <TableCell>
                      {ride.startedAt ? formatDate(ride.startedAt) : ride.started_at ? formatDate(ride.started_at) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={ride.status || 'started'} color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </>
      )}

      {/* Live Ride Details Dialog */}
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
            <Typography variant="h6">Live Ride Details</Typography>
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
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Ride ID
                  </Typography>
                  <Typography variant="body1">{selectedRide.id}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Driver
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.driver?.name || `${selectedRide.driver?.user?.first_name || ''} ${selectedRide.driver?.user?.last_name || ''}`.trim() || 'N/A'}
                  </Typography>
                  {(selectedRide.driver?.mobile || selectedRide.driver?.user?.mobile) && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedRide.driver?.mobile || selectedRide.driver?.user?.mobile}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Route
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.route?.startLocation || selectedRide.start_location || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    → {selectedRide.route?.endLocation || selectedRide.end_location || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Vehicle
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.vehicle?.model || selectedRide.vehicle?.vehicle_model || 'N/A'}
                    {(selectedRide.vehicle?.plateNumber || selectedRide.vehicle?.vehicle_plate_number) && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {selectedRide.vehicle?.plateNumber || selectedRide.vehicle?.vehicle_plate_number}
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Total Passengers
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.bookings?.reduce((sum: number, b: any) => sum + (b.passengerCount || 0), 0) || 0}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Started At
                  </Typography>
                  <Typography variant="body1">
                    {selectedRide.startedAt ? formatDate(selectedRide.startedAt) : selectedRide.started_at ? formatDate(selectedRide.started_at) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Status
                  </Typography>
                  <Chip label={selectedRide.status || 'started'} color="primary" size="small" />
                </Grid>
                {selectedRide.bookings && selectedRide.bookings.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                      Bookings ({selectedRide.bookings.length})
                    </Typography>
                    {selectedRide.bookings.map((booking: any, index: number) => (
                      <Box key={booking.id || index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {booking.booking_number || booking.id?.substring(0, 8)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {booking.customer?.name || `${booking.customer?.user?.first_name || ''} ${booking.customer?.user?.last_name || ''}`} - {booking.passengerCount || 0} passenger(s)
                        </Typography>
                      </Box>
                    ))}
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

