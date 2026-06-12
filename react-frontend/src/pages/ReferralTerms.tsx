import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/layouts/PublicLayout';

export default function ReferralTerms() {
  return (
    <PublicLayout>
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant="h3" component="h1" fontWeight="bold" sx={{ mb: 4, textAlign: 'center' }}>
          Referral Program Terms & Conditions
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          {`Last updated:${new Date().getFullYear()}`}
        </Typography>

        {/* Overview */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
            Program Overview
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.75, fontSize: '1.1rem', maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            HushRyd's Referral Program allows users to earn rewards by referring new users to the platform. 
            Both the referrer and the new user receive benefits when the new user successfully completes their first ride.
          </Typography>
        </Box>

        {/* How It Works */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
            How It Works
          </Typography>
          <Box component="ol" sx={{ pl: 3, mb: 2, maxWidth: '70ch' }}>
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.75, textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                Share your unique referral code with friends, family, or on social media
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                New users sign up using your referral code
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                When the referred user completes their first ride (as passenger or driver), both parties receive rewards
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Rewards are credited to your wallet within 24-48 hours after the first ride completion
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Rewards */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
            Rewards
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem', mb: 2 }}>
            Current referral bonus: ₹100 for both the referrer and the new user upon successful first ride completion.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.75, fontSize: '1.1rem', maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            Reward amounts are subject to change at HushRyd's discretion. Users will be notified of any changes 
            to the referral program terms.
          </Typography>
        </Box>

        {/* Eligibility */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
            Eligibility
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem', mb: 2 }}>
            To be eligible for referral rewards:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2, maxWidth: '70ch' }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.75, textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                You must be an active HushRyd user with a verified account
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                The referred user must be a new user who has never had a HushRyd account before
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                The referred user must complete at least one ride (as passenger or driver) within 30 days of signup
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Both accounts must be in good standing (no violations or fraudulent activity)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Restrictions */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
            Restrictions
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2, maxWidth: '70ch' }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.75, textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                Referral codes cannot be used by the same user on multiple accounts
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Self-referrals are not allowed (creating multiple accounts to claim referral bonuses)
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Referral rewards are limited to one per new user
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Fraudulent or abusive use of the referral program will result in account suspension and forfeiture of rewards
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                HushRyd reserves the right to modify or cancel the referral program at any time
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Validity */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
            Referral Code Validity
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.75, fontSize: '1.1rem', maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            Referral codes do not expire. However, new users must complete their first ride within 30 days 
            of signup to be eligible for the referral bonus. After this period, the referral will no longer 
            be valid for rewards.
          </Typography>
        </Box>

        {/* Terms */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Important Notes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2, maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            Referral rewards are subject to verification. HushRyd may request additional information to verify 
            the legitimacy of referrals. All decisions regarding referral rewards are final and at HushRyd's discretion.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            These terms are part of HushRyd's Terms of Service. By participating in the referral program, 
            you agree to these terms and all applicable laws and regulations.
          </Typography>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Questions about the referral program? <Link to="/contact" style={{ color: '#FF6B35', textDecoration: 'none' }}>Contact us</Link> 
            {' '}or review our <Link to="/terms" style={{ color: '#FF6B35', textDecoration: 'none' }}>Terms & Conditions</Link>.
          </Typography>
        </Box>
      </Box>
    </PublicLayout>
  );
}

