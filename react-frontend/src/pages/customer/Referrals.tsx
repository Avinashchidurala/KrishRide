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
  Chip,
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
import { referralsApi } from '../../services/referralsApi';

export default function Referrals() {
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
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [codeData, statsData] = await Promise.all([
        referralsApi.getReferralCode(),
        referralsApi.getReferralStats().catch(() => null), // Don't fail if stats API fails
      ]);
      setReferralCode(codeData.referralCode || user.customer?.referral_code || '');
      
      if (statsData) {
        setReferralStats({
          totalReferrals: statsData.totalReferrals || 0,
          successfulReferrals: statsData.successfulReferrals || 0,
          totalEarnings: statsData.totalEarnings || 0,
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join HushRyd',
          text: `Use my referral code to join HushRyd and get ₹100!`,
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Refer & Earn
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Share your referral code and earn ₹100 for each successful referral
        </Typography>
      </Box>

      {/* Referral Code Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Your Referral Code
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this code with your friends to earn rewards
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
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
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
          <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
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
          <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
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
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GiftIcon color="primary" />
            <Typography variant="h6" fontWeight="600">
              How It Works
            </Typography>
          </Box>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Share your referral code or link with friends
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                When they sign up using your code, they get ₹100 bonus
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                You earn ₹100 when they complete their first ride
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

