import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import Logo from '../Logo';

export default function Header() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'Home' },
    { path: '/find-ride', label: 'Find Ride' },
    { path: '/post-ride', label: 'Post Ride' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/about', label: 'About' },
    { path: '/careers', label: 'Careers' },
    { path: '/contact', label: 'Contact' },
    { path: '/faq', label: 'FAQ' },
  ];

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid rgba(255, 107, 53, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar sx={{ py: 1, position: 'relative' }}>
        <Container maxWidth="xl" sx={{ position: 'relative', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* Logo on left */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', zIndex: 10, textDecoration: 'none', transition: 'opacity 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              <Logo size="sm" showText={false} disableLink={true} />
            </Link>

            {isMobile ? (
            <>
              <IconButton 
                onClick={toggleDrawer} 
                sx={{ 
                  color: 'text.primary',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    color: '#FF6B35'
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
              <Drawer 
                anchor="right" 
                open={drawerOpen} 
                onClose={toggleDrawer}
                PaperProps={{
                  sx: {
                    width: 280,
                    background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
                  }
                }}
              >
                <Box sx={{ width: '100%', p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, pb: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Logo size="sm" showText={false} />
                    <IconButton 
                      onClick={toggleDrawer}
                      sx={{
                        '&:hover': { backgroundColor: 'rgba(255, 107, 53, 0.1)' }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <List>
                    {menuItems.map((item) => (
                      <ListItem
                        key={item.path}
                        component={Link}
                        to={item.path}
                        onClick={toggleDrawer}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          backgroundColor: location.pathname === item.path 
                            ? 'rgba(255, 107, 53, 0.1)' 
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 53, 0.08)',
                          }
                        }}
                      >
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            sx: {
                              color: location.pathname === item.path ? '#FF6B35' : 'text.primary',
                              fontWeight: location.pathname === item.path ? 600 : 500,
                              fontSize: '0.95rem',
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                    <Box sx={{ mt: 2, px: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        component={Link}
                        to="/login"
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          borderColor: '#FF6B35',
                          color: '#FF6B35',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.2,
                          '&:hover': {
                            borderColor: '#E55A2B',
                            backgroundColor: 'rgba(255, 107, 53, 0.08)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="contained"
                        component={Link}
                        to="/signup"
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.2,
                          boxShadow: '0 4px 14px rgba(255, 107, 53, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #E55A2B 0%, #FF6B35 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(255, 107, 53, 0.5)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Sign Up
                      </Button>
                    </Box>
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <>
              {/* Navigation menu in center */}
              <Box 
                sx={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      position: 'relative',
                      textDecoration: 'none',
                      color: location.pathname === item.path ? '#FF6B35' : '#374151',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== item.path) {
                        e.currentTarget.style.color = '#FF6B35';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== item.path) {
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: 'linear-gradient(90deg, #FF6B35 0%, #E55A2B 100%)',
                          borderRadius: '2px 2px 0 0',
                        }}
                      />
                    )}
                  </Link>
                ))}
              </Box>
              
              {/* Login/Signup buttons on right */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, zIndex: 10 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/login"
                  sx={{
                    textTransform: 'none',
                    borderColor: '#FF6B35',
                    color: '#FF6B35',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': {
                      borderColor: '#E55A2B',
                      backgroundColor: 'rgba(255, 107, 53, 0.08)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  component={Link}
                  to="/signup"
                  sx={{
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    boxShadow: '0 4px 14px rgba(255, 107, 53, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E55A2B 0%, #FF6B35 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(255, 107, 53, 0.5)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Sign Up
                </Button>
              </Box>
            </>
          )}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}

