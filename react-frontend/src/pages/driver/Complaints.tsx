import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
import { complaintsApi } from '../../services/complaintsApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function CustomerComplaints() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bookingId: '',
    subject: '',
    description: '',
  });

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page: 1, limit: 50 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await complaintsApi.getComplaints(params);
      setComplaints(data.complaints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Subject and description are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await complaintsApi.createComplaint({
        bookingId: formData.bookingId || undefined,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });
      setCreateDialogOpen(false);
      setFormData({ bookingId: '', subject: '', description: '' });
      loadComplaints();
    } catch (err: any) {
      setError(err.message || 'Failed to create complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewComplaint = async (complaint: any) => {
    try {
      const data = await complaintsApi.getComplaint(complaint.id);
      setSelectedComplaint(data.complaint);
      setViewDialogOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaint details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
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

  return (
    <PageContainer maxWidth="lg" title="My Complaints" subtitle="Raise a complaint if you faced a serious issue or unfair treatment">
      <StandardCard sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          When to Raise a complaint
        </Typography>
      
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Raise a complaint if you faced a serious issue or unfair treatment.
        </Typography>
      
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>Customer behavior issues (rude, abusive, unsafe)</li>
          <li>Safety or security concerns during a trip</li>
          <li>Payment disputes or incorrect penalties</li>
          <li>Repeated issues not resolved through support tickets</li>
          <li>Misuse of the platform or policy violations</li>
        </Box>
      
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
    ⚠️ Complaints are formally reviewed and may take longer to resolve.  
    Please raise a <strong>Support Ticket first</strong> for regular issues.
  </Typography>
      </StandardCard>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Create Complaint
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : complaints.length === 0 ? (
        <StandardCard>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
              No complaints found
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Create Your First Complaint
            </Button>
          </Box>
        </StandardCard>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}> Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id} hover>
                  <TableCell>{complaint.subject}</TableCell>
                  <TableCell>
                    <Chip
                      label={complaint.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(complaint.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(complaint.createdAt || complaint.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewComplaint(complaint)}
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

      {/* Create Complaint Dialog */}
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
            Create Complaint
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
            onClick={handleCreateComplaint}
            disabled={submitting || !formData.subject.trim() || !formData.description.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Complaint'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Complaint Dialog */}
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
            Complaint Details
          </Typography>
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Subject
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedComplaint.subject}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedComplaint.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedComplaint.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedComplaint.status) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                     Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedComplaint.createdAt || selectedComplaint.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              {selectedComplaint.bookingId && (
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Booking ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedComplaint.bookingId}
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

