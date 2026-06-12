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
  Assignment as AssignIcon,
  CheckCircle as ResolveIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import { useAppSelector } from '../../app/hooks';
import PageContainer from '../../components/common/PageContainer';

export default function AdminSupportTickets() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [page, limit, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getSupportTickets({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(data.tickets || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (ticket: any) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  const handleUpdate = async (updates: { status?: string; priority?: string; assignedTo?: string }) => {
    if (!selectedTicket) return;

    try {
      await adminApi.updateSupportTicket(selectedTicket.id, updates);
      setDialogOpen(false);
      loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'assigned':
        return 'warning';
      case 'open':
        return 'default';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading && tickets.length === 0) {
    return (
      <PageContainer maxWidth="xl" title="Support Tickets Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="Support Tickets Management" subtitle="Manage customer support tickets and inquiries">
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
                if (selected === 'open') return 'Open';
                if (selected === 'assigned') return 'Assigned';
                if (selected === 'in_progress') return 'In Progress';
                if (selected === 'resolved') return 'Resolved';
                if (selected === 'closed') return 'Closed';
                return selected || 'All';
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected === '') return 'All';
                if (selected === 'urgent') return 'Urgent';
                if (selected === 'high') return 'High';
                if (selected === 'medium') return 'Medium';
                if (selected === 'low') return 'Low';
                return selected || 'All';
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={loadTickets} sx={{ borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Ticket ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No support tickets found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>{ticket.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {ticket.user
                      ? `${ticket.user.first_name} ${ticket.user.last_name}`
                      : 'System'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      color={getPriorityColor(ticket.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      color={getStatusColor(ticket.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{ticket.assigned_to || 'Unassigned'}</TableCell>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleView(ticket)}
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

      {/* Ticket Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Support Ticket Details</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  User
                </Typography>
                <Typography variant="body1">
                  {selectedTicket.user
                    ? `${selectedTicket.user.first_name} ${selectedTicket.user.last_name} (${selectedTicket.user.email})`
                    : 'System Generated'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Subject
                </Typography>
                <Typography variant="body1">{selectedTicket.subject}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedTicket.priority}
                    color={getPriorityColor(selectedTicket.priority) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedTicket.status}
                    color={getStatusColor(selectedTicket.status) as any}
                    size="small"
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Assigned To
                </Typography>
                <Typography variant="body1">
                  {selectedTicket.assigned_to || 'Unassigned'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Close</Button>
          {selectedTicket?.status !== 'resolved' && selectedTicket?.status !== 'closed' && (
            <>
              {!selectedTicket?.assigned_to && (
                <Button
                  onClick={() => handleUpdate({ assignedTo: user?.userId })}
                  variant="outlined"
                  startIcon={<AssignIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Assign to Me
                </Button>
              )}
              <Button
                onClick={() => handleUpdate({ status: 'in_progress' })}
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Mark In Progress
              </Button>
              <Button
                onClick={() => handleUpdate({ status: 'resolved' })}
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

