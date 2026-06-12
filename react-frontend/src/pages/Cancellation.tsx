import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import PublicLayout from '../components/layouts/PublicLayout';

export default function Cancellation() {
  return (
    <PublicLayout>
      <Box sx={{ minHeight: 'calc(100vh - 200px)', bgcolor: 'grey.50' }}>
        <Box sx={{ py: { xs: 6, md: 8 }, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
              Cancellation & Refund Policy
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Transparent, fair cancellation terms for all users
            </Typography>
          </Box>

          {/* Passenger Cancellation & Refund Structure */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'left' }}>
                1. Passenger Cancellation & Refund Structure
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Time Before Trip Start</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Refund %</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cancellation Charge</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Example (Trip at 10:00 AM)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>2 hours Before</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>100%</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>0%</TableCell>
                      <TableCell>Cancel Before 8:00 AM</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>1–2 hours before</TableCell>
                      <TableCell sx={{ color: 'warning.main', fontWeight: 600 }}>80%</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>20%</TableCell>
                      <TableCell>Cancel between 8:01 AM – 9:00 AM</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>30–60 minutes before</TableCell>
                      <TableCell sx={{ color: 'warning.main', fontWeight: 600 }}>60%</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>40%</TableCell>
                      <TableCell>Cancel between 9:01 AM – 9:30 AM</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>5–15 minutes before</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>0% (No Refund)</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>100%</TableCell>
                      <TableCell>Cancel between 9:31 AM – 9:55 AM</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Within 3 minutes of booking</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>100% refund</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>0%</TableCell>
                      <TableCell>Book at 9:10 AM, cancel before 9:13 AM</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Last-Minute Cancellation */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
                2. Last-Minute Cancellation (5–15 Minutes Before Trip)
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.75, textAlign: 'left' }}>
                <strong>No refund</strong>
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75, textAlign: 'left' }}>
                Driver cannot refill the seat at this stage.
              </Typography>
            </CardContent>
          </Card>

          {/* No-Show Policy */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'left' }}>
                3. No-Show Policy
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Situation</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Refund</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Example</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Passenger does not arrive at pickup or does not respond</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>No refund</TableCell>
                      <TableCell>Driver waits 9:55 AM – 10:00 AM, passenger doesn't show</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Driver Cancellation Policy */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'left' }}>
                4. Driver Cancellation Policy
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Driver Action</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Outcome</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Driver cancels at any time</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>100% refund to passenger</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Driver cancels within 30 minutes of trip</TableCell>
                      <TableCell>Penalty may apply; repeated cases may lead to account suspension</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Refund Processing Time */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'left' }}>
                5. Refund Processing Time
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Processing Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>UPI / Wallets</TableCell>
                      <TableCell>1–3 business days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cards</TableCell>
                      <TableCell>3–5 business days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Why This Policy Exists */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4, bgcolor: 'primary.50' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'left' }}>
                6. Why This Policy Exists
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.75, textAlign: 'left' }}>
                This policy ensures:
              </Typography>
              <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75 }}>
                    Fair, predictable refunds for passengers
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75 }}>
                    Drivers are protected from last-minute losses
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75 }}>
                    Reliable timings for intercity travel
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75 }}>
                    Improved safety for women by reducing trip uncertainty
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75 }}>
                    Stronger trust between drivers and passengers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Acceptance */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: 'grey.100' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
                7. Acceptance
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75, textAlign: 'left' }}>
                By booking a ride on HushRyd, you agree to this Cancellation & Refund Policy.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </PublicLayout>
  );
}

