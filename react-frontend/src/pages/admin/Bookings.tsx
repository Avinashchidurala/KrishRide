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
  Divider,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, Block as DeactivateIcon, Visibility as ViewIcon, CheckCircle as ActivateIcon, FileDownload as DownloadIcon, Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Cancel Dialog State
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any>(null);
  const [refundStatus, setRefundStatus] = useState('refund_initiated');

  // Payment Status Edit State
  const [isEditingPaymentStatus, setIsEditingPaymentStatus] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  

  useEffect(() => {
    loadBookings();
  }, [page, limit, statusFilter, paymentStatusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading bookings with params:', { page: page + 1, limit, statusFilter, paymentStatusFilter });
      const data = await adminApi.getBookings({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
      });
      console.log('Bookings API response:', data);
      console.log('Bookings array:', data?.bookings);
      console.log('Total count:', data?.pagination?.total);
      
      // Handle different response structures
      if (data) {
        if (Array.isArray(data)) {
          // If response is directly an array
          setBookings(data);
          setTotal(data.length);
        } else if (data.bookings) {
          // Standard response structure
          setBookings(data.bookings);
          setTotal(data.pagination?.total || data.bookings.length);
        } else if (data.data?.bookings) {
          // Nested response structure
          setBookings(data.data.bookings);
          setTotal(data.data.pagination?.total || data.data.bookings.length);
        } else {
          console.warn('Unexpected response structure:', data);
          setBookings([]);
          setTotal(0);
        }
      } else {
        setBookings([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load bookings';
      setError(errorMessage);
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelDialog = (booking: any) => {
    setBookingToCancel(booking);
    setRefundStatus('refund_initiated');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      const data = bookingToCancel.paymentStatus === 'success' 
        ? { paymentStatus: refundStatus } 
        : undefined;

      await adminApi.AdminBookingCancel(bookingToCancel.id, data);
      loadBookings();
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedBooking || !newPaymentStatus) return;

    try {
      await adminApi.updateBookingPaymentStatus(selectedBooking.id, newPaymentStatus);
      // Update local state
      setSelectedBooking({ ...selectedBooking, paymentStatus: newPaymentStatus });
      setIsEditingPaymentStatus(false);
      loadBookings(); // Refresh list to reflect changes
    } catch (err: any) {
      setError(err.message || 'Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      case 'started':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'refunded':
        return 'success';
      case 'pending':
      case 'refund_initiated':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | string | any) => {
    // Handle Prisma Decimal objects and other types
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    return `₹${numAmount.toFixed(2)}`;
  };

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setNewPaymentStatus(booking.paymentStatus);
    setIsEditingPaymentStatus(false);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedBooking(null);
  };

  if (loading && bookings.length === 0) {
    return (
      <PageContainer maxWidth="xl" title="Bookings Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }
  const handleExportBookings = async () => {
      try {
        setExporting(true);
        const blob = await adminApi.exportBookings({
          status: statusFilter || undefined,
          paymentStatus: paymentStatusFilter || undefined,
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'bookings.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        alert(err.message || 'Failed to export bookings');
      } finally {
        setExporting(false);
      }
    };
  return (
    <PageContainer maxWidth="xl" title="Bookings Management" subtitle="View and manage all customer bookings">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExportBookings}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Booking Status</InputLabel>
            <Select
              value={statusFilter}
              label="Booking Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected === '') return 'All';
                if (selected === 'pending') return 'Pending';
                if (selected === 'confirmed') return 'Confirmed';
                if (selected === 'started') return 'Started';
                if (selected === 'completed') return 'Completed';
                if (selected === 'cancelled') return 'Cancelled';
                return selected || 'All';
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="started">Started</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={paymentStatusFilter}
              label="Payment Status"
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected === '') return 'All';
                if (selected === 'pending') return 'Pending';
                if (selected === 'success') return 'Success';
                if (selected === 'failed') return 'Failed';
                if (selected === 'refund_initiated') return 'Refund Initiated';
                if (selected === 'refunded') return 'Refunded';
                return selected || 'All';
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refund_initiated">Refund Initiated</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={loadBookings} sx={{ borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Passengers</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Total Fare</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Booking Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Payment Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {error ? 'Error loading bookings' : 'No bookings found'}
                    </Typography>
                    {total > 0 && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Total bookings in database: {total}
                      </Typography>
                    )}
                    {!error && (
                      <Button
                        variant="outlined"
                        onClick={loadBookings}
                        startIcon={<RefreshIcon />}
                        sx={{ mt: 1 }}
                      >
                        Refresh
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 && loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow 
                  key={booking.id} 
                  hover 
                  onClick={() => handleViewBooking(booking)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{booking.booking_number || booking.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    {booking.customer?.user
                      ? `${booking.customer.user.first_name || booking.customer.user.firstName || ''} ${booking.customer.user.last_name || booking.customer.user.lastName || ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {booking.ride?.driver?.user
                      ? `${booking.ride.driver.user.first_name || booking.ride.driver.user.firstName || ''} ${booking.ride.driver.user.last_name || booking.ride.driver.user.lastName || ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {booking?.pickup_location || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        → {booking?.drop_location || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{booking.passengerCount}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {formatCurrency(booking.total_fare)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.paymentStatus}
                      color={getPaymentStatusColor(booking.paymentStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(booking.createdAt || booking.created_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {booking.status === "confirmed" ? (
                    <IconButton
                      size="small"
                      // onClick={() => handleRideCancel(booking.id)}
                        onClick={(e) => {
                          e.stopPropagation();  
                          handleOpenCancelDialog(booking);
                        }}
                        color="error"
                      >
                        <DeactivateIcon />
                      </IconButton>
                    ):(
                      <IconButton
                        size="small"
                        // onClick={() => handleRideCancel(booking.id)}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleOpenCancelDialog(booking);
                      }}
                        color="error"
                      >
                        <ActivateIcon />
                      </IconButton>
                    )}
                    </Box>
                  </TableCell>
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

      {/* Booking Details Dialog */}
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
            <Typography variant="h6">Booking Details</Typography>
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
          {selectedBooking && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Booking Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedBooking.booking_number || selectedBooking.id}
                  </Typography>
                </Grid>
                <Divider sx={{ width: '100%' }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Booking Status
                  </Typography>
                  <Chip
                    label={selectedBooking.status}
                    color={getStatusColor(selectedBooking.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Payment Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isEditingPaymentStatus ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={newPaymentStatus}
                            onChange={(e) => setNewPaymentStatus(e.target.value)}
                            size="small"
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="success">Success</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="refund_initiated">Refund Initiated</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton size="small" onClick={handleUpdatePaymentStatus} color="primary">
                          <SaveIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => setIsEditingPaymentStatus(false)} color="default">
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Chip
                        l label={selectedBooking.paymentStatus}
                          color={getPaymentStatusColor(selectedBooking.paymentStatus) as any}
                          size="small"
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setNewPaymentStatus(selectedBooking.paymentStatus);
                            setIsEditingPaymentStatus(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.customer?.user
                      ? `${selectedBooking.customer.user.first_name || selectedBooking.customer.user.firstName || ''} ${selectedBooking.customer.user.last_name || selectedBooking.customer.user.lastName || ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </Typography>
                  {selectedBooking.customer?.user?.mobile && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedBooking.customer.user.mobile}
                    </Typography>
                  )}
                  {selectedBooking.customer?.user?.email && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {selectedBooking.customer.user.email}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Driver
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.ride?.driver?.user
                      ? `${selectedBooking.ride.driver.user.first_name || selectedBooking.ride.driver.user.firstName || ''} ${selectedBooking.ride.driver.user.last_name || selectedBooking.ride.driver.user.lastName || ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </Typography>
                  {selectedBooking.ride?.driver?.user?.mobile && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedBooking.ride.driver.user.mobile}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Pickup Location
                  </Typography>
                  <Typography variant="body1">{selectedBooking.pickup_location || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Drop Location
                  </Typography>
                  <Typography variant="body1">{selectedBooking.drop_location || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Scheduled Time
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.ride?.scheduled_time ? formatDate(selectedBooking.ride.scheduled_time) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Passengers
                  </Typography>
                  <Typography variant="body1">{selectedBooking.passengerCount || 'N/A'}</Typography>
                </Grid>
                <Divider sx={{ width: '100%' }} />
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    Fare Breakdown
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Base Fare
                  </Typography>
                  <Typography variant="body1">{formatCurrency(selectedBooking.base_fare)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Platform Fee
                  </Typography>
                  <Typography variant="body1">{formatCurrency(selectedBooking.platform_fee)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Driver Fee
                  </Typography>
                  <Typography variant="body1">{formatCurrency(selectedBooking.driver_fee)}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Total Fare
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(selectedBooking.total_fare)}
                    </Typography>
                  </Box>
                </Grid>
                {selectedBooking.utr_number && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      UTR Number
                    </Typography>
                    <Typography variant="body1">{selectedBooking.utr_number}</Typography>
                  </Grid>
                )}
                {selectedBooking.paymentMethod && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                      Payment Method
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {selectedBooking.paymentMethod}
                    </Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedBooking.createdAt || selectedBooking.created_at)}
                  </Typography>
                </Grid>
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


      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel booking #{bookingToCancel?.booking_number || bookingToCancel?.id}?
              This action cannot be undone.
            </Typography>

            {bookingToCancel?.paymentStatus === 'success' && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Refund Status</InputLabel>
                <Select
                  value={refundStatus}
                  label="Refund Status"
                  onChange={(e) => setRefundStatus(e.target.value)}
                >
                  <MenuItem value="refund_initiated">Refund Initiated</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                  Select "Refund Initiated" if you plan to process the refund later, or "Refunded" if it has been processed.
                </Typography>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="inherit">
            Keep Booking
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

