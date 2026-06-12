import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  CardGiftcard as GiftIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../app/hooks';

export default function DriverReferrals() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    // Generate or load referral code
    // For now, using a simple format based on user ID
    const code = user?.id?.substring(0, 8).toUpperCase() || 'DRIVER' + Date.now().toString().slice(-6);
    setReferralCode(code);
  }, [user]);

  const handleCopy = () => {
    const link = `${window.location.origin}/driver/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/driver/signup?ref=${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join HushRyd as a Driver',
          text: `Use my referral code to join HushRyd as a driver and earn!`,
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  const referralLink = `${window.location.origin}/driver/signup?ref=${referralCode}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Refer & Earn
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Share your referral code and earn rewards for each successful driver referral
        </Typography>
      </Box>

      {/* Referral Code Card */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Your Referral Code
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this code with potential drivers to earn rewards
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TextField
                  fullWidth
                  value={referralCode}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={handleCopy} color="primary">
                        {copied ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'grey.50',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      letterSpacing: 2,
                    },
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    sx={{ textTransform: 'none', px: 3 }}
                  >
                    Share Referral Link
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CopyIcon />}
                    onClick={handleCopy}
                    sx={{ textTransform: 'none', px: 3 }}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'info.light',
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="black">
                    <strong>Referral Link:</strong> {referralLink}
                  </Typography>
                </Paper>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Referrals
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {referralStats.totalReferrals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Successful Referrals
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {referralStats.successfulReferrals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Earnings
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                ₹{referralStats.totalEarnings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Terms & Conditions */}
      <Card elevation={1}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GiftIcon color="primary" />
            <Typography variant="h6" fontWeight="600">
              How It Works
            </Typography>
          </Box>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Share your referral code or link with potential drivers
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                When they sign up using your code, they get a welcome bonus
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                You earn rewards when they complete their first ride
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Rewards are credited to your wallet within 24 hours
              </Typography>
            </li>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Terms:</strong> Referral bonus is valid for 30 days after your referee completes their first ride. 
              The bonus is non-transferable and cannot be redeemed for cash.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}

