import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAppSelector } from '../../app/hooks';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If user is authenticated, redirect to their dashboard based on role
    if (isAuthenticated && user) {
      if (user.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else if (user.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Don't render public content if user is authenticated
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Header />
      
      {/* Main Content */}
      <Box sx={{ flex: 1, overflowX: 'hidden' }}>
        <Box
          sx={{
            maxWidth: '1200px',
            margin: '0 auto',
            px: { xs: 2, md: 3 }, // 16px mobile, 24px desktop
            width: '100%',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {children}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
