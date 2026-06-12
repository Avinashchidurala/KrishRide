import { Link } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import Logo from '../Logo';

export default function Footer() {
  const footerLinks = [
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
    { path: '/how-it-works', label: 'How It Works' },
    {path:'/careers',label:'Career'},
    { path: '/terms', label: 'Terms & Conditions' },
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/cancellation', label: 'Cancellation Policy' },
    { path: '/faq', label: 'FAQ' },
    { path: '/safety', label: 'Safety' },
    { path: '/cookies', label: 'Cookies' },
  ];

  return (
    <Box 
      sx={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        position: 'relative',
        color: 'white',
        mt: 'auto',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 107, 53, 0.5) 50%, transparent 100%)',
        }
      }}
    >
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 8, mb: 8 }}>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Logo size="lg" showText={false} />
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.7,
                fontSize: '0.875rem'
              }}
            >
              Your trusted ride-sharing platform connecting drivers and passengers for safe, affordable, and convenient travel.
            </Typography>
          </Box>

          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: '#FF6B35',
                fontSize: '1.1rem'
              }}
            >
              Quick Links
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {footerLinks.slice(0, 4).map((link) => (
                <Box component="li" key={link.path} sx={{ mb: 1.5 }}>
                  <Link
                    to={link.path}
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#FF6B35';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </Link>
                </Box>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: '#FF6B35',
                fontSize: '1.1rem'
              }}
            >
              Legal
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {footerLinks.slice(4).map((link) => (
                <Box component="li" key={link.path} sx={{ mb: 1.5 }}>
                  <Link
                    to={link.path}
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#FF6B35';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </Link>
                </Box>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: '#FF6B35',
                fontSize: '1.1rem'
              }}
            >
              Contact
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <Box component="li" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                <Typography 
                  component="a" 
                  href="mailto:support@hushryd.com"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'color 0.3s ease',
                    '&:hover': { color: '#FF6B35' }
                  }}
                >
                  support@hushryd.com
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                <Typography 
                  component="a" 
                  href="tel:+917780445190"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'color 0.3s ease',
                    '&:hover': { color: '#FF6B35' }
                  }}
                >
                  +91 7780445190
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationIcon sx={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }} />
                <Typography 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6
                  }}
                >
                  Manjeera Trinity Corporate,<br />
                  eSeva Ln, K P H B Phase 3,<br />
                  Kukatpally, Hyderabad,<br />
                  Telangana 500072
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box 
          sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            pt: 4,
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="body2"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.875rem'
            }}
          >
            © {new Date().getFullYear()} HushRyd. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

