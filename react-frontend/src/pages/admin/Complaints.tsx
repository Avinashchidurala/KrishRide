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
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as ResolveIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminComplaints() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadComplaints();
  }, [page, limit, statusFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getComplaints({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
      });
      setComplaints(data.complaints || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (complaint: any) => {
    setSelectedComplaint(complaint);
    setResolution(complaint.resolution || '');
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedComplaint) return;

    try {
      await adminApi.updateComplaint(selectedComplaint.id, status, resolution);
      setDialogOpen(false);
      loadComplaints();
    } catch (err: any) {
      setError(err.message || 'Failed to update complaint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'error';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading && complaints.length === 0) {
    return (
      <PageContainer maxWidth="xl" title="Complaints Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="Complaints Management" subtitle="View and resolve customer complaints">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
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
                if (selected === 'pending') return 'Pending';
                if (selected === 'in_progress') return 'In Progress';
                if (selected === 'resolved') return 'Resolved';
                return selected || 'All';
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={loadComplaints} sx={{ borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No complaints found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow key={complaint.id} hover>
                  <TableCell>{complaint.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {complaint.user
                      ? `${complaint.user.first_name} ${complaint.user.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {complaint.subject}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {complaint.description}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={complaint.status}
                      color={getStatusColor(complaint.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(complaint.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleView(complaint)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
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

      {/* Complaint Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complaint Details</DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  User
                </Typography>
                <Typography variant="body1">
                  {selectedComplaint.user
                    ? `${selectedComplaint.user.first_name} ${selectedComplaint.user.last_name} (${selectedComplaint.user.email})`
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Subject
                </Typography>
                <Typography variant="body1">{selectedComplaint.subject}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1">{selectedComplaint.description}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedComplaint.status}
                  color={getStatusColor(selectedComplaint.status) as any}
                  size="small"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
          {selectedComplaint?.status !== 'resolved' && (
            <>
              <Button
                onClick={() => handleUpdateStatus('in_progress')}
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Mark In Progress
              </Button>
              <Button
                onClick={() => handleUpdateStatus('resolved')}
                variant="contained"
                startIcon={<ResolveIcon />}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Resolve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

