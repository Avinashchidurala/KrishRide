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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VerifiedUser as KycIcon,
  DirectionsCar as RidesIcon,
  BookOnline as BookingsIcon,
  LocalShipping as VehiclesIcon,
  AccountBalanceWallet as WalletIcon,
  Support as ComplaintsIcon,
  HelpOutline as SupportTicketsIcon,
  Emergency as SosIcon,
  TrendingUp as RevenueIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Public as StatesIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import Logo from '../Logo';
import NotificationPanel from '../admin/NotificationPanel';

const DRAWER_WIDTH = 280;

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  category?: string;
}

const navItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/admin/users', label: 'Users', icon: <PeopleIcon /> },
  { path: '/admin/kyc', label: 'KYC Verification', icon: <KycIcon /> },
  { path: '/admin/rides', label: 'Rides', icon: <RidesIcon /> },
  { path: '/admin/rides/live', label: 'Live Rides', icon: <RidesIcon /> },
  { path: '/admin/bookings', label: 'Bookings', icon: <BookingsIcon /> },
  { path: '/admin/vehicles', label: 'Vehicles', icon: <VehiclesIcon /> },
  { path: '/admin/payouts', label: 'Payouts', icon: <WalletIcon /> },
  { path: '/admin/complaints', label: 'Complaints', icon: <ComplaintsIcon /> },
  { path: '/admin/support-tickets', label: 'Support Tickets', icon: <SupportTicketsIcon /> },
  { path: '/admin/sos', label: 'SOS Alerts', icon: <SosIcon /> },
  { path: '/admin/revenue', label: 'Revenue', icon: <RevenueIcon /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  { path: '/admin/service-states', label: 'Service States', icon: <StatesIcon /> },
  { path: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> },
  { path: '/admin/profile', label: 'Profile', icon: <PersonIcon /> },
  { path: '/admin/wallet', label: 'Wallet', icon: <WalletIcon /> },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    } else if (user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          px: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          minHeight: '64px !important',
        }}
      >
        <Logo size="sm" />
      </Toolbar>
      <Divider />
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => {
          // Match exact path
          // Special handling: /admin/rides should not match /admin/rides/live
          let isActive = location.pathname === item.path;
          
          // For paths that are not /admin/rides, allow sub-path matching
          if (!isActive && item.path !== '/admin/rides' && item.path !== '/admin/profile') {
            isActive = location.pathname.startsWith(item.path + '/') && item.path !== '/';
          }
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
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
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
        })}
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
              Admin Panel
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
            <NotificationPanel />
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.firstName || user.first_name || ''} {user.lastName || user.last_name || ''}
            </Typography>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {(user.firstName || user.first_name || 'A')?.[0]}{(user.lastName || user.last_name || '')?.[0]}
              </Avatar>
            </IconButton>
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
                navigate('/admin/profile');
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

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="admin navigation"
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

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
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
    </Box>
  );
}
