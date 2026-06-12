import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import {
  Info as InfoIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Public as GlobeIcon,
} from '@mui/icons-material';
import PublicLayout from '../components/layouts/PublicLayout';

export default function Cookies() {
  return (
    <PublicLayout>
      <Box sx={{ minHeight: 'calc(100vh - 200px)', bgcolor: 'grey.50' }}>
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
              Cookie Policy
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {`Understanding how we use cookies. Last updated: ${new Date().getFullYear()}`}
            </Typography>
          </Box>

          {/* What Are Cookies */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <InfoIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" fontWeight="bold">
                  What Are Cookies?
                </Typography>
              </Box>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75, maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                Cookies are small text files stored on your device when you visit our website. They help us provide you with a better, faster, and safer experience by remembering your preferences and analyzing how you use our platform.
              </Typography>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <LockIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" fontWeight="bold">
                  Types of Cookies We Use
                </Typography>
              </Box>
              
              {/* Essential Cookies */}
              <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Essential Cookies
                  </Typography>
                  <Chip label="Required" color="error" size="small" />
                </Box>
                <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                  Required for the website to function properly. These include authentication cookies, security features, and session management. Cannot be disabled.
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Login authentication</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Security features</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Shopping cart functionality</span>
                  </Box>
                </Box>
              </Box>

              {/* Performance Cookies */}
              <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Performance Cookies
                  </Typography>
                  <Chip label="Optional" color="primary" size="small" />
                </Box>
                <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                  Help us understand how visitors interact with our website by collecting anonymous information about page visits, load times, and error messages.
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Page load analytics</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Error tracking</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Performance monitoring</span>
                  </Box>
                </Box>
              </Box>

              {/* Functionality Cookies */}
              <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Functionality Cookies
                  </Typography>
                  <Chip label="Optional" color="primary" size="small" />
                </Box>
                <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                  Remember your preferences and personalize your experience on our platform, such as language settings and region preferences.
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Language preferences</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Region settings</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Display preferences</span>
                  </Box>
                </Box>
              </Box>

              {/* Marketing Cookies */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Marketing Cookies
                  </Typography>
                  <Chip label="Optional" color="primary" size="small" />
                </Box>
                <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                  Used to deliver relevant advertisements and track campaign effectiveness across different platforms and websites.
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Ad targeting</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Campaign tracking</span>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                    <span>Social media integration</span>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <CheckIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Managing Cookies
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                You have full control over cookies. You can manage them through:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Browser Settings
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Most browsers allow you to refuse or delete cookies. Visit your browser's help section for instructions.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Cookie Preferences
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Use our cookie preference center to customize which optional cookies you allow.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ bgcolor: 'warning.light', borderLeft: '4px solid', borderColor: 'warning.main', p: 2 }}>
                <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                  <strong>Note:</strong> Disabling essential cookies may affect website functionality. Some features may not work properly without cookies enabled.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <GlobeIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Third-Party Cookies
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                We use trusted third-party services that may set their own cookies to provide essential functionality:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: '1.25rem', mt: 0.5 }}>•</Typography>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Payment Processors:</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Secure payment handling and fraud prevention</Typography>
                  </Box>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: '1.25rem', mt: 0.5 }}>•</Typography>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Analytics Providers:</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Website performance and user behavior analysis</Typography>
                  </Box>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: '1.25rem', mt: 0.5 }}>•</Typography>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Communication Services:</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Email and SMS delivery services</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                For questions about our cookie policy:
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
    </PublicLayout>
  );
}

