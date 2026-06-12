import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  Info as InfoIcon,
  People as UsersIcon,
  DirectionsCar as CarIcon,
  Shield as ShieldIcon,
  AccountBalance as MoneyIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import PublicLayout from '../components/layouts/PublicLayout';
import { useLocation } from 'react-router-dom';


export default function Terms() {
  const location = useLocation();
  const isCustomerRoute = location.pathname.startsWith('/customer');

  const content = (
    
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Box sx={{ py: { xs: 6, md: 8 }, maxWidth: 'lg', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Terms of Service
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {`Last updated:${new Date().getFullYear()}`}
            </Typography>
          </Box>

          {/* Acceptance of Terms */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <InfoIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  1. Acceptance of Terms
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                By accessing and using Hushryd's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. Your continued use of the service constitutes acceptance of any modifications to these terms.
              </Typography>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <UsersIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  2. User Accounts
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                You must create an account to use our services. You are responsible for:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Maintaining the confidentiality of your account credentials</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>All activities that occur under your account</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Providing accurate and up-to-date information</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Notifying us immediately of any unauthorized use</span>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Service Usage */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <CarIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  3. Service Usage
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                Hushryd provides a platform connecting drivers and passengers for carpooling. We do not provide transportation services directly. All rides are arranged between users. Hushryd acts solely as an intermediary to facilitate connections.
              </Typography>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ShieldIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  4. User Responsibilities
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3, fontWeight: 600 }}>
                All Users Must:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 4, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Provide accurate and truthful information</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Maintain respectful communication</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Follow all applicable laws and regulations</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Report any safety concerns immediately</span>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3, fontWeight: 600 }}>
                Drivers Must:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Have valid driver's license</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Maintain proper vehicle insurance</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Complete KYC verification</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 700, mt: 0.5 }}>✓</Typography>
                  <span>Ensure vehicle roadworthiness</span>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <MoneyIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  5. Payment Terms
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                Payment for rides is processed through our secure payment gateway. All transactions are encrypted and protected by industry-standard security measures.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                <strong>Important:</strong> Refunds are subject to our cancellation policy. Service fees are non-refundable. Payment disputes must be reported within 48 hours of the transaction.
              </Typography>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LockIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  6. Limitation of Liability
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                Hushryd is not liable for any damages arising from the use of our services, including but not limited to:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'error.main', fontWeight: 700, mt: 0.5 }}>×</Typography>
                  <span>Accidents or incidents during rides</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'error.main', fontWeight: 700, mt: 0.5 }}>×</Typography>
                  <span>Lost, stolen, or damaged property</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'error.main', fontWeight: 700, mt: 0.5 }}>×</Typography>
                  <span>User behavior or misconduct</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Typography sx={{ color: 'error.main', fontWeight: 700, mt: 0.5 }}>×</Typography>
                  <span>Service delays or interruptions</span>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                We recommend all users follow safety guidelines and use common sense when carpooling. Always verify driver and vehicle details before boarding.
              </Typography>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                7. Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                For questions about these terms, please contact us:
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                <Box component="span" sx={{ display: 'inline-block', mr: 2 }}>
                  <Typography 
                    component="a" 
                    href="mailto:support@hushryd.com"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    support@hushryd.com
                  </Typography>
                </Box>
                <Box component="span" sx={{ mx: 1 }}>|</Box>
                <Box component="span">
                  <Typography 
                    component="a" 
                    href="tel:+917780445190"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    +91 7780445190
                  </Typography>
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                © {new Date().getFullYear()} Hushryd Mobility OPC Pvt Limited. All rights reserved.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    
  );

    return isCustomerRoute ? content : <PublicLayout>{content}</PublicLayout>;

}
