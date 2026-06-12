import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  ListItem,
  ListItemAvatar,
   BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  BookOnline as BookingsIcon,
  AccountBalanceWallet as WalletIcon,
  DirectionsCar as VehiclesIcon,
  PostAdd as PublishIcon,
  Logout as LogoutIcon,
  CardGiftcard as ReferralIcon,
  Search as SearchIcon,
  VerifiedUser as KycIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  HelpOutline as SupportIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Emergency as EmergencyIcon,
  ReportProblem as ComplaintIcon,
  SupportAgent as SupportTicketIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../features/notifications/notificationsSlice'
import Logo from '../Logo';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { driverApi } from '../../services/driverApi';
import { ridesApi } from '../../services/ridesApi';

const DRAWER_WIDTH = 280;

interface ProtectedLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [driverStartedRide, setDriverStartedRide] = useState<Boolean>(false)
  const [customerStartedRide, setCustomerStartedRide] = useState<Boolean>(false)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Load notifications
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({ page: 1, limit: 10, unreadOnly: false }));
      dispatch(fetchUnreadCount());

      // Refresh notifications every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchNotifications({ page: 1, limit: 10, unreadOnly: false }));
        dispatch(fetchUnreadCount());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, dispatch]);

  let driverRide
  let customerRide

useEffect(() => {
  console.log(user?.driver?.id)
  const fetchStartedRide = async () => {
    if (user?.role === "driver") {
       driverRide = await getDriverStartedRide(user?.driver?.id)
      console.log("Started ride for driver:", driverRide)
      if (driverRide?.startedride.length > 0) {
        setDriverStartedRide(true)
      }
    }

    if (user?.role === "customer") {
      customerRide = await getCustomerStartedRide(user?.customer?.id)
      console.log("Started ride for customer:", customerRide)
      if (customerRide?.startedride.length > 0) {
        setCustomerStartedRide(true)
      }
    }
  }

  fetchStartedRide()
}, [])


  const getCustomerStartedRide = async (id: string) => {
    let Ride = await ridesApi.getStartedRideForCustomer(id)
    return Ride
  }

  const getDriverStartedRide = async (id: string) => {
    let Ride = await driverApi.getStartedRideForDriver(id)
    return Ride
  }



  if (!user) {
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
  dispatch(logout());
  // navigate('/login', { replace: true });
};

  // Handle role detection - check both direct role and nested role
  // Also fallback to pathname-based detection if role is not available
  const userRole = user?.role || user?.data?.role || '';
  let isCustomer = userRole === 'customer';
  let isDriver = userRole === 'driver';
  
  // Fallback: Determine role from pathname if user role is not available
  if (!isCustomer && !isDriver) {
    if (location.pathname.startsWith('/customer/')) {
      isCustomer = true;
    } else if (location.pathname.startsWith('/driver/')) {
      isDriver = true;
    }
  }



  const customerNavItems: NavItem[] = [
    { path: '/customer/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/customer/book-ride', label: 'Find a Ride', icon: <SearchIcon /> },
    { path: '/customer/my-bookings', label: 'My Bookings', icon: <BookingsIcon /> },
    { path: '/customer/wallet', label: 'Wallet', icon: <WalletIcon /> },
    { path: '/customer/referrals', label: 'Referrals', icon: <ReferralIcon /> },
    { path: '/customer/profile', label: 'My Profile', icon: <PersonIcon /> },
    { path: '/customer/support', label: 'Support', icon: <SupportIcon /> },
    { path: '/customer/complaints', label: 'Complaints', icon: <ComplaintIcon /> },
    { path: '/customer/support-tickets', label: 'Support Tickets', icon: <SupportTicketIcon /> },
    // { path: '/customer/sos', label: 'Emergency SOS', icon: <EmergencyIcon /> }},
    ...(customerStartedRide
    ? [{ path: '/customer/sos', label: 'Emergency SOS', icon: <EmergencyIcon /> }]
    : [])
  ];

  const driverNavItems: NavItem[] = [
    { path: '/driver/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/driver/publish-ride', label: 'Publish Ride', icon: <PublishIcon /> },
    { path: '/driver/my-rides', label: 'My Rides', icon: <HistoryIcon /> },
    { path: '/driver/kyc', label: 'KYC Verification', icon: <KycIcon /> },
    { path: '/driver/vehicles', label: 'Vehicles', icon: <VehiclesIcon /> },
    { path: '/driver/wallet', label: 'Wallet', icon: <WalletIcon /> },
    { path: '/driver/referrals', label: 'Referrals', icon: <ReferralIcon /> },
    { path: '/driver/profile', label: 'Profile', icon: <PersonIcon /> },
    { path: '/driver/support', label: 'Support', icon: <SupportIcon /> },
    { path: '/driver/complaints', label: 'Complaints', icon: <ComplaintIcon /> },
    { path: '/driver/support-tickets', label: 'Support Tickets', icon: <SupportTicketIcon /> },
    // { path: '/driver/sos', label: 'Emergency SOS', icon: <EmergencyIcon /> },

    ...(driverStartedRide
      ? [{ path: '/driver/sos', label: 'Emergency SOS', icon: <EmergencyIcon /> }]
      : []),
  ];
  // for mobile
  const customerBottomTabs = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: <DashboardIcon /> },
  { label: 'Find Ride', path: '/customer/book-ride', icon: <SearchIcon /> },
  { label: 'Bookings', path: '/customer/my-bookings', icon: <BookingsIcon /> },
  { label: 'Account', path: '/customer/account', icon: <AccountCircleIcon /> },
];

