import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  Shield as ShieldIcon,
  People as UsersIcon,
  DirectionsCar as CarIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';


export default function Safety() {
  return (

      <Box sx={{ minHeight: 'calc(100vh - 200px)', bgcolor: 'grey.50' }}>
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
              Safety Guidelines
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Your safety is our top priority
            </Typography>
          </Box>

          {/* Safety First Card */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4, bgcolor: 'primary.light' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ShieldIcon sx={{ color: 'primary.main', fontSize: '2.5rem' }} />
                <Typography variant="h5" fontWeight="bold">
                  Safety First
                </Typography>
              </Box>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.75, fontSize: '1.125rem', maxWidth: '70ch', textAlign: 'left', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                At HushRyd, safety is our number one priority. We've implemented comprehensive safety measures and 
                guidelines to ensure a secure experience for both drivers and passengers. Please read and follow 
                these guidelines to help keep our community safe.
              </Typography>
            </CardContent>
          </Card>

          {/* For Passengers */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <UsersIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" fontWeight="bold">
                  For Passengers
                </Typography>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Before Your Ride
                </Typography>
                <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <li>Verify the driver's identity and vehicle details match the app</li>
                  <li>Check the driver's rating and reviews</li>
                  <li>Share your trip details with a friend or family member</li>
                  <li>Confirm the destination before starting the ride</li>
                  <li>Wait in a safe, well-lit location for pickup</li>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  During Your Ride
                </Typography>
                <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <li>Wear your seatbelt at all times</li>
                  <li>Follow your route on the app to ensure you're going the right way</li>
                  <li>Trust your instincts - if something feels wrong, end the ride</li>
                  <li>Keep your phone charged and accessible</li>
                  <li>Don't share personal information unnecessarily</li>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  After Your Ride
                </Typography>
                <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <li>Rate your driver honestly</li>
                  <li>Report any safety concerns immediately</li>
                  <li>Confirm you've arrived safely</li>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* For Drivers */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <CarIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  For Drivers
                </Typography>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Vehicle Safety
                </Typography>
                <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <li>Ensure your vehicle is in good working condition</li>
                  <li>Keep your vehicle clean and well-maintained</li>
                  <li>Check brakes, tires, lights, and signals regularly</li>
                  <li>Have valid insurance and registration</li>
                  <li>Keep emergency supplies (first aid kit, fire extinguisher)</li>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Safe Driving Practices
                </Typography>
                <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <li>Obey all traffic laws and speed limits</li>
                  <li>Never drive under the influence of alcohol or drugs</li>
                  <li>Avoid using your phone while driving</li>
                  <li>Take breaks if you feel tired</li>
                  <li>Be courteous and respectful to passengers</li>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Passenger Safety
                </Typography>
                <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                  <li>Verify passenger identity matches the app</li>
                  <li>Confirm destination before starting the ride</li>
                  <li>Follow the GPS route unless passenger requests otherwise</li>
                  <li>Report any suspicious behavior immediately</li>
                  <li>Maintain professional boundaries</li>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Verification & Background Checks */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LockIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Verification & Background Checks
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                All drivers on HushRyd undergo a comprehensive verification process:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <li>Identity verification with government-issued ID</li>
                <li>Background checks for criminal history</li>
                <li>Driving record verification</li>
                <li>Vehicle inspection and documentation</li>
                <li>Regular re-verification to maintain safety standards</li>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                Passengers are also verified to ensure account authenticity and safety.
              </Typography>
            </CardContent>
          </Card>

          {/* Emergency Procedures */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <CheckIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Emergency Procedures
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3, fontWeight: 600 }}>
                In Case of Emergency:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <li>Call local emergency services immediately (100 for police, 102 for ambulance)</li>
                <li>Use the in-app emergency button to contact HushRyd support</li>
                <li>Report the incident through the app as soon as possible</li>
                <li>Document any relevant details (photos, witness information)</li>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                Our 24/7 support team is always available to assist in emergency situations.
              </Typography>
            </CardContent>
          </Card>

          {/* Reporting Safety Concerns */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <InfoIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Reporting Safety Concerns
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                If you experience or witness any safety issues, please report them immediately:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <li>Use the "Report" button in the app</li>
                <li>Contact our safety team at safety@hushryd.com</li>
                <li>Call our 24/7 safety hotline: +917780445190</li>
                <li>Provide as much detail as possible (time, location, description)</li>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                All reports are taken seriously and investigated promptly. We take appropriate action against 
                users who violate our safety guidelines.
              </Typography>
            </CardContent>
          </Card>

          {/* Safety Features */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ShieldIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Safety Features
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                HushRyd includes several built-in safety features:
              </Typography>
              <Box component="ul" sx={{ listStyle: 'disc', listStylePosition: 'inside', padding: 0, margin: 0, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.primary' }}>
                <li><strong>Real-time GPS tracking:</strong> Share your ride with trusted contacts</li>
                <li><strong>In-app emergency button:</strong> Quick access to emergency services</li>
                <li><strong>Driver verification:</strong> All drivers are verified and rated</li>
                <li><strong>Secure payments:</strong> Cashless transactions for safety</li>
                <li><strong>24/7 support:</strong> Always available to help</li>
                <li><strong>Incident reporting:</strong> Easy way to report issues</li>
              </Box>
            </CardContent>
          </Card>

          {/* Safety Contact */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Safety Contact
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3 }}>
                For safety-related questions or concerns:
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.75 }}>
                <strong>Email:</strong> support@hushryd.com<br />
                <strong>24/7 Hotline:</strong> +91 7780445190<br />
                <strong>Emergency:</strong> Use the in-app emergency button<br />
                <strong>Address:</strong> Manjeera Trinity Corporate, eSeva Ln, K P H B Phase 3, Kukatpally, Hyderabad, Telangana 500072
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

  );
}

