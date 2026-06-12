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
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';

export default function AdminPayouts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [creatingPayout, setCreatingPayout] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPayouts();
  }, [page, limit, statusFilter]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getPayouts({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
      });
      setPayouts(data.payouts || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedPayout) return;

    try {
      await adminApi.updatePayoutStatus(selectedPayout.id, status, transactionId);
      setDialogOpen(false);
      setTransactionId('');
      loadPayouts();
    } catch (err: any) {
      setError(err.message || 'Failed to update payout status');
    }
  };

  const handleView = (payout: any) => {
    setSelectedPayout(payout);
    setTransactionId(payout.transaction_id || '');
    setDialogOpen(true);
  };

  const handleOpenCreateDialog = async () => {
    setCreateDialogOpen(true);
    await loadDrivers();
  };

  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const data = await adminApi.getDriversWalletBalances({
        page: 1,
        limit: 100,
      });
      setDrivers(data.drivers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!selectedDriver) {
      setError('Please select a driver');
      return;
    }

    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > selectedDriver.availableForPayout) {
      setError(`Insufficient available balance. Available: ₹${selectedDriver.availableForPayout.toFixed(2)}`);
      return;
    }

    if (payoutMethod === 'bank' && !selectedDriver.hasBankDetails) {
      setError('Driver bank details are required for bank payouts');
      return;
    }

    try {
      setCreatingPayout(true);
      setError('');
      await adminApi.createPayout({
        driverId: selectedDriver.id,
        amount,
        payoutMethod,
      });
      setSuccess('Payout created successfully');
      setCreateDialogOpen(false);
      setSelectedDriver(null);
      setPayoutAmount('');
      setPayoutMethod('bank');
      await loadPayouts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create payout');
    } finally {
      setCreatingPayout(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && payouts.length === 0) {
    return (
      <PageContainer maxWidth="xl" title="Driver Payouts Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" title="Driver Payouts Management" subtitle="Manage driver payout requests and processing">
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

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                  if (selected === 'processing') return 'Processing';
                  if (selected === 'completed') return 'Completed';
                  if (selected === 'failed') return 'Failed';
                  return selected || 'All';
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={loadPayouts} sx={{ borderRadius: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Create Payout
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Payout ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No payouts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((payout) => (
                <TableRow key={payout.id} hover>
                  <TableCell>{payout.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {payout.driver?.user
                      ? `${payout.driver.user.first_name} ${payout.driver.user.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {formatCurrency(Number(payout.amount))}
                  </TableCell>
                  <TableCell>{payout.payout_method}</TableCell>
                  <TableCell>
                    <Chip
                      label={payout.status}
                      color={getStatusColor(payout.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {payout.transaction_id || '-'}
                  </TableCell>
                  <TableCell>{formatDate(payout.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleView(payout)}
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

      {/* Payout Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payout Details</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Driver
                </Typography>
                <Typography variant="body1">
                  {selectedPayout.driver?.user
                    ? `${selectedPayout.driver.user.first_name} ${selectedPayout.driver.user.last_name} (${selectedPayout.driver.user.mobile})`
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(Number(selectedPayout.amount))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Payout Method
                </Typography>
                <Typography variant="body1">{selectedPayout.payout_method}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BankIcon fontSize="small" />
                  Bank Account Details
                </Typography>
                {selectedPayout.driver?.bank_name ? (
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Bank Name:</strong> {selectedPayout.driver.bank_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Account Number:</strong> {selectedPayout.driver.bank_account_number || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>IFSC Code:</strong> {selectedPayout.driver.bank_ifsc_code || 'N/A'}
                    </Typography>
                    {selectedPayout.driver.bank_account_holder_name && (
                      <Typography variant="body2">
                        <strong>Account Holder:</strong> {selectedPayout.driver.bank_account_holder_name}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    Bank details not available
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedPayout.status}
                  color={getStatusColor(selectedPayout.status) as any}
                  size="small"
                />
              </Box>
              <TextField
                fullWidth
                label="Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Close</Button>
          {selectedPayout?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleUpdateStatus('processing')}
                variant="outlined"
                startIcon={<ApproveIcon />}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Mark Processing
              </Button>
              <Button
                onClick={() => handleUpdateStatus('completed')}
                variant="contained"
                startIcon={<ApproveIcon />}
                disabled={!transactionId}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Complete
              </Button>
            </>
          )}
          {selectedPayout?.status === 'processing' && (
            <Button
              onClick={() => handleUpdateStatus('completed')}
              variant="contained"
              startIcon={<ApproveIcon />}
              disabled={!transactionId}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Complete
            </Button>
          )}
          {selectedPayout?.status !== 'completed' && selectedPayout?.status !== 'failed' && (
            <Button
              onClick={() => handleUpdateStatus('failed')}
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Mark Failed
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Payout Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={selectedDriver?.id || ''}
                label="Select Driver"
                onChange={(e) => {
                  const driver = drivers.find(d => d.id === e.target.value);
                  setSelectedDriver(driver || null);
                  if (driver) {
                    setPayoutAmount(driver.availableForPayout > 0 ? driver.availableForPayout.toString() : '');
                  }
                }}
                disabled={loadingDrivers}
                renderValue={(selected) => {
                  if (!selected) return 'Select a driver';
                  const driver = drivers.find(d => d.id === selected);
                  if (!driver) return 'Select a driver';
                  return `${driver.name} (${driver.mobile}) - Available: ₹${driver.availableForPayout.toFixed(2)}`;
                }}
              >
                {loadingDrivers ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading drivers...
                  </MenuItem>
                ) : drivers.length === 0 ? (
                  <MenuItem disabled>No drivers found</MenuItem>
                ) : (
                  drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {driver.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {driver.mobile} • Wallet: ₹{driver.walletBalance.toFixed(2)} • Available: ₹{driver.availableForPayout.toFixed(2)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {selectedDriver && (
              <>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Driver Wallet Information
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Wallet Balance:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{selectedDriver.walletBalance.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Pending Payouts:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      ₹{selectedDriver.pendingPayouts.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Available for Payout:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                      ₹{selectedDriver.availableForPayout.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {selectedDriver.hasBankDetails && (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, border: '1px solid', borderColor: 'info.main' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BankIcon fontSize="small" />
                      Bank Account Details
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Bank:</strong> {selectedDriver.bankName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>IFSC:</strong> {selectedDriver.bankIFSC}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Account:</strong> {selectedDriver.bankAccount}
                    </Typography>
                  </Box>
                )}

                {!selectedDriver.hasBankDetails && (
                  <Alert severity="warning">
                    This driver has not set up bank account details. Please ask them to update their bank details before creating a payout.
                  </Alert>
                )}

                <TextField
                  label="Payout Amount (₹)"
                  type="number"
                  fullWidth
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  inputProps={{ min: 0, max: selectedDriver.availableForPayout, step: 0.01 }}
                  helperText={`Maximum available: ₹${selectedDriver.availableForPayout.toFixed(2)}`}
                  error={parseFloat(payoutAmount) > selectedDriver.availableForPayout}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <FormControl fullWidth>
                  <InputLabel>Payout Method</InputLabel>
                  <Select
                    value={payoutMethod}
                    label="Payout Method"
                    onChange={(e) => setPayoutMethod(e.target.value)}
                  >
                    <MenuItem value="bank">Bank Transfer</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCreateDialogOpen(false);
              setSelectedDriver(null);
              setPayoutAmount('');
              setPayoutMethod('bank');
            }} 
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePayout}
            disabled={!selectedDriver || !payoutAmount || creatingPayout || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > (selectedDriver?.availableForPayout || 0)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
            startIcon={creatingPayout ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creatingPayout ? 'Creating...' : 'Create Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

