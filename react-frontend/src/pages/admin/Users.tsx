import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  LocalTaxi as DriverIcon,
  Person as PersonIcon,
  Person as CustomerIcon,
  Add as AddIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import StatsCard from '../../components/admin/StatsCard';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    role: 'customer' as 'customer' | 'driver' | 'admin',
    gender: '',
    age: 25,
    emergencyContactName: '',
    emergencyContactMobile: '',
  });

  useEffect(() => {
    loadUsers();
  }, [pagination.page, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        role: roleFilter || undefined,
        search: search || undefined,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadUsers();
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleViewUser = async (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleExportUsers = async () => {
    try {
      setExporting(true);
      const blob = await adminApi.exportUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      });
      
      // Create download linka
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.mobile) {
      alert('Please fill in all required fields');
      return;
    }

    if (!newUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setCreatingUser(true);
      await adminApi.createUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        mobile: newUser.mobile,
        email: newUser.email,
        role: newUser.role,
        gender: newUser.gender || undefined,
        age: newUser.age,
        emergencyContactName: newUser.emergencyContactName || undefined,
        emergencyContactMobile: newUser.emergencyContactMobile || undefined,
      });
      setAddUserDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        mobile: '',
        email: '',
        role: 'customer',
        gender: '',
        age: 25,
        emergencyContactName: '',
        emergencyContactMobile: '',
      });
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const stats = {
    total: users.length,
    customers: users.filter((u) => u.role === 'customer').length,
    drivers: users.filter((u) => u.role === 'driver').length,
    active: users.filter((u) => u.is_active).length,
  };

  return (
    <PageContainer maxWidth="xl" title="User Management" subtitle="Manage all platform users, customers, and drivers">

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              icon={PeopleIcon}
              title="Total Users"
              value={pagination.total.toString()}
              subtitle="All platform users"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              icon={PersonIcon}
              title="Customers"
              value={stats.customers.toString()}
              subtitle="Active customers"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              icon={DriverIcon}
              title="Drivers"
              value={stats.drivers.toString()}
              subtitle="Registered drivers"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              icon={CheckIcon}
              title="Active Users"
              value={stats.active.toString()}
              subtitle="Currently active"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Search & Filter
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExportUsers}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddUserDialogOpen(true)}
              >
                Add User
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: '200px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl size="small" sx={{ minWidth: '150px' }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                renderValue={(selected) => {
                  if (selected === '') return 'All Roles';
                  if (selected === 'customer') return 'Customer';
                  if (selected === 'driver') return 'Driver';
                  if (selected === 'admin') return 'Admin';
                  return selected;
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              startIcon={<SearchIcon />}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Search
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          No users found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.mobile}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <Chip label={user.role} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewUser(user.id)}
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              color={user.is_active ? 'error' : 'success'}
                            >
                              {user.is_active ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={(_, page) => setPagination({ ...pagination, page })}
                color="primary"
              />
            </Box>
          </>
        )}


        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="First Name"
                required
                fullWidth
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                error={newUser.firstName.length > 0 && newUser.firstName.trim().length === 0}
                helperText={newUser.firstName.length > 0 && newUser.firstName.trim().length === 0 ? 'First name cannot be empty' : ''}
              />
              <TextField
                label="Last Name"
                required
                fullWidth
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                error={newUser.lastName.length > 0 && newUser.lastName.trim().length === 0}
                helperText={newUser.lastName.length > 0 && newUser.lastName.trim().length === 0 ? 'Last name cannot be empty' : ''}
              />
              <TextField
                label="Mobile Number"
                required
                fullWidth
                value={newUser.mobile}
                onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                error={newUser.mobile.length > 0 && newUser.mobile.length < 10}
                helperText={newUser.mobile.length > 0 && newUser.mobile.length < 10 ? 'Mobile number must be 10 digits' : 'Enter 10 digit mobile number'}
                inputProps={{ maxLength: 10 }}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                error={newUser.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)}
                helperText={newUser.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email) ? 'Please enter a valid email address' : 'Email is required'}
              />
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'customer' | 'driver' | 'admin' })}
                  renderValue={(selected) => {
                    if (selected === 'customer') return 'Customer';
                    if (selected === 'driver') return 'Driver';
                    if (selected === 'admin') return 'Admin';
                    return selected;
                  }}
                >
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={newUser.gender || ''}
                  label="Gender"
                  onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                  renderValue={(selected) => {
                    if (!selected || selected === '') return 'Select Gender';
                    if (selected === 'male') return 'Male';
                    if (selected === 'female') return 'Female';
                    if (selected === 'other') return 'Other';
                    return selected;
                  }}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Age"
                type="number"
                fullWidth
                value={newUser.age}
                onChange={(e) => setNewUser({ ...newUser, age: parseInt(e.target.value) || 25 })}
                inputProps={{ min: 1, max: 120 }}
              />
              <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Emergency Contact
              </Typography>
              <TextField
                label="Emergency Contact Name"
                fullWidth
                value={newUser.emergencyContactName}
                onChange={(e) => setNewUser({ ...newUser, emergencyContactName: e.target.value })}
                error={newUser.emergencyContactName.length > 0 && newUser.emergencyContactName.trim().length === 0}
                helperText={newUser.emergencyContactName.length > 0 && newUser.emergencyContactName.trim().length === 0 ? 'Contact name cannot be empty' : ''}
              />
              <TextField
                label="Emergency Contact Mobile"
                fullWidth
                value={newUser.emergencyContactMobile}
                onChange={(e) => setNewUser({ ...newUser, emergencyContactMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                error={newUser.emergencyContactMobile.length > 0 && newUser.emergencyContactMobile.length < 10}
                helperText={newUser.emergencyContactMobile.length > 0 && newUser.emergencyContactMobile.length < 10 ? 'Mobile number must be 10 digits' : 'Enter 10 digit mobile number'}
                inputProps={{ maxLength: 10 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddUser}
              disabled={creatingUser || !newUser.firstName || !newUser.lastName || !newUser.mobile || !newUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)}
            >
              {creatingUser ? <CircularProgress size={20} /> : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>
    </PageContainer>
  );
}

