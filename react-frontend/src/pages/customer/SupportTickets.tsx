import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { supportApi } from '../../services/supportApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function CustomerSupportTickets() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bookingId: '',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page: 1, limit: 50 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (priorityFilter) {
        params.priority = priorityFilter;
      }
      const data = await supportApi.getTickets(params);
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Subject and description are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await supportApi.createTicket({
        bookingId: formData.bookingId || undefined,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      });
      setCreateDialogOpen(false);
      setFormData({ bookingId: '', subject: '', description: '', priority: 'medium' });
      loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = async (ticket: any) => {
    try {
      const data = await supportApi.getTicket(ticket.id);
      setSelectedTicket(data.ticket);
      setViewDialogOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'assigned':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
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

  return (
    <PageContainer maxWidth="lg" title="Support Tickets" subtitle="Get help with bookings, trips, payments, website or app issues">
      <StandardCard sx={{ mb: 3 }}>
  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
    When to Raise a Support Ticket
  </Typography>

  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
    Customers should raise a support ticket for help with:
  </Typography>

  <Box component="ul" sx={{ pl: 3, mb: 2 }}>
    <li>App or website not working properly</li>
    <li>Login, OTP, or account access issues</li>
    <li>Booking or trip status questions</li>
    <li>Fare, payment, refund, or wallet issues</li>
    <li>Trip cancellation or rescheduling help</li>
    <li>Profile or account update assistance</li>
  </Box>

  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
   ⚠️ Please raise a <strong>Support Ticket first</strong>.  
    If the issue is not resolved or the experience is unsatisfactory, you may raise a <strong>Complaint</strong>.
  </Typography>
</StandardCard>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Create Ticket
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : tickets.length === 0 ? (
        <StandardCard>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
              No support tickets found
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Create Your First Ticket
            </Button>
          </Box>
        </StandardCard>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority.toUpperCase()}
                      color={getPriorityColor(ticket.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(ticket.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt || ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewTicket(ticket)}
                      sx={{ color: 'primary.main' }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Ticket Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !submitting && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create Support Ticket
          </Typography>
          <IconButton
            onClick={() => !submitting && setCreateDialogOpen(false)}
            disabled={submitting}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="Booking ID (Optional)"
              value={formData.bookingId}
              onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              fullWidth
              disabled={submitting}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              fullWidth
              disabled={submitting}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              multiline
              rows={6}
              fullWidth
              disabled={submitting}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                disabled={submitting}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={submitting}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTicket}
            disabled={submitting || !formData.subject.trim() || !formData.description.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create Ticket'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ticket Details
          </Typography>
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Subject
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedTicket.subject}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedTicket.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedTicket.priority.toUpperCase()}
                    color={getPriorityColor(selectedTicket.priority) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedTicket.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedTicket.status) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedTicket.createdAt || selectedTicket.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              {selectedTicket.bookingId && (
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Booking ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedTicket.bookingId}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

