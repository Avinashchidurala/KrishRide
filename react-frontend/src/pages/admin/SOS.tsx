import { useState, useEffect } from 'react';
import {
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminSOS() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadSOSAlerts();
  }, [page, limit, statusFilter]);

  const loadSOSAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getSOSAlerts({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
      });
      setSosAlerts(data.sosAlerts || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'acknowledged':
        return 'info';
      case 'active':
        return 'error';
      default:
        return 'warning';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const handleViewLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleUpdateStatus = async (alertId: string, newStatus: 'acknowledged' | 'resolved') => {
    try {
      setUpdatingId(alertId);
      setError('');
      setSuccess('');
      
      await adminApi.updateSOSAlertStatus(alertId, newStatus);
      
      setSuccess(`SOS alert ${newStatus === 'acknowledged' ? 'acknowledged' : 'resolved'} successfully`);
      
      // Reload alerts to reflect the update
      await loadSOSAlerts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || `Failed to ${newStatus === 'acknowledged' ? 'acknowledge' : 'resolve'} SOS alert`);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeAlerts = sosAlerts.filter((alert) => alert.status === 'active').length;

  if (loading && sosAlerts.length === 0) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="SOS Alerts">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          {activeAlerts > 0 && (
            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, mb: 1 }}>
              {activeAlerts} active alert(s) requiring attention
            </Typography>
          )}
        </Box>
        <IconButton onClick={loadSOSAlerts} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 192 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            label="Filter by Status"
            renderValue={(selected) => {
              if (selected === '') return 'All';
              if (selected === 'active') return 'Active';
              if (selected === 'acknowledged') return 'Acknowledged';
              if (selected === 'resolved') return 'Resolved';
              return selected || 'All';
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="acknowledged">Acknowledged</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {sosAlerts.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No SOS alerts found
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Mobile</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Message</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sosAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {alert.user?.first_name} {alert.user?.last_name}
                    </TableCell>
                    <TableCell>{alert.user?.mobile}</TableCell>
                    <TableCell>
                      {alert.latitude && alert.longitude ? (
                        <Button
                          size="small"
                          startIcon={<LocationIcon />}
                          onClick={() => handleViewLocation(alert.latitude, alert.longitude)}
                        >
                          View Map
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {alert.message || 'Emergency SOS alert'}
                    </TableCell>
                    <TableCell>
                      {formatDate(alert.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        color={getStatusColor(alert.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {alert.status === 'active' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleUpdateStatus(alert.id, 'acknowledged')}
                            disabled={updatingId === alert.id}
                          >
                            {updatingId === alert.id ? 'Updating...' : 'Acknowledge'}
                          </Button>
                        )}
                        {(alert.status === 'active' || alert.status === 'acknowledged') && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<DoneIcon />}
                            onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                            disabled={updatingId === alert.id}
                          >
                            {updatingId === alert.id ? 'Updating...' : 'Resolve'}
                          </Button>
                        )}
                      </Box>
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
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </>
      )}
    </PageContainer>
  );
}
