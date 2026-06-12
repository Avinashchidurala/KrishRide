import { useState } from 'react';
import {
  Container,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Emergency as EmergencyIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { sosApi } from '../../services/sosApi';

export default function SOS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleSOS = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await sosApi.createSOSAlert({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        message: message || 'Emergency SOS alert',
      });

      setSuccess(true);
      setConfirmDialogOpen(false);
      setMessage('');

      // Auto-close success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      if (err.code === 1) {
        setError('Location access denied. Please enable location services.');
      } else {
        setError(err.message || 'Failed to send SOS alert');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            display: 'inline-flex',
            p: 3,
            borderRadius: '50%',
            bgcolor: 'error.light',
            mb: 3,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            }
          }}>
            <EmergencyIcon sx={{ fontSize: 80, color: 'error.main' }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
            Emergency SOS
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Use this in case of emergency
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            SOS alert has been sent! Emergency contacts and authorities have been notified.
          </Alert>
        )}

        <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.7 }}>
              Press the button below to send an emergency SOS alert. Your location will be shared with your emergency contacts and authorities.
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              onClick={() => setConfirmDialogOpen(true)}
              sx={{ 
                textTransform: 'none',
                py: 2.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 700,
                bgcolor: 'error.main',
                boxShadow: 4,
                '&:hover': {
                  bgcolor: 'error.dark',
                  boxShadow: 6,
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s',
              }}
              startIcon={loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <EmergencyIcon />}
            >
              {loading ? 'Sending SOS...' : 'Send SOS Alert'}
            </Button>

            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Make sure your location services are enabled
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>Confirm SOS Alert</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              Are you sure you want to send an emergency SOS alert? This will notify your emergency contacts and authorities.
            </DialogContentText>
            <TextField
              label="Additional Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmDialogOpen(false)} 
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSOS}
              disabled={loading}
              variant="contained"
              sx={{ 
                textTransform: 'none',
                bgcolor: 'error.main',
                '&:hover': { bgcolor: 'error.dark' }
              }}
            >
              {loading ? 'Sending...' : 'Send SOS'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

