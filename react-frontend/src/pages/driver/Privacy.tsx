import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  Info as InfoIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

export default function Privacy() {
  return (
      <Box sx={{ minHeight: 'calc(100vh - 200px)', bgcolor: 'grey.50' }}>
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
              Privacy Policy
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {`Your privacy matters to us. Last updated: ${new Date().getFullYear()}`}

            </Typography>
          </Box>

          {/* Information We Collect */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <InfoIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" fontWeight="bold">
                  1. Information We Collect
                </Typography>
              </Box>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75, mb: 3, maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                We collect information you provide directly to us when using our platform:
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75, mb: 2, fontWeight: 600, textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                Personal Information
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 4, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                  <span>Name, email, and phone number</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                  <span>Profile information and photos</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                  <span>Government ID for verification</span>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3, fontWeight: 600 }}>
                Usage Data
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                  <span>Payment information</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                  <span>Location data during rides</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                  <span>Communication between users</span>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LockIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  2. How We Use Your Information
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                We use collected information to provide and improve our carpooling services:
              </Typography>
              <Box component="ol" sx={{ listStyle: 'decimal', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <li>Provide and improve our carpooling services</li>
                <li>Process payments and bookings securely</li>
                <li>Ensure safety and security of all users</li>
                <li>Send notifications and updates about your rides</li>
                <li>Comply with legal obligations and regulations</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </Box>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ShieldIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  3. Information Sharing
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3, fontWeight: 600, fontSize: '1.125rem' }}>
                We do NOT sell your personal information
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                Your privacy is paramount. We never sell, rent, or trade your personal data to third parties for marketing purposes.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                Information sharing occurs only when necessary:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                  <span><strong>With ride partners:</strong> Contact details shared for active bookings only</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                  <span><strong>For safety:</strong> With authorities if required by law or emergency</span>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5 }} />
                  <span><strong>Service providers:</strong> Payment processors and SMS/email services</span>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LockIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  4. Data Protection
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                We implement industry-standard security measures to protect your data:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Encrypted Storage
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    All data encrypted at rest and in transit
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Secure Servers
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Regular security audits and updates
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Access Control
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Limited staff access to personal data
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <CheckIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  5. Your Rights
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                You have control over your personal information:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Access & Correction
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    View and update your personal data anytime through your account settings
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Data Deletion
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Request deletion of your account and associated data (subject to legal requirements)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Data Portability
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Request a copy of your data in a machine-readable format
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
                    Marketing Opt-out
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                    Unsubscribe from promotional emails and marketing communications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                6. Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                For privacy-related questions or to exercise your rights:
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
}
