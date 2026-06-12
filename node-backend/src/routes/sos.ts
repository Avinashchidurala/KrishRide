import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { sendSMS } from '../utils/smsService';
import { sendEmail } from '../utils/emailService';
import { config } from '../config/environment';

const router = express.Router();

  // Create SOS Alert (User & Driver)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, message, bookingId } = req.body;
    const userId = req.user!.userId;

    // Input validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Valid latitude and longitude coordinates are required' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinate values. Latitude: -90 to 90, Longitude: -180 to 180' });
    }

    if (message !== undefined && typeof message !== 'string') {
      return res.status(400).json({ error: 'Message must be a string' });
    }

    if (bookingId !== undefined && typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'Booking ID must be a string' });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        emergencyContacts: true,
        customer: {
          include: {
            bookings: {
              where: {
                status: 'started', // Only active rides
              },
              include: {
                ride: {
                  include: {
                    driver: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1, // Get most recent active booking
            },
          },
        },
        driver: {
          include: {
            rides: {
              where: {
                status: 'started', // Only active rides
              },
              include: {
                bookings: {
                  where: {
                    status: 'started',
                  },
                  include: {
                    customer: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                started_at: 'desc',
              },
              take: 1, // Get most recent active ride
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Capture last known live location from active booking if available
    let lastKnownLocation = null;
    let activeBookingId = bookingId || null;

    if (user.customer && user.customer.bookings.length > 0) {
      // Customer with active booking
      const activeBooking = user.customer.bookings[0];
      activeBookingId = activeBooking.id;
      // Location is provided in request, but we'll use it as last known
      lastKnownLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date(),
      };
    } 
    else if (user.driver && user.driver.rides.length > 0) {
      // Driver with active ride
      const activeRide = user.driver.rides[0];
      if (activeRide.bookings.length > 0) {
        activeBookingId = activeRide.bookings[0].id;
      }
      // Location is provided in request, but we'll use it as last known
      lastKnownLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date(),
      };
    }

    // Create SOS alert with last known location
    const sosAlert = await prisma.sosAlert.create({
      data: {
        userId,
        bookingId: activeBookingId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        message: message || 'Emergency SOS alert',
        status: 'active',
      },
    });

    // NEW: Send SMS to all emergency contacts asynchronously
    // Emergency contacts are now fetched from user.emergencyContacts (works for both drivers & customers)
    if (user.emergencyContacts && user.emergencyContacts.length > 0) 
    {
      const emergencyContacts = user.emergencyContacts;
      const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const smsMessage = `🚨 SOS ALERT: ${user.first_name} ${user.last_name} needs help. Location: ${locationUrl}`;
      
      console.log(`[SOS] Sending SMS to ${emergencyContacts.length} emergency contact(s)`);
      
      // Send SMS to all emergency contacts in parallel
      // This ensures one failure doesn't block others
      const smsPromises = emergencyContacts.map(async (contact) => {
        try {
          const result = await sendSMS(contact.mobile, smsMessage);
          if (result.success) {
            console.log(`[SOS-SMS] ✅ SMS sent to ${contact.mobile} (${contact.name || 'Contact'})`);
          } else {
            console.warn(`[SOS-SMS] ❌ Failed to send SMS to ${contact.mobile}: ${result.message}`);
          }
          return {
            contactName: contact.name || 'Unknown',
            phoneNumber: contact.mobile,
            success: result.success,
            message: result.message,
          };
        } catch (error: any) {
          console.error(`[SOS-SMS] Error sending SMS to ${contact.mobile}:`, error.message);
          return {
            contactName: contact.name || 'Unknown',
            phoneNumber: contact.mobile,
            success: false,
            message: error.message,
          };
        }
      });

      // Wait for all SMS to complete (non-blocking - failures don't affect others)
      const smsResults = await Promise.allSettled(smsPromises);
      const successCount = smsResults.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failureCount = smsResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length;
      
      console.log(`[SOS-SMS] Summary: ${successCount} succeeded, ${failureCount} failed out of ${emergencyContacts.length} contacts`);
    }

    /* OLD CODE (commented out - single contact SMS)
    // if (user.customer?.emergencyContacts && user.customer.emergencyContacts.length > 0) 
    // {
    //   const emergencyContacts = user.customer.emergencyContacts;
    //   const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    //   
    //   for (const contact of emergencyContacts) {
    //     await sendSMS(
    //       contact.mobile,
    //       `SOS ALERT: ${user.first_name} ${user.last_name} needs help. Location: ${locationUrl}`
    //     );
    //   }
    // }
    */

    // Create instant notification for admin (stored in Redis for real-time access)
    try {
      const { cacheService } = await import('../services/cacheService');
      const notificationKey = `admin:notification:sos:${sosAlert.id}`;
      const notification = {
        id: sosAlert.id,
        type: 'sos_alert',
        title: `🚨 SOS Alert: ${user.first_name} ${user.last_name}`,
        message: message || 'Emergency SOS alert triggered',
        userId: userId,
        userName: `${user.first_name} ${user.last_name}`,
        userMobile: user.mobile,
        userRole: user.role,
        latitude,
        longitude,
        locationUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        bookingId: activeBookingId,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      // Store notification in Redis (expires in 24 hours)
      await cacheService.set(notificationKey, JSON.stringify(notification), 24 * 60 * 60);
      
      // Add to admin notifications list
      const notificationsListKey = 'admin:notifications:list';
      const existingNotifications = await cacheService.get(notificationsListKey);
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
      notifications.unshift(notification);
      // Keep only last 100 notifications
      const trimmedNotifications = notifications.slice(0, 100);
      await cacheService.set(notificationsListKey, JSON.stringify(trimmedNotifications), 24 * 60 * 60);
    } 
    catch (error) 
    {
      console.error('Error creating admin notification:', error);
    }

    // Notify admin via email
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const adminEmailHtml = `
      <h2>🚨 SOS Alert Received</h2>
      <p><strong>User:</strong> ${user.first_name} ${user.last_name}</p>
      <p><strong>Mobile:</strong> ${user.mobile}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Location:</strong> <a href="${locationUrl}">${latitude}, ${longitude}</a></p>
      ${activeBookingId ? `<p><strong>Active Booking ID:</strong> ${activeBookingId}</p>` : ''}
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>SOS Alert ID:</strong> ${sosAlert.id}</p>
    `;

    await sendEmail(
      config.adminEmail,
      `🚨 SOS Alert: ${user.first_name} ${user.last_name}`,
      adminEmailHtml
    );

    // Log for admin dashboard
    console.log(`🚨 SOS Alert: User ${user.first_name} ${user.last_name} (${user.mobile}) at ${latitude}, ${longitude}`);

    res.json({
      sosAlert,
      message: 'SOS alert sent successfully. Admin and emergency contacts have been notified.',
      lastKnownLocation: lastKnownLocation ? {
        latitude: lastKnownLocation.latitude,
        longitude: lastKnownLocation.longitude,
        timestamp: lastKnownLocation.timestamp,
      } : null,
    });
  } catch (error: any) {
    console.error('SOS alert error:', error);
    res.status(500).json({ error: error.message || 'Failed to create SOS alert' });
  }
});

// Get user's SOS alerts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const sosAlerts = await prisma.sosAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ sosAlerts });
  } catch (error: any) {
    console.error('Error fetching SOS alerts:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch SOS alerts' });
  }
});

// Update SOS alert status
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;

    const sosAlert = await prisma.sosAlert.findUnique({
      where: { id },
    });

    if (!sosAlert || sosAlert.userId !== userId) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }

    const updated = await prisma.sosAlert.update({
      where: { id },
      data: { status },
    });

    res.json({ sosAlert: updated });
  } catch (error: any) {
    console.error('Error updating SOS alert:', error);
    res.status(500).json({ error: error.message || 'Failed to update SOS alert' });
  }
});

export default router;

