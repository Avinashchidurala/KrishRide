import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Card, CardContent, IconButton } from '@mui/material';
import {
  Info as InfoIcon,
  People as UsersIcon,
  DirectionsCar as CarIcon,
  Shield as ShieldIcon,
  AccountBalance as MoneyIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface TermsPrivacyDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function TermsPrivacyDialog({ open, onClose, type }: TermsPrivacyDialogProps) {
  const isTerms = type === 'terms';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          {isTerms ? 'Terms of Service' : 'Privacy Policy'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: 'grey.50' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {isTerms? `Last updated: ${new Date().getFullYear()}`: `Your privacy matters to us. Last updated: ${new Date().getFullYear()}`}

            </Typography>
          </Box>

          {isTerms ? (
            <>
              {/* Acceptance of Terms */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <InfoIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      1. Acceptance of Terms
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                    By accessing and using Hushryd's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. Your continued use of the service constitutes acceptance of any modifications to these terms.
                  </Typography>
                </CardContent>
              </Card>

              {/* User Accounts */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <UsersIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      2. User Accounts
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    You must create an account to use our services. You are responsible for:
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Maintaining the confidentiality of your account credentials</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>All activities that occur under your account</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Providing accurate and up-to-date information</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Notifying us immediately of any unauthorized use</span>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Service Usage */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <CarIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      3. Service Usage
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                    Hushryd provides a platform connecting drivers and passengers for carpooling. We do not provide transportation services directly. All rides are arranged between users. Hushryd acts solely as an intermediary to facilitate connections.
                  </Typography>
                </CardContent>
              </Card>

              {/* User Responsibilities */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <ShieldIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      4. User Responsibilities
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2, fontWeight: 600 }}>
                    All Users Must:
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Provide accurate and truthful information</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Maintain respectful communication</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Follow all applicable laws and regulations</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Report any safety concerns immediately</span>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2, fontWeight: 600 }}>
                    Drivers Must:
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Have valid driver's license</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Maintain proper vehicle insurance</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Complete KYC verification</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'success.main', fontWeight: 'bold', mt: 0.5 }}>✓</Typography>
                      <span>Ensure vehicle roadworthiness</span>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <MoneyIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      5. Payment Terms
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    Payment for rides is processed through our secure payment gateway. All transactions are encrypted and protected by industry-standard security measures.
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                    <strong>Important:</strong> Refunds are subject to our cancellation policy. Service fees are non-refundable. Payment disputes must be reported within 48 hours of the transaction.
                  </Typography>
                </CardContent>
              </Card>

              {/* Limitation of Liability */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <LockIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      6. Limitation of Liability
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    Hushryd is not liable for any damages arising from the use of our services, including but not limited to:
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'error.main', fontWeight: 'bold', mt: 0.5 }}>×</Typography>
                      <span>Accidents or incidents during rides</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'error.main', fontWeight: 'bold', mt: 0.5 }}>×</Typography>
                      <span>Lost, stolen, or damaged property</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'error.main', fontWeight: 'bold', mt: 0.5 }}>×</Typography>
                      <span>User behavior or misconduct</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ color: 'error.main', fontWeight: 'bold', mt: 0.5 }}>×</Typography>
                      <span>Service delays or interruptions</span>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                    We recommend all users follow safety guidelines and use common sense when carpooling. Always verify driver and vehicle details before boarding.
                  </Typography>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, bgcolor: 'primary.50' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    7. Contact Us
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    For questions about these terms, please contact us:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
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
                    {' '}|{' '}
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
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {`© ${new Date().getFullYear()} Hushryd Mobility OPC Pvt Limited. All rights reserved.`}

                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Information We Collect */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <InfoIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      1. Information We Collect
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    We collect information you provide directly to us when using our platform:
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2, fontWeight: 600 }}>
                    Personal Information
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span>Name, email, and phone number</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span>Profile information and photos</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span>Government ID for verification</span>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2, fontWeight: 600 }}>
                    Usage Data
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span>Payment information</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span>Location data during rides</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span>Communication between users</span>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* How We Use Your Information */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <LockIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      2. How We Use Your Information
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    We use collected information to provide and improve our carpooling services:
                  </Typography>
                  <Box component="ol" sx={{ listStyle: 'decimal', paddingLeft: 3, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <ShieldIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      3. Information Sharing
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2, fontWeight: 600 }}>
                    We do NOT sell your personal information
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    Your privacy is paramount. We never sell, rent, or trade your personal data to third parties for marketing purposes.
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    Information sharing occurs only when necessary:
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span><strong>With ride partners:</strong> Contact details shared for active bookings only</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span><strong>For safety:</strong> With authorities if required by law or emergency</span>
                    </Box>
                    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.5, flexShrink: 0 }} />
                      <span><strong>Service providers:</strong> Payment processors and SMS/email services</span>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Data Protection */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <LockIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      4. Data Protection
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    We implement industry-standard security measures to protect your data:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Encrypted Storage
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        All data encrypted at rest and in transit
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Secure Servers
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        Regular security audits and updates
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Access Control
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        Limited staff access to personal data
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Your Rights */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <CheckIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      5. Your Rights
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    You have control over your personal information:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Access & Correction
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        View and update your personal data anytime through your account settings
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Data Deletion
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        Request deletion of your account and associated data (subject to legal requirements)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Data Portability
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        Request a copy of your data in a machine-readable format
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
                        Marketing Opt-out
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8 }}>
                        Unsubscribe from promotional emails and marketing communications
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card sx={{ borderRadius: 2, boxShadow: 2, bgcolor: 'primary.50' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    6. Contact Us
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.8, mb: 2 }}>
                    For privacy-related questions or to exercise your rights:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
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
                    {' '}|{' '}
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
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    © {new Date().getFullYear()} Hushryd Mobility OPC Pvt Limited. All rights reserved.
                  </Typography>
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