const driverBottomTabs = [
  { label: 'Dashboard', path: '/driver/dashboard', icon: <DashboardIcon /> },
  { label: 'Publish', path: '/driver/publish-ride', icon: <PublishIcon /> },
  { label: 'Rides', path: '/driver/my-rides', icon: <HistoryIcon /> },
  { label: 'Account', path: '/driver/account', icon: <AccountCircleIcon /> },
];

const bottomTabs = isCustomer ? customerBottomTabs : driverBottomTabs;
const [bottomValue, setBottomValue] = useState(location.pathname);
// -----

  const navItems = isCustomer ? customerNavItems : isDriver ? driverNavItems : [];

  // Debug: Log navItems to console
  useEffect(() => {
    // console.log('ProtectedLayout - User object:', user);
    // console.log('ProtectedLayout - User role:', user?.role);
    // console.log('ProtectedLayout - Detected role:', userRole);
    // console.log('ProtectedLayout - isCustomer:', isCustomer);
    // console.log('ProtectedLayout - isDriver:', isDriver);
    // console.log('ProtectedLayout - navItems count:', navItems.length);
    // console.log('ProtectedLayout - Current path:', location.pathname);
  }, [user, userRole, isCustomer, isDriver, navItems.length, location.pathname]);

  // Handle both firstName/lastName and first_name/last_name
  const firstName = user?.firstName || user?.first_name || '';
  const lastName = user?.lastName || user?.last_name || '';
  const panelTitle = isCustomer ? 'Customer Panel' : isDriver ? 'Driver Panel' : 'Panel';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          px: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          minHeight: '64px !important',
          flexShrink: 0,
        }}
      >
        <Logo size="sm" />
      </Toolbar>
      <Divider />
      <List sx={{ pt: 2, flexGrow: 1, overflow: 'auto' }}>
        {navItems.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No navigation items available
            </Typography>
          </Box>
        ) : (
          navItems.map((item) => {
          // Match exact path or paths that start with the item path followed by /
          // This ensures /customer/book-ride matches /customer/book-ride/123
          const isActive = location.pathname === item.path || 
            (location.pathname.startsWith(item.path + '/') && item.path !== '/');
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'transparent',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
          })
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              {panelTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {firstName} {lastName}
            </Typography>
            
            {/* Notification Icon */}
            <IconButton
              onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
              sx={{ 
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                {unreadCount > 0 ? (
                  <NotificationsIcon />
                ) : (
                  <NotificationsNoneIcon />
                )}
              </Badge>
            </IconButton>

            {/* Profile Avatar */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {firstName?.[0]}{lastName?.[0]}
              </Avatar>
            </IconButton>
            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={() => setNotificationAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  width: 360,
                  maxHeight: 500,
                  mt: 1.5,
                },
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {unreadCount} unread
                  </Typography>
                )}
              </Box>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No notifications
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                    {notifications.map((notification) => (
                      <ListItem
                        key={notification.id}
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: 'pointer',
                          bgcolor: notification.read ? 'transparent' : 'action.hover',
                          '&:hover': {
                            bgcolor: 'action.selected',
                          },
                        }}
                        onClick={() => {
                          // Handle notification click
                          if (!notification.read) {
                            dispatch(markNotificationAsRead(notification.id));
                          }
                          // Navigate based on notification type
                          if (notification.type === 'booking') {
                            if (isCustomer) {
                              navigate('/customer/my-bookings');
                            } else if (isDriver) {
                              navigate('/driver/my-rides');
                            }
                          } else if (notification.type === 'payment') {
                            if (isCustomer) {
                              navigate('/customer/wallet');
                            } else if (isDriver) {
                              navigate('/driver/wallet');
                            }
                          } else if (notification.type === 'ride') {
                            if (isDriver) {
                              navigate('/driver/my-rides');
                            }
                          }
                          setNotificationAnchorEl(null);
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                notification.type === 'booking'
                                  ? 'primary.main'
                                  : notification.type === 'payment'
                                  ? 'success.main'
                                  : 'info.main',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {notification.type === 'booking' ? (
                              <BookingsIcon />
                            ) : notification.type === 'payment' ? (
                              <PaymentIcon />
                            ) : (
                              <NotificationsIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              mb: 0.5,
                            }}
                            noWrap
                          >
                            {notification.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              ml: 1,
                            }}
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                  <Divider />
                  <Box sx={{ p: 1 }}>
                    <MenuItem
                      onClick={() => {
                        dispatch(markAllNotificationsAsRead());
                        setNotificationAnchorEl(null);
                      }}
                      sx={{ justifyContent: 'center' }}
                    >
                      Mark all as read
                    </MenuItem>
                  </Box>
                </Box>
              )}
            </Menu>

            {/* Profile Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => {
                if (isCustomer) {
                  navigate('/customer/profile');
                } else if (isDriver) {
                  navigate('/driver/profile');
                } else {
                  navigate('/profile');
                }
                setAnchorEl(null);
              }}>
                <PersonIcon sx={{ mr: 1 }} fontSize="small" />
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer - Always visible on desktop */}
      <Box
        component="nav"
        sx={{ 
          width: { md: DRAWER_WIDTH }, 
          flexShrink: { md: 0 },
          position: 'relative',
          zIndex: 1,
        }}
        aria-label="navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer - Always visible */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              zIndex: 1,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: isMobile ? 8 : 3, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
          elevation={3}
        >
          <BottomNavigation
            value={bottomValue}
             onChange={(event, newValue) => {
                navigate(newValue);
              }}
            showLabels
          >
            {bottomTabs.map((tab) => (
              <BottomNavigationAction
                key={tab.label}
                label={tab.label}
                value={tab.path}
                icon={tab.icon}
              />
            ))}
          </BottomNavigation>

          {/* Account Menu */}
          {/* <Menu
            anchorEl={accountAnchor}
            open={Boolean(accountAnchor)}
            onClose={() => setAccountAnchor(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <MenuItem onClick={() => navigate(isCustomer ? '/customer/profile' : '/driver/profile')}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => navigate(isCustomer ? '/customer/sos' : '/driver/sos')}>
            Emergency SOS
            </MenuItem>
            <MenuItem onClick={() => navigate(isCustomer ? '/customer/referrals' : '/driver/referrals')}>
            Refferals
            </MenuItem>
            <MenuItem onClick={() => navigate(isCustomer ? '/customer/wallet' : '/driver/wallet')}>
              Wallet
            </MenuItem>
            <MenuItem onClick={() => navigate(isCustomer ? '/customer/support' : '/driver/support-tickets')}>
              Support
            </MenuItem>
            <MenuItem onClick={() => navigate(isCustomer ? '/customer/complaints' : '/driver/complaints')}>
              Complaints
            </MenuItem>
            {isDriver && (
              <>
               <MenuItem onClick={() => navigate('/driver/vehicles')}>
                Vehicles
              </MenuItem>
                <MenuItem onClick={() => navigate('/driver/kyc')}>
                KYC Verification
                </MenuItem>
              </>
            )}
            
            <Divider />
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu> */}
        </Paper>
      )}
    </Box>
  );
}

