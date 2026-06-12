import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as FAQIcon,
  Description as DocsIcon,
} from '@mui/icons-material';

export default function Support() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      question: 'Can I drive rented Cars?',
      answer: 'Only if you are legally permitted and documents are valid.',
    },
    {
      question: 'Will I Earn money from rides?',
      answer: 'Drivers receive a fuel cost contribution, not profit. HushRyd promotes responsible cost-sharing.',
    },
    {
      question: 'How do I add money to my wallet?',
      answer: 'Navigate to "Payment & Wallet" section, click on "Add Money" and follow the payment instructions.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept payments through Razorpay (UPI, cards, netbanking). You can also add money to your wallet for faster bookings.',
    },
    {
      question: 'Can I reject ride requests?',
      answer: 'Yes, but frequent rejections may affect your rating and visibility.',
    },
    {
      question: 'What should I do in case of an emergency?',
      answer: 'Use the SOS feature available in your booking details or dashboard to alert emergency services and our support team.',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Support & Help
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Get help and support for your queries
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Contact Options */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'primary.main', p: 2.5, borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Contact Us
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <List>
                <ListItem sx={{ px: 0, py: 2,flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                  <ListItemIcon>
                    <EmailIcon sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Support"
                    secondary="support@hushryd.com"
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    href="mailto:support@hushryd.com"
                    sx={{ textTransform: 'none' }}
                  >
                    Send Email
                  </Button>
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 2 ,flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }}}>
                  <ListItemIcon>
                    <PhoneIcon sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Support"
                    secondary="+91 7780445190"
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    href="tel:+917780445190"
                    sx={{ textTransform: 'none' }}
                  >
                    Call Now
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'primary.main', p: 2.5, borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Quick Links
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <List>
                <ListItem
                  component={Link}
                  to="/driver/terms"
                  sx={{ borderRadius: 1, mb: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <DocsIcon sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText primary="Terms & Conditions" />
                </ListItem>
                <ListItem
                  component={Link}
                  to="/driver/privacy"
                  sx={{ borderRadius: 1, mb: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <DocsIcon sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText primary="Privacy Policy" />
                </ListItem>
                <ListItem
                  component={Link}
                  to="/driver/faq"
                  sx={{ borderRadius: 1, mb: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <FAQIcon sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText primary="FAQ" />
                </ListItem>
                <ListItem
                  component={Link}
                  to="/driver/safety"
                  sx={{ borderRadius: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <HelpIcon sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText primary="Safety Guidelines" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* FAQ Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'primary.main', p: 2.5, borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Frequently Asked Questions
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  expanded={expanded === `panel${index}`}
                  onChange={handleChange(`panel${index}`)}
                  sx={{ boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ px: 3, py: 2 }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

