import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import Logo from '../components/Logo';
import PublicLayout from '../components/layouts/PublicLayout';

export default function Signup() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <Box sx={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', py: { xs: 6, md: 8 }, px: 2 }}>
        <Container maxWidth="md" sx={{ width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Logo size="lg" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Sign Up
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Choose your account type to get started
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                onClick={() => navigate('/customer/signup')}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#FF6B35' }}>
                      Customer
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                      Book rides and travel comfortably
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{ textTransform: 'none', width: '100%', borderRadius: 2, fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/customer/signup');
                    }}
                  >
                    Sign Up as Customer
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                onClick={() => navigate('/driver/signup')}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#FF6B35' }}>
                      Driver
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                      Publish rides and start earning
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{ textTransform: 'none', width: '100%', borderRadius: 2, fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/driver/signup');
                    }}
                  >
                    Sign Up as Driver
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Already have an account?{' '}
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ 
                  textTransform: 'none',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': { color: 'primary.dark' }
                }}
              >
                Login
              </Button>
            </Typography>
          </Box>
        </Container>
      </Box>
    </PublicLayout>
  );
}

