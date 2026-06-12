import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell
} from '@mui/material';
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Assignment as AssignmentIcon,
  AttachMoney as DollarIcon,
  PersonAdd as PersonAddIcon,
  DriveEta as DriveEtaIcon,
  BookOnline as BookOnlineIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/admin/StatsCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRides: 0,
    totalBookings: 0,
    totalRevenue: 0,
    cancelledBookings: 0,
  });
  const [recentActivity, setRecentActivity] = useState<{
    recentUsers: any[];
    recentRides: any[];
    recentBookings: any[];
  }>({
    recentUsers: [],
    recentRides: [],
    recentBookings: [],
  });
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      // Handle different response structures
      console.log('Dashboard stats response:', response.stats);
      if (response.stats) {
        // Current API structure
        setStats({
          totalUsers: response.stats.totalUsers || 0,
          totalRides: response.stats.totalRides || 0,
          totalBookings: response.stats.completedBookings || 0,
          totalRevenue: response.stats.totalRevenue || 0,
          cancelledBookings: response.stats.cancelledBookings || 0,

        });
      } else if (response.data) {
        // Reference API structure
        // setStats({
        //   totalUsers: response.data.users?.total || 0,
        //   totalRides: response.data.rides?.total || 0,
        //   totalBookings: response.data.bookings?.total || 0,
        //   totalRevenue: response.data.revenue?.total || 0,
        //   cancelledBookings: response.data.bookings?.cancelled || 0,
        // });
      }
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const data = await adminApi.getRecentActivity();
      setRecentActivity({
        recentUsers: data.recentUsers || [],
        recentRides: data.recentRides || [],
        recentBookings: data.recentBookings || [],
      });
    } catch (error: any) {
      console.error('Error loading recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const quickActions = [
    {
      icon: PeopleIcon,
      title: 'Manage Users',
      subtitle: 'View and manage all users',
      path: '/admin/users',
      color: 'primary',
    },
    {
      icon: CarIcon,
      title: 'Manage Rides',
      subtitle: 'View and manage all rides',
      path: '/admin/rides',
      color: 'secondary',
    },
    {
      icon: DollarIcon,
      title: 'View Finance',
      subtitle: 'Check financial reports',
      path: '/admin/revenue',
      color: 'success',
    },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of platform statistics and activity
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                <Card elevation={2}>
                  <CardContent>
                    <Skeleton variant="rectangular" height={60} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatsCard
                icon={PeopleIcon}
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                subtitle="Active users"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatsCard
                icon={CarIcon}
                title="Total Rides"
                value={stats.totalRides.toLocaleString()}
                subtitle="This month"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatsCard
                icon={AssignmentIcon}
                title="Bookings"
                value={stats.totalBookings.toLocaleString()}
                subtitle="Completed"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatsCard
                icon={AssignmentIcon}
                title="Bookings"
                value={stats.cancelledBookings.toLocaleString()}
                subtitle="Cancelled"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatsCard
                icon={DollarIcon}
                title="Revenue"
                value={formatCurrency(stats.totalRevenue)}
                subtitle="This month"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Quick Actions */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Grid size={{ xs: 12, md: 4 }} key={action.title}>
                  <Card
                    elevation={1}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        elevation: 4,
                        borderColor: 'primary.main',
                        borderWidth: 2,
                        borderStyle: 'solid',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: `${action.color}.light`,
                          color: `${action.color}.main`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon />
                      </Box>
                      <Typography variant="h6" fontWeight="medium" gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.subtitle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Recent Activity
          </Typography>
          
          {activityLoading ? (
            <Box sx={{ py: 4 }}>
              <CircularProgress size={40} sx={{ display: 'block', margin: '0 auto' }} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Recent Users */}
              <Table size="small">
  <TableHead>
    <TableRow>
      <TableCell  sx={{ padding: '19px 0px' }}>Name</TableCell>
      <TableCell  sx={{ padding: '19px 0px' }}>Role</TableCell>
      <TableCell  sx={{ padding: '19px 0px' }}>Date</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {recentActivity.recentUsers.length === 0 ? (
      <TableRow>
        <TableCell colSpan={3} align="center">
          No recent users
        </TableCell>
      </TableRow>
    ) : (
      recentActivity.recentUsers.map((user) => (
        <TableRow
          key={user.id}
          hover
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/admin/users/${user.id}`)}
        >
          <TableCell  sx={{ padding: '19px 0px' }}>
            {user.first_name} {user.last_name}
          </TableCell>

          <TableCell  sx={{ padding: '19px 0px' }}>
            <Chip
              label={user.role}
              size="small"
              color={
                user.role === 'driver'
                  ? 'primary'
                  : user.role === 'customer'
                  ? 'success'
                  : 'default'
              }
            />
          </TableCell>

          <TableCell  sx={{ padding: '19px 0px' }}>
            {new Date(user.createdAt).toLocaleDateString()}
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
<Table size="small">
  <TableHead>
    <TableRow>
      <TableCell  sx={{ padding: '19px 0px' }}>Driver</TableCell>
      <TableCell  sx={{ padding: '19px 0px' }}>Route</TableCell>
      <TableCell  sx={{ padding: '19px 0px' }}>Date</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {recentActivity.recentRides.length === 0 ? (
      <TableRow>
        <TableCell colSpan={3} align="center">
          No recent rides
        </TableCell>
      </TableRow>
    ) : (
      recentActivity.recentRides.map((ride) => (
        <TableRow
          key={ride.id}
          hover
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin/rides')}
        >
          <TableCell  sx={{ padding: '19px 0px' }}>
            {ride.driver?.user
              ? `${ride.driver.user.first_name} ${ride.driver.user.last_name}`
              : 'Unknown Driver'}
          </TableCell>

          <TableCell  sx={{ padding: '19px 0px' }}>
            {ride.start_location?.substring(0, 20)} →{' '}
            {ride.end_location?.substring(0, 20)}
          </TableCell>

          <TableCell  sx={{ padding: '19px 0px' }}>
            {new Date(ride.createdAt).toLocaleDateString()}
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
<Table size="small">
  <TableHead>
    <TableRow>
      <TableCell  sx={{ padding: '19px 0px' }}>Customer</TableCell>
      <TableCell  sx={{ padding: '19px 0px' }}>Status</TableCell>
      <TableCell  sx={{ padding: '19px 0px' }}>Date</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {recentActivity.recentBookings.length === 0 ? (
      <TableRow>
        <TableCell colSpan={3} align="center">
          No recent bookings
        </TableCell>
      </TableRow>
    ) : (
      recentActivity.recentBookings.map((booking) => (
        <TableRow
          key={booking.id}
          hover
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin/bookings')}
        >
          <TableCell  sx={{ padding: '19px 0px' }}>
            {booking.customer?.user
              ? `${booking.customer.user.first_name} ${booking.customer.user.last_name}`
              : 'Unknown Customer'}
          </TableCell>

          <TableCell  sx={{ padding: '19px 0px' }}>
            <Chip
              label={booking.status}
              size="small"
              color={
                booking.status === 'completed'
                  ? 'success'
                  : booking.status === 'confirmed'
                  ? 'primary'
                  : booking.status === 'cancelled'
                  ? 'error'
                  : 'default'
              }
            />
          </TableCell>

          <TableCell  sx={{ padding: '12px 16px' }}>
            {new Date(booking.createdAt).toLocaleDateString()}
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>

            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
