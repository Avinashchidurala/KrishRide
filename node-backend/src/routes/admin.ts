import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { config } from '../config/environment';
import { sendKYCVerifiedEmail } from '../utils/emailService';
import { sendKYCVerifiedSMS } from '../utils/smsService';
import { cacheService, cacheKeys, cacheTTL } from '../services/cacheService';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const cacheKey = cacheKeys.adminStats();

    // Try to get from cache
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return res.json({ stats: cachedStats });
    }

    const [
      totalUsers,
      totalDrivers,
      totalCustomers,
      totalRides,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      pendingKYC,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.driver.count({ where: { user: { is_active: true } } }),
      prisma.customer.count(),
      prisma.ride.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ['confirmed', 'started'] } } }),
      prisma.booking.count({ where: { status: 'completed' } }),
      prisma.booking.count({ where: { status: 'cancelled' } }),
      prisma.booking.aggregate({
        where: { paymentStatus: 'success' },
        _sum: { total_fare: true },
      }),
      prisma.driverVerification.count({ where: { status: 'pending' } }),
    ]);

    const stats = {
      totalUsers,
      totalDrivers,
      totalCustomers,
      totalRides,
      totalBookings,
      activeBookings,
      totalRevenue: totalRevenue._sum.total_fare || 0,
      pendingKYC,
      completedBookings,
      cancelledBookings,
    };

    // Cache the stats
    await cacheService.set(cacheKey, stats, cacheTTL.adminStats);

    res.json({ stats });
  } catch (error: any) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
  }
});

// Get Recent Activity
router.get('/dashboard/recent-activity', async (req, res) => {
  try {
    const cacheKey = cacheKeys.adminRecentActivity();
    const cachedActivity = await cacheService.get(cacheKey);
    if (cachedActivity) {
      return res.json(cachedActivity);
    }
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        createdAt: true,
      },
    });
    const recentRides = await prisma.ride.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        ride: {
          select: {
            start_location: true,
            end_location: true,
          },
        },
      },
    });

    const activity = {
      recentUsers,
      recentRides,
      recentBookings,
    };

    await cacheService.set(cacheKey, activity, 30);

    res.json(activity);
  } catch (error: any) {
    console.error('Admin recent activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch recent activity' });
  }
});

// Get All Users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      // MySQL doesn't support mode: 'insensitive', but LIKE is case-insensitive by default
      // with utf8mb4_unicode_ci collation
      where.OR = [
        { first_name: { contains: search as string } },
        { last_name: { contains: search as string } },
        { mobile: { contains: search as string } },
        {
          AND: [
            { email: { not: null } },
            { email: { contains: search as string } }
          ]
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          driver: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// Get User Details
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            bookings: {
              include: {
                ride: true,
              },
            },
            savedAddresses: true,
          },
        },
        emergencyContacts: true,
        savedAddresses: true,
        driver: {
          include: {
            rides: {
              include: {
                bookings: true,
              },
            },
            vehicles: true,
            driverVerifications: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log document information for debugging
    if (user.driver) {
      console.log('Driver documents debug:', {
        driverId: user.driver.id,
        driverVerificationsCount: user.driver.driverVerifications?.length || 0,
        kyc_documents: user.driver.kyc_documents ? 'exists' : 'null',
        selfie_url: user.driver.selfie_url ? 'exists' : 'null',
      });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Admin user details error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user details' });
  }
});

// Export Users to Excel
router.get('/lists/export-users', async (req, res) => {
  try {
    const { role, search } = req.query;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { first_name: { contains: search as string } },
        { last_name: { contains: search as string } },
        { mobile: { contains: search as string } },
        {
          AND: [
            { email: { not: null } },
            { email: { contains: search as string } }
          ]
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        driver: true,
      },
    });

    // Format data for Excel
    const data = users.map(user => ({
      'First Name': user.first_name,
      'Last Name': user.last_name,
      'Mobile': user.mobile,
      'Email': user.email || '',
      'Role': user.role,
      'Status': user.is_active ? 'Active' : 'Inactive',
      'Gender': user.gender || '',
      // 'Age': user.age,
      // 'Phone Verified': user.is_phone_verified ? 'Yes' : 'No',
      'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
    }));

    // Create workbook and worksheet
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns (rudimentary)
    const wscols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 20) }));
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error: any) {
    console.error('Admin export users error:', error);
    res.status(500).json({ error: error.message || 'Failed to export users' });
  }
});

// Export Bookings to Excel
router.get('/lists/export-bookings', async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
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
    });

    // Format data for Excel
    const data = bookings.map(booking => {
      const customerName = booking.customer?.user
        ? `${booking.customer.user.first_name} ${booking.customer.user.last_name}`.trim()
        : 'N/A';

      const driverName = booking.ride?.driver?.user
        ? `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}`.trim()
        : 'N/A';

      return {
        'Booking ID': booking.booking_number || booking.id,
        'Date': booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
        'Customer': customerName,
        'Driver': driverName,
        'Pickup': booking.ride?.start_location || 'N/A',
        'Drop': booking.ride?.end_location || 'N/A',
        'Status': booking.status,
        'Payment Status': booking.paymentStatus,
        'Amount': booking.total_fare ? Number(booking.total_fare).toFixed(2) : '0.00',
        'Payment Method': booking.paymentMethod || 'N/A',
      };
    });

    // Create workbook and worksheet
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns (rudimentary)
    const wscols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 20) }));
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error: any) {
    console.error('Admin export bookings error:', error);
    res.status(500).json({ error: error.message || 'Failed to export bookings' });
  }
});

// Create User
router.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, role, gender, age, emergencyContactName, emergencyContactMobile } = req.body;

    if (!firstName || !lastName || !mobile || !role) {
      return res.status(400).json({ error: 'First name, last name, mobile, and role are required' });
    }

    if (!['customer', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be customer, driver, or admin' });
    }

    // Format mobile number consistently
    const cleanMobile = mobile.replace(/\D/g, '');
    const formattedMobile = `+91${cleanMobile}`;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: formattedMobile },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this mobile number already exists' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        mobile: formattedMobile,
        email: email || null,
        gender: gender && gender.trim() !== '' ? gender.trim() : null, // Handle empty strings
        age: age || 25,
        role: role,
        is_phone_verified: true,
        is_active: true,
        profile_completed: false,
        auth_provider: 'admin',
      },
    });

    // Create role-specific records
    if (role === 'customer') {
      await prisma.customer.create({
        data: {
          userId: user.id,
        },
      });
    } else if (role === 'driver') {
      await prisma.driver.create({
        data: {
          userId: user.id,
          kyc_status: 'pending',
        },
      });
    } else if (role === 'admin') {
      await prisma.admin.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Create emergency contact if provided
    if (emergencyContactName && emergencyContactMobile) {
      const cleanEmergencyMobile = emergencyContactMobile.replace(/\D/g, '');
      const formattedEmergencyMobile = `+91${cleanEmergencyMobile}`;

      await prisma.emergencyContact.create({
        data: {
          userId: user.id,
          name: emergencyContactName,
          mobile: formattedEmergencyMobile,
          is_primary: true,
        },
      });
    }

    // Fetch the created user with relations
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: true,
        driver: true,
        admin: true,
      },
    });

    // Send welcome email and SMS to admin-created user
    try {
      const userName = `${user.first_name} ${user.last_name}`.trim();
      const webUrl = config.corsOrigin;

      // Send welcome SMS
      if (user.mobile) {
        const { sendAdminCreatedUserSMS } = await import('../utils/smsService');
        await sendAdminCreatedUserSMS(user.mobile, userName, role as 'customer' | 'driver' | 'admin', webUrl);
      }

      // Send welcome email with login instructions
      if (user.email) {
        const { sendAdminCreatedUserEmail } = await import('../utils/emailService');
        await sendAdminCreatedUserEmail(user.email, userName, role as 'customer' | 'driver' | 'admin', user.mobile, webUrl);
      }
    } catch (error) {
      console.error('Error sending welcome notifications to admin-created user:', error);
      // Don't fail the user creation if notifications fail
    }

    res.status(201).json({ user: createdUser, message: 'User created successfully' });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// Update User Status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { is_active: isActive },
    });

    res.json({ user });
  } catch (error: any) {
    console.error('Admin update user status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user status' });
  }
});

// Get All Rides
router.get('/rides', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      // MySQL doesn't support mode: 'insensitive', but LIKE is case-insensitive by default
      where.OR = [
        { start_location: { contains: search as string } },
        { end_location: { contains: search as string } },
      ];
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            include: {
              user: true,
            },
          },
          bookings: true,
        },
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({
      rides,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin rides error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch rides' });
  }
});

// Get All Bookings
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    console.log('=== ADMIN BOOKINGS DIAGNOSTIC ===');
    console.log('Query params:', { page, limit, status, paymentStatus });

    // Diagnostic: Check if bookings table exists and has data using raw SQL
    try {
      const rawCount = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM bookings`;
      console.log('📊 Raw SQL count from bookings table:', Number(rawCount[0]?.count || 0));
    } catch (rawError: any) {
      console.error('❌ Raw SQL query error:', rawError.message);
    }

    // Build where clause - only add filters if they have valid values
    const where: any = {};
    if (status && status !== '' && status !== 'undefined' && status !== 'null') {
      where.status = status;
    }
    if (paymentStatus && paymentStatus !== '' && paymentStatus !== 'undefined' && paymentStatus !== 'null') {
      where.paymentStatus = paymentStatus;
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    // First, get total count WITHOUT any filters to see if bookings exist
    const allBookingsCount = await prisma.booking.count();
    console.log(`📊 Total bookings in database (no filters): ${allBookingsCount}`);

    // Get total with filters
    const total = await prisma.booking.count({ where });
    console.log(`📊 Total bookings with filters: ${total}`);

    // Get sample booking to see structure
    if (allBookingsCount > 0) {
      const sampleBooking = await prisma.booking.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      console.log('📋 Sample booking (first record):', {
        id: sampleBooking?.id,
        status: sampleBooking?.status,
        paymentStatus: sampleBooking?.paymentStatus,
        customerId: sampleBooking?.customerId,
        rideId: sampleBooking?.rideId,
        createdAt: sampleBooking?.createdAt,
      });

      // Get distinct statuses and paymentStatuses
      const allBookings = await prisma.booking.findMany({
        select: { status: true, paymentStatus: true },
      });
      const distinctStatuses = [...new Set(allBookings.map(b => b.status))];
      const distinctPaymentStatuses = [...new Set(allBookings.map(b => b.paymentStatus))];
      console.log('📋 Available statuses in database:', distinctStatuses);
      console.log('📋 Available paymentStatuses in database:', distinctPaymentStatuses);
    }

    if (total === 0 && allBookingsCount > 0) {
      console.warn('⚠️ WARNING: Filters are excluding all bookings!');
      console.warn('Applied where clause:', where);
    }

    if (allBookingsCount === 0) {
      console.warn('⚠️ WARNING: No bookings found in database at all!');
    }

    // Get bookings with relationships
    // Handle cases where relationships might be missing
    let bookings: any[] = [];
    try {
      console.log('🔍 Executing Prisma query with where:', JSON.stringify(where, null, 2));
      bookings = await prisma.booking.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  mobile: true,
                  email: true,
                },
              },
            },
          },
          ride: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      mobile: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      console.log(`✅ Found ${bookings.length} bookings with Prisma query`);
    } catch (includeError: any) {
      console.error('Error fetching bookings with includes:', includeError);
      // Fallback: Get bookings without includes if there's an issue
      console.log('Attempting fallback query without includes...');
      const bookingsWithoutIncludes = await prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      });

      // Manually fetch relationships for each booking
      bookings = await Promise.all(
        bookingsWithoutIncludes.map(async (booking) => {
          try {
            const [customer, ride] = await Promise.all([
              prisma.customer.findUnique({
                where: { id: booking.customerId },
                include: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      mobile: true,
                      email: true,
                    },
                  },
                },
              }),
              booking.rideId ? prisma.ride.findUnique({
                where: { id: booking.rideId },
                include: {
                  driver: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          first_name: true,
                          last_name: true,
                          mobile: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              }) : null,
            ]);

            return {
              ...booking,
              customer: customer || null,
              ride: ride || null,
            };
          } catch (err) {
            console.error(`Error fetching relationships for booking ${booking.id}:`, err);
            return {
              ...booking,
              customer: null,
              ride: null,
            };
          }
        })
      );
    }

    console.log(`Admin bookings found: ${bookings.length} out of ${total} total`);
    console.log('Sample booking:', bookings.length > 0 ? JSON.stringify(bookings[0], null, 2) : 'No bookings');

    // Format bookings to ensure all fields are properly serialized
    const formattedBookings = bookings.map((booking: any) => ({
      ...booking,
      total_fare: booking.total_fare ? Number(booking.total_fare) : 0,
      base_fare: booking.base_fare ? Number(booking.base_fare) : 0,
      platform_fee: booking.platform_fee ? Number(booking.platform_fee) : 0,
      service_tax: booking.service_tax ? Number(booking.service_tax) : null,
      driver_fee: booking.driver_fee ? Number(booking.driver_fee) : 0,
    }));

    res.json({
      bookings: formattedBookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin bookings error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
});

// Update Booking Payment Status
router.put('/bookings/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['pending', 'success', 'failed', 'refund_initiated', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus,
      },
    });

    res.json({ booking });
  } catch (error: any) {
    console.error('Admin update booking payment status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update booking payment status' });
  }
});

// Get Pending KYC Verifications (grouped by driver)
router.get('/kyc/pending', async (req, res) => {
  try {
    // Get all pending drivers
    const drivers = await prisma.driver.findMany({
      where: { kyc_status: 'pending' },
      include: {
        user: true,
        driverVerifications: {
          where: { status: 'pending' },
        },
      },
      orderBy: { kyc_submitted_at: 'desc' },
    });

    // Format response with all documents grouped by driver
    const verifications = drivers.map(driver => {
      const docs = driver.driverVerifications.reduce((acc: any, doc: any) => {
        acc[doc.document_type] = {
          id: doc.id,
          document_number: doc.document_number,
          document_url: doc.document_url,
          status: doc.status,
          expires_at: doc.expires_at,
        };
        return acc;
      }, {});

      return {
        driverId: driver.id,
        driver: {
          id: driver.id,
          user: driver.user,
          aadhar_number: driver.aadhar_number,
          pan_number: driver.pan_number,
          license_number: driver.license_number,
          license_expiry: driver.license_expiry,
          bank_name: driver.bank_name,
          bank_ifsc_code: driver.bank_ifsc_code,
          bank_account_number: driver.bank_account_number,
          selfie_url: driver.selfie_url,
          kyc_submitted_at: driver.kyc_submitted_at,
        },
        documents: {
          aadhar: docs.aadhar || null,
          pan: docs.pan || null,
          driving_license: docs.driving_license || null,
          selfie: driver.selfie_url ? { document_url: driver.selfie_url } : null,
        },
        submittedAt: driver.kyc_submitted_at,
      };
    });

    res.json({ verifications });
  } catch (error: any) {
    console.error('Admin KYC pending error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch pending KYC' });
  }
});

// Approve/Reject KYC (by driver ID)
router.put('/kyc/:driverId/verify', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
    }

    // Verify all pending documents for this driver
    await prisma.driverVerification.updateMany({
      where: {
        driverId,
        status: 'pending',
      },
      data: {
        status,
        rejection_reason: status === 'rejected' ? (remarks || null) : null,
        verified_at: new Date(),
      },
    });

    // Update driver KYC status
    if (status === 'approved') {
      // Set expiry to 6 months from now
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      await prisma.driver.update({
        where: { id: driverId },
        data: {
          kyc_status: 'approved',
          kyc_verified_at: new Date(),
          kyc_expires_at: expiryDate,
          is_driver_approved: true, // Set driver as approved
        },
      });
    } else if (status === 'rejected') {
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          kyc_status: 'rejected',
          is_driver_approved: false, // Set driver as not approved
        },
      });
    }

    // Get updated driver with documents
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true,
        driverVerifications: true,
      },
    });

    // Send SMS, Email, and Push notifications for KYC verification
    if (driver && driver.user) {
      try {
        const driverName = `${driver.user.first_name} ${driver.user.last_name}`;

        // Send SMS
        if (driver.user.mobile) {
          await sendKYCVerifiedSMS(
            driver.user.mobile,
            driverName,
            status,
            remarks
          );
        }

        // Send Email
        if (driver.user.email) {
          await sendKYCVerifiedEmail(
            driver.user.email,
            driverName,
            status,
            remarks
          );
        }

        // Note: Push notifications removed - user will be notified via SMS and Email only
      } catch (error) {
        console.error('Error sending KYC verification notifications:', error);
        // Don't fail the request if notifications fail
      }
    }

    res.json({
      message: `KYC ${status} successfully`,
      driver,
    });
  } catch (error: any) {
    console.error('Admin KYC verify error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify KYC' });
  }
});

// Get Complaints
router.get('/complaints', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mobile: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    res.json({
      complaints,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin complaints error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch complaints' });
  }
});

// Update Complaint Status
router.put('/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Note: Complaint model only has status field (no resolution or resolved_at)
    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
      },
    });

    res.json({ complaint });
  } catch (error: any) {
    console.error('Admin update complaint error:', error);
    res.status(500).json({ error: error.message || 'Failed to update complaint' });
  }
});

// Get SOS Alerts
router.get('/sos', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [sosAlerts, total] = await Promise.all([
      prisma.sosAlert.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      }),
      prisma.sosAlert.count({ where }),
    ]);

    res.json({
      sosAlerts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin SOS alerts error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch SOS alerts' });
  }
});

// Update SOS Alert Status (Admin only)
router.put('/sos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'acknowledged', 'resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if SOS alert exists
    const sosAlert = await prisma.sosAlert.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!sosAlert) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }

    // Update the SOS alert status
    const updated = await prisma.sosAlert.update({
      where: { id },
      data: { status },
      include: {
        user: true,
      },
    });

    // Log the status update
    console.log(`✅ Admin updated SOS alert ${id} status to ${status}`);

    res.json({
      sosAlert: updated,
      message: `SOS alert status updated to ${status}`
    });
  } catch (error: any) {
    console.error('Error updating SOS alert status:', error);
    res.status(500).json({ error: error.message || 'Failed to update SOS alert status' });
  }
});

// Get Live Rides (Active/ongoing rides monitoring)
router.get('/rides/live', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get active rides (status: 'started')
    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: {
          status: 'started',
        },
        skip,
        take: Number(limit),
        orderBy: { started_at: 'desc' },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  mobile: true,
                  email: true,
                },
              },
              vehicles: {
                where: {
                  is_active: true,
                },
                take: 1, // Get the first active vehicle
                select: {
                  id: true,
                  vehicle_model: true,
                  vehicle_color: true,
                  vehicle_plate_number: true,
                },
              },
            },
          },
          bookings: {
            where: {
              status: 'started',
            },
            include: {
              customer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      mobile: true,
                    },
                  },
                },
              },
            },
          },
          vehicle: {
            select: {
              id: true,
              vehicle_model: true,
              vehicle_color: true,
              vehicle_plate_number: true,
            },
          },
        },
      }),
      prisma.ride.count({
        where: {
          status: 'started',
        },
      }),
    ]);

    // Format response with booking details
    const liveRides = rides.map((ride) => ({
      id: ride.id,
      driver: {
        id: ride.driver.user.id,
        name: `${ride.driver.user.first_name} ${ride.driver.user.last_name}`,
        mobile: ride.driver.user.mobile,
        email: ride.driver.user.email,
      },
      vehicle: ride.vehicle
        ? {
          model: ride.vehicle.vehicle_model,
          color: ride.vehicle.vehicle_color,
          plateNumber: ride.vehicle.vehicle_plate_number,
        }
        : null,
      route: {
        startLocation: ride.start_location,
        endLocation: ride.end_location,
        startLatitude: ride.start_latitude,
        startLongitude: ride.start_longitude,
        endLatitude: ride.end_latitude,
        endLongitude: ride.end_longitude,
      },
      startedAt: ride.started_at,
      bookings: ride.bookings.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.booking_number,
        customer: {
          id: booking.customer.user.id,
          name: `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
          mobile: booking.customer.user.mobile,
        },
        passengerCount: booking.passengerCount,
        totalFare: booking.total_fare,
        pickupVerified: booking.pickup_verified,
        dropVerified: booking.drop_verified,
      })),
    }));

    res.json({
      liveRides,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin live rides error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch live rides' });
  }
});

// Get Revenue Report
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('Revenue query params:', { startDate, endDate });

    const where: any = {
      paymentStatus: 'success',
    };

    if (startDate && endDate) {
      // Set start date to beginning of day (00:00:00)
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);

      // Set end date to end of day (23:59:59.999) to include the entire day
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: start,
        lte: end,
      };

      console.log('Date range filter:', {
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }

    const [totalRevenue, bookings] = await Promise.all([
      prisma.booking.aggregate({
        where,
        _sum: { total_fare: true },
        _count: true,
      }),
      prisma.booking.findMany({
        where,
        include: {
          customer: {
            include: {
              user: true,
            },
          },
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
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Convert Decimal to number for totalRevenue
    const totalRevenueAmount = totalRevenue._sum.total_fare
      ? Number(totalRevenue._sum.total_fare)
      : 0;

    console.log('Revenue results:', {
      totalRevenue: totalRevenueAmount,
      totalBookings: totalRevenue._count,
      bookingsCount: bookings.length,
    });

    res.json({
      totalRevenue: totalRevenueAmount,
      totalBookings: totalRevenue._count,
      bookings: bookings.map((booking: any) => ({
        ...booking,
        total_fare: Number(booking.total_fare),
        base_fare: Number(booking.base_fare),
        platform_fee: Number(booking.platform_fee),
        service_tax: booking.service_tax ? Number(booking.service_tax) : null,
        driver_fee: Number(booking.driver_fee),
      })),
    });
  } catch (error: any) {
    console.error('Admin revenue error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch revenue report' });
  }
});

// Get All Drivers with Wallet Balances (for admin payout initiation)
router.get('/drivers/wallet-balances', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { first_name: { contains: search as string, mode: 'insensitive' } },
          { last_name: { contains: search as string, mode: 'insensitive' } },
          { mobile: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { wallet_balance: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mobile: true,
              email: true,
            },
          },
          payouts: {
            where: {
              status: { in: ['pending', 'processing'] },
            },
            select: {
              amount: true,
            },
          },
        },
      }),
      prisma.driver.count({ where }),
    ]);

    const driversWithBalances = drivers.map((driver) => {
      const walletBalance = Number(driver.wallet_balance) || 0;
      const pendingPayouts = driver.payouts.reduce((sum, p) => sum + Number(p.amount), 0);
      const availableForPayout = walletBalance - pendingPayouts;

      return {
        id: driver.id,
        userId: driver.userId,
        name: `${driver.user?.first_name || ''} ${driver.user?.last_name || ''}`.trim(),
        mobile: driver.user?.mobile || '',
        email: driver.user?.email || '',
        walletBalance,
        pendingPayouts,
        availableForPayout,
        bankName: driver.bank_name || 'Not set',
        bankAccount: driver.bank_account_number ? `${driver.bank_account_number.substring(0, 4)}****` : 'Not set',
        bankIFSC: driver.bank_ifsc_code || 'Not set',
        hasBankDetails: !!(driver.bank_name && driver.bank_account_number && driver.bank_ifsc_code),
      };
    });

    res.json({
      drivers: driversWithBalances,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin drivers wallet balances error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch drivers wallet balances' });
  }
});

// Create Payout (Admin Initiated)
router.post('/payouts/create', async (req, res) => {
  try {
    const { driverId, amount, payoutMethod = 'bank', transactionId } = req.body;

    if (!driverId || !amount) {
      return res.status(400).json({ error: 'Driver ID and amount are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const walletBalance = Number(driver.wallet_balance) || 0;

    if (amount > walletBalance) {
      return res.status(400).json({
        error: `Insufficient wallet balance. Available: ₹${walletBalance}, Requested: ₹${amount}`
      });
    }

    // Check for pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        driverId: driver.id,
        status: { in: ['pending', 'processing'] },
      },
    });

    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const availableBalance = walletBalance - pendingAmount;

    if (amount > availableBalance) {
      return res.status(400).json({
        error: `Insufficient available balance. Available: ₹${availableBalance}, Pending payouts: ₹${pendingAmount}`
      });
    }

    // Validate bank details if payout method is bank
    if (payoutMethod === 'bank' && (!driver.bank_name || !driver.bank_ifsc_code || !driver.bank_account_number)) {
      return res.status(400).json({
        error: 'Driver bank details are required for bank payouts'
      });
    }

    // Create payout (admin initiated, can be marked as completed immediately if transactionId provided)
    const payout = await prisma.payout.create({
      data: {
        driverId: driver.id,
        amount: amount,
        payout_method: payoutMethod,
        status: transactionId ? 'completed' : 'pending',
        transaction_id: transactionId || null,
        processed_at: transactionId ? new Date() : null,
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                mobile: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // If marked as completed, deduct from wallet
    if (transactionId) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          wallet_balance: { decrement: amount },
        },
      });
    }

    res.status(201).json({
      payout,
      message: transactionId
        ? 'Payout created and completed successfully'
        : 'Payout created successfully. Update status to complete when processed.',
    });
  } catch (error: any) {
    console.error('Admin create payout error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payout' });
  }
});

// Get All Payouts
router.get('/payouts', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, driverId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (driverId) {
      where.driverId = driverId;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  mobile: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    res.json({
      payouts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin payouts error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch payouts' });
  }
});

// Update Payout Status
router.put('/payouts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current payout to check status and amount
    const currentPayout = await prisma.payout.findUnique({
      where: { id },
      include: {
        driver: true,
      },
    });

    if (!currentPayout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Use transaction to ensure atomicity
    const payout = await prisma.$transaction(async (tx) => {
      // If marking as completed, deduct from driver wallet
      if (status === 'completed' && currentPayout.status !== 'completed') {
        const driver = await tx.driver.findUnique({
          where: { id: currentPayout.driverId },
        });

        if (!driver) {
          throw new Error('Driver not found');
        }

        const walletBalance = Number(driver.wallet_balance) || 0;
        const payoutAmount = Number(currentPayout.amount);

        if (walletBalance < payoutAmount) {
          throw new Error(`Insufficient wallet balance. Available: ₹${walletBalance}, Requested: ₹${payoutAmount}`);
        }

        // Deduct from driver wallet
        await tx.driver.update({
          where: { id: currentPayout.driverId },
          data: {
            wallet_balance: { decrement: payoutAmount },
          },
        });
      }

      // If reverting from completed, refund to wallet
      if (currentPayout.status === 'completed' && status !== 'completed') {
        const payoutAmount = Number(currentPayout.amount);

        // Refund to driver wallet
        await tx.driver.update({
          where: { id: currentPayout.driverId },
          data: {
            wallet_balance: { increment: payoutAmount },
          },
        });
      }

      // Update payout status
      return await tx.payout.update({
        where: { id },
        data: {
          status,
          transaction_id: transactionId || null,
          processed_at: status === 'completed' ? new Date() : null,
        },
        include: {
          driver: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    res.json({ payout });
  } catch (error: any) {
    console.error('Admin update payout error:', error);
    res.status(500).json({ error: error.message || 'Failed to update payout' });
  }
});

// Get All Support Tickets
router.get('/support-tickets', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, assignedTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (assignedTo) {
      where.assigned_to = assignedTo;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin support tickets error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch support tickets' });
  }
});

// Update Support Ticket
router.put('/support-tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: status || undefined,
        priority: priority || undefined,
        assigned_to: assignedTo || undefined,
      },
      include: {
        user: true,
      },
    });

    res.json({ ticket });
  } catch (error: any) {
    console.error('Admin update support ticket error:', error);
    res.status(500).json({ error: error.message || 'Failed to update support ticket' });
  }
});

// Get All Vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Search by driver name (first_name, last_name, or mobile)
    if (search) {
      where.driver = {
        user: {
          OR: [
            { first_name: { contains: search as string, mode: 'insensitive' } },
            { last_name: { contains: search as string, mode: 'insensitive' } },
            { mobile: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            include: {
              user: true,
            },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({
      vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin vehicles error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch vehicles' });
  }
});

// Update Vehicle Status
router.put('/vehicles/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        is_active: isActive === true || isActive === 'true',
      },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json({ vehicle });
  } catch (error: any) {
    console.error('Admin update vehicle status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update vehicle status' });
  }
});

// Get Analytics Data
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // User growth (simplified - get daily counts)
    const allUsers = await prisma.user.findMany({
      where: dateFilter,
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Driver performance
    const driverStats = await prisma.driver.findMany({
      where: dateFilter.createdAt ? {
        createdAt: dateFilter.createdAt,
      } : {},
      include: {
        user: true,
        rides: {
          where: { status: 'completed' },
        },
        payouts: true,
      },
    });

    // Booking trends (simplified - get all bookings)
    const allBookings = await prisma.booking.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'success',
      },
      select: {
        createdAt: true,
        total_fare: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Ride completion rate
    const totalRides = await prisma.ride.count({
      where: dateFilter.createdAt ? {
        createdAt: dateFilter.createdAt,
      } : {},
    });
    const completedRides = await prisma.ride.count({
      where: {
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
        status: 'completed',
      },
    });
    const completionRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;

    // Group bookings by date
    const bookingTrends = allBookings.reduce((acc: any, booking: any) => {
      const date = new Date(booking.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { createdAt: date, _count: 0, _sum: { total_fare: 0 } };
      }
      acc[date]._count++;
      acc[date]._sum.total_fare += Number(booking.total_fare);
      return acc;
    }, {});

    res.json({
      userGrowth: allUsers.length,
      driverStats: driverStats.map((driver) => ({
        id: driver.id,
        name: `${driver.user.first_name} ${driver.user.last_name}`,
        totalRides: driver.rides.length,
        totalEarnings: driver.total_earnings ? Number(driver.total_earnings) : 0,
        averageRating: driver.average_rating ? Number(driver.average_rating) : 0,
        totalPayouts: driver.payouts.length,
      })),
      bookingTrends: Object.values(bookingTrends).map((trend: any) => ({
        ...trend,
        _sum: {
          total_fare: Number(trend._sum.total_fare || 0),
        },
      })),
      completionRate,
      totalRides,
      completedRides,
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

// Get Surge Pricing Settings (Global or Per City)
router.get('/settings/surge-pricing', async (req, res) => {
  try {
    const { city } = req.query; // Optional city parameter

    let cacheKey = 'admin:surge-pricing-settings:global';
    if (city) {
      cacheKey = `admin:surge-pricing-settings:city:${city}`;
    }

    // Try to get from cache
    const cachedSettings = await cacheService.get(cacheKey);
    if (cachedSettings) {
      return res.json({ settings: cachedSettings, scope: city ? 'city' : 'global' });
    }

    // Default global settings
    const defaultSettings = {
      enabled: true,
      multiplier: 1.25,
      basePricePerKm: 7, // 6-8 Rs/km range
      scope: city ? 'city' : 'global',
      city: city || null,
    };

    // Cache default settings
    await cacheService.set(cacheKey, defaultSettings, 86400); // 24 hours

    res.json({ settings: defaultSettings, scope: city ? 'city' : 'global' });
  } catch (error: any) {
    console.error('Get surge pricing settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to get surge pricing settings' });
  }
});

// Update Surge Pricing Settings (Global or Per City)
router.put('/settings/surge-pricing', async (req, res) => {
  try {
    const { enabled, multiplier, basePricePerKm, scope, city } = req.body;
    // scope: 'global' or 'city'
    // city: required if scope is 'city'

    // Validation
    if (scope && !['global', 'city'].includes(scope)) {
      return res.status(400).json({ error: 'scope must be "global" or "city"' });
    }

    if (scope === 'city' && !city) {
      return res.status(400).json({ error: 'city is required when scope is "city"' });
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    if (multiplier !== undefined && (typeof multiplier !== 'number' || multiplier < 0)) {
      return res.status(400).json({ error: 'multiplier must be a positive number' });
    }

    // Base fare validation: must be positive
    if (basePricePerKm !== undefined) {
      if (typeof basePricePerKm !== 'number' || basePricePerKm < 0) {
        return res.status(400).json({ error: 'basePricePerKm must be a positive number' });
      }
    }

    const targetScope = scope || 'global';
    const targetCity = targetScope === 'city' ? city : null;
    const cacheKey = targetScope === 'city'
      ? `admin:surge-pricing-settings:city:${targetCity}`
      : 'admin:surge-pricing-settings:global';

    // Get current settings
    const currentSettingsRaw: any = await cacheService.get(cacheKey);
    const defaultSettings = {
      enabled: true,
      multiplier: 1.25,
      basePricePerKm: 7,
      scope: targetScope,
      city: targetCity,
    };

    const currentSettings: {
      enabled: boolean;
      multiplier: number;
      basePricePerKm: number;
      scope?: string;
      city?: string | null;
    } = currentSettingsRaw || defaultSettings;

    // Update settings
    const updatedSettings: {
      enabled: boolean;
      multiplier: number;
      basePricePerKm: number;
      scope: string;
      city: string | null;
    } = {
      enabled: enabled !== undefined ? enabled : currentSettings.enabled,
      multiplier: multiplier !== undefined ? multiplier : currentSettings.multiplier,
      basePricePerKm: basePricePerKm !== undefined ? basePricePerKm : currentSettings.basePricePerKm,
      scope: targetScope,
      city: targetCity,
    };

    // Save to cache
    await cacheService.set(cacheKey, updatedSettings, 86400); // 24 hours

    // Invalidate ride search cache to reflect new pricing
    await cacheService.deletePattern('ride:search:*');

    res.json({
      settings: updatedSettings,
      scope: targetScope,
      message: `Surge pricing settings updated successfully for ${targetScope}${targetCity ? ` (${targetCity})` : ''}`
    });
  } catch (error: any) {
    console.error('Update surge pricing settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to update surge pricing settings' });
  }
});

// Get Admin Notifications (for real-time SOS alerts)
router.get('/notifications', async (req, res) => {
  try {
    const { unreadOnly = 'false' } = req.query;
    const notificationsListKey = 'admin:notifications:list';
    const existingNotifications = await cacheService.get(notificationsListKey);

    if (!existingNotifications) {
      return res.json({ notifications: [], unreadCount: 0 });
    }

    let notifications = JSON.parse(existingNotifications);

    // Filter unread only if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter((n: any) => !n.read);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    res.json({
      notifications: notifications.slice(0, 50), // Return latest 50
      unreadCount
    });
  } catch (error: any) {
    console.error('Admin notifications error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notificationsListKey = 'admin:notifications:list';
    const existingNotifications = await cacheService.get(notificationsListKey);

    if (!existingNotifications) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    let notifications = JSON.parse(existingNotifications);
    const notificationIndex = notifications.findIndex((n: any) => n.id === id);

    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notifications[notificationIndex].read = true;
    await cacheService.set(notificationsListKey, JSON.stringify(notifications), 24 * 60 * 60);

    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

// Mark All Notifications as Read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const notificationsListKey = 'admin:notifications:list';
    const existingNotifications = await cacheService.get(notificationsListKey);

    if (!existingNotifications) {
      return res.json({ message: 'No notifications to mark as read' });
    }

    let notifications = JSON.parse(existingNotifications);
    notifications = notifications.map((n: any) => ({ ...n, read: true }));
    await cacheService.set(notificationsListKey, JSON.stringify(notifications), 24 * 60 * 60);

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark all notifications as read' });
  }
});

// Create Dummy SOS Alert for Testing
router.post('/notifications/dummy-sos', async (req, res) => {
  try {
    // Get a random user (customer or driver) for the dummy SOS
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['customer', 'driver'] },
      },
      take: 1,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found to create dummy SOS' });
    }

    const user = users[0];
    const dummyId = `dummy-${Date.now()}`;

    // Random location in India (around Bangalore)
    const latitude = 12.9716 + (Math.random() - 0.5) * 0.1;
    const longitude = 77.5946 + (Math.random() - 0.5) * 0.1;
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Create dummy SOS notification
    const notification = {
      id: dummyId,
      type: 'sos_alert',
      title: `🚨 SOS Alert: ${user.first_name} ${user.last_name}`,
      message: 'This is a test SOS alert for admin notifications',
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      userMobile: user.mobile,
      userRole: user.role,
      latitude,
      longitude,
      locationUrl,
      bookingId: null,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Store notification in Redis
    const notificationKey = `admin:notification:sos:${dummyId}`;
    await cacheService.set(notificationKey, JSON.stringify(notification), 24 * 60 * 60);

    // Add to admin notifications list
    const notificationsListKey = 'admin:notifications:list';
    const existingNotifications = await cacheService.get(notificationsListKey);
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
    notifications.unshift(notification);
    // Keep only last 100 notifications
    const trimmedNotifications = notifications.slice(0, 100);
    await cacheService.set(notificationsListKey, JSON.stringify(trimmedNotifications), 24 * 60 * 60);

    // Also create a real SOS alert in database for consistency
    const sosAlert = await prisma.sosAlert.create({
      data: {
        userId: user.id,
        bookingId: null,
        latitude,
        longitude,
        status: 'active',
      },
    });

    res.json({
      message: 'Dummy SOS alert created successfully',
      notification,
      sosAlert,
    });
  } catch (error: any) {
    console.error('Create dummy SOS error:', error);
    res.status(500).json({ error: error.message || 'Failed to create dummy SOS alert' });
  }
});

// Cancel Booking (Admin)
router.post('/:id/cancel', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { paymentStatus } = req.body; // Accept paymentStatus from request
    console.log(bookingId)
    // const userId = req.user.userId;

    // const customer = await prisma.customer.findUnique({
    //   where: { userId },
    // });

    // if (!customer) {
    //   return res.status(404).json({ error: 'Customer not found' });
    // }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: true,
      },
    });

    //get ride from booking
    const ride = await prisma.ride.findUnique({
      where:{id:booking?.rideId}
    })

    const driverId  = ride?.driverId

    console.log(booking)

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // if (booking.customerId !== customer.id) {
    //   return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    // }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed booking' });
    }

    if (booking.status === 'started') {
      return res.status(400).json({ error: 'Cannot cancel started ride. Please contact support.' });
    }

    // Store original payment status and method before transaction
    const originalPaymentStatus = booking.paymentStatus;
    const originalPaymentMethod = booking.paymentMethod?.toLowerCase() || 'razorpay';
    const paymentId = booking.utr_number; // Razorpay payment ID

    const adminEarnings = Number(booking.total_fare) - Number(booking.base_fare);
    const driverEarnings = Number(booking.base_fare) - Number(booking.platform_fee);

    // Use transaction for cancellation
    await prisma.$transaction(async (tx) => {
      // Update booking status with cancellation tracking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          paymentStatus: paymentStatus || (originalPaymentStatus === 'success' ? 'refund_initiated' : originalPaymentStatus),
          cancelledBy: 'admin',
          // Store cancellation info in a JSON field (we'll add cancelled_by to schema later if needed)
          // For now, we can track it via the user making the request
        },
      });

      // Refund based on payment method if payment was successful
      if (originalPaymentStatus === 'success') {
        if (originalPaymentMethod === 'wallet') {
          // Refund to wallet for wallet payments
          await tx.customer.update({
            where: { id: booking.customerId },
            data: {
              wallet_balance: { increment: Number(booking.base_fare) },
            },
          });

          // Create refund transaction
          await tx.walletTransaction.create({
            data: {
              customerId: booking.customerId,
              amount: Number(booking.base_fare),
              type: 'credit',
              transaction_type: 'refund',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
            },
          });

          // await tx.driver.update({
          //   where:{id:driverId},
          //   data:{
          //     wallet_balance:{decrement:driverEarnings}
          //   }
          // })

          await tx.driverWalletTransaction.create({
            data: {
              driverId: driverId,
              amount: booking.base_fare,
              type: 'debit',
              transaction_type: 'refund_adjustment',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
            }
          });

          await tx.admin.update({
            where: { id: config.adminId },
            data: {
              wallet_balance: { decrement: booking.base_fare },
            },
          });

          await tx.adminWalletTransaction.create({
            data: {
              adminId: config.adminId,
              amount: booking.base_fare,
              type: 'debit',
              transaction_type: 'refund_adjustment',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
              driverId: driverId,
              customerId: booking.customerId,
            }
          });
        }

        // For Razorpay and other payment gateways, paymentStatus is already set to 'refund_initiated' above
        // Actual refund will be processed after transaction commits
      }

      // Decrement total bookings
      await tx.customer.update({
        where: { id: booking.customerId },
        data: {
          total_bookings: { decrement: 1 },
          cancelled_bookings: { increment: 1 },
        },
      });

      // Release seats (seats were reserved when booking was created)
      // Release for all statuses since seats are reserved on creation
      await tx.ride.update({
        where: { id: booking.rideId },
        data: {
          seats_booked: { decrement: booking.passengerCount },
        },
      });
    }, { timeout: 60000 });

    // Initiate refund to original payment method if payment was successful
    let refundInitiated = false;
    let refundMethod = 'none';

    if (originalPaymentStatus === 'success') {
      if (originalPaymentMethod === 'wallet') {
        // Wallet refund is already processed in transaction above
        refundInitiated = true;
        refundMethod = 'wallet';
      } else if (originalPaymentMethod === 'razorpay' && paymentId) {
        // Initiate Razorpay refund
        try {
          const Razorpay = require('razorpay');
          const { config } = require('../config/environment');

          const RAZORPAY_KEY_ID = config.razorpayKeyId;
          const RAZORPAY_KEY_SECRET = config.razorpayKeySecret;

          if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
            const razorpay = new Razorpay({
              key_id: RAZORPAY_KEY_ID,
              key_secret: RAZORPAY_KEY_SECRET,
            });

            // Initiate refund (amount in paise)
            const refundAmount = Math.round(Number(booking.base_fare) * 100);
            const refund = await razorpay.payments.refund(paymentId, {
              amount: refundAmount,
              notes: {
                bookingId: booking.id,
                bookingNumber: booking.booking_number,
                reason: 'Booking cancellation',
              },
            });

            // Update booking with refund information
            await prisma.booking.update({
              where: { id: booking.id },
              data: {
                paymentStatus: paymentStatus || 'refunded',
                utr_number: `${paymentId}_refund_${refund.id}`,
              },
            });

            await prisma.admin.update({
            where: { id: config.adminId },
            data: {
              wallet_balance: { decrement: booking.base_fare },
            },
          });

          await prisma.adminWalletTransaction.create({
            data: {
              adminId: config.adminId,
              amount: booking.base_fare,
              type: 'debit',
              transaction_type: 'refund_adjustment',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
              driverId: driverId,
              customerId: booking.customerId,
            }
          });

          await prisma.walletTransaction.create({
            data: {
              customerId: booking.customerId,
              amount: Number(booking.base_fare),
              type: 'credit',
              transaction_type: 'refund',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
            },
          });

          await prisma.driverWalletTransaction.create({
            data: {
              driverId: driverId,
              amount: booking.base_fare,
              type: 'debit',
              transaction_type: 'refund_adjustment',
              description: `Refund for cancelled booking ${booking.booking_number}`,
              bookingId: booking.id,
            }
          });

            refundInitiated = true;
            refundMethod = 'razorpay';
            console.log(`[Refund] Razorpay refund initiated for booking ${booking.booking_number}: ${refund.id}`);
          }
        } catch (refundError: any) {
          console.error('[Refund] Error initiating Razorpay refund:', refundError);
          // Don't fail the cancellation if refund fails - it can be processed manually
          // Update status to indicate refund needs manual processing
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'refund_pending',
            },
          });
          refundMethod = 'razorpay_failed';
        }
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      bookingId: booking.id,
      refunded: refundInitiated,
      refundMethod: refundMethod,
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel booking' });
  }
});

// Update User Profile (by admins)
router.put('/profile-update/:id', async (req, res) => {
  try {
    const userId = req.params.id
    const userRole = req.user!.role;
    console.log(req.body)

    const { firstName, lastName, email, gender, mobile } = req.body;

    let formattedMobile = mobile.trim();

    console.log('Formatted Mobile before:', formattedMobile);

    // Remove +91 if already present
    if (formattedMobile.startsWith('+91')) {
      formattedMobile = formattedMobile.slice(3);
    }

    // Remove non-digits
    const cleanMobile = formattedMobile.replace(/\D/g, '');

    // Take FIRST 10 digits only
    formattedMobile = `+91${cleanMobile.slice(0, 10)}`;

    console.log('Formatted Mobile after:', formattedMobile);


    // For admins, update directly
    if (userRole === 'admin') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          first_name: firstName || user.first_name,
          last_name: lastName || user.last_name,
          email: email !== undefined ? email : user.email,
          gender: gender !== undefined && gender !== '' ? gender : user.gender,
          mobile: formattedMobile || user.mobile,
        },
      });

      return res.json({ message: 'Profile updated successfully', user: updatedUser });
    }

    return res.status(403).json({ error: 'Unauthorized to update profile' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

router.get('/driver-profile/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const driver = await prisma.driver.findUnique({
      where: { userId: id },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get profile' });
  }
});

// Update Driver Profile
router.put('/update-driver-profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { bank_name, bank_ifsc_code, bank_account_number } = req.body;

    console.log('Update Driver Profile Body:', req.body);

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update driver details
    const updatedDriver = await prisma.driver.update({
      where: { userId },
      data: {
        bank_name: bank_name !== undefined ? bank_name : driver.bank_name,
        bank_ifsc_code: bank_ifsc_code !== undefined ? bank_ifsc_code : driver.bank_ifsc_code,
        bank_account_number: bank_account_number !== undefined ? bank_account_number : driver.bank_account_number,
      },
    });

    res.json({ message: 'Profile updated successfully', driver: updatedDriver });
  } catch (error: any) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});


// ========== SERVICE STATES ENDPOINTS ==========

// Get all service states
router.get('/service-states', async (req, res) => {
  try {
    const states = await prisma.serviceState.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ states });
  } catch (error: any) {
    console.error('Error fetching service states:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch service states' });
  }
});

// Get single service state
router.get('/service-states/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const state = await prisma.serviceState.findUnique({
      where: { id },
    });

    if (!state) {
      return res.status(404).json({ error: 'Service state not found' });
    }

    res.json({ state });
  } catch (error: any) {
    console.error('Error fetching service state:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch service state' });
  }
});

// Create service state
router.post('/service-states', async (req, res) => {
  try {
    const { name, is_active } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check for duplicate name
    const nameLower = name.trim().toLowerCase();

    const existing = await prisma.serviceState.findFirst({
      where: {
        name: { startsWith: nameLower },
      },
    });

    if (existing && existing.name.toLowerCase() === nameLower) {
      return res.status(409).json({ error: 'State name already exists' });
    }

    const state = await prisma.serviceState.create({
      data: {
        name: name.trim(),
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    // Clear cache
    await cacheService.delete(cacheKeys.activeStates());
    await cacheService.delete(cacheKeys.allStates());

    res.status(201).json({ state, message: 'Service state created successfully' });
  } catch (error: any) {
    console.error('Error creating service state:', error);
    res.status(500).json({ error: error.message || 'Failed to create service state' });
  }
});

// Update service state
router.put('/service-states/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const state = await prisma.serviceState.findUnique({ where: { id } });
    if (!state) {
      return res.status(404).json({ error: 'Service state not found' });
    }

    // Check for duplicate name (excluding current state)
    if (name) {
      const nameLower = name.trim().toLowerCase();

      const existing = await prisma.serviceState.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { name: { startsWith: nameLower } },
          ],
        },
      });

      if (existing && existing.name.toLowerCase() === nameLower) {
        return res.status(409).json({ error: 'State name already exists' });
      }
    }

    const updatedState = await prisma.serviceState.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    // Clear cache
    await cacheService.delete(cacheKeys.activeStates());
    await cacheService.delete(cacheKeys.allStates());

    res.json({ state: updatedState, message: 'Service state updated successfully' });
  } catch (error: any) {
    console.error('Error updating service state:', error);
    res.status(500).json({ error: error.message || 'Failed to update service state' });
  }
});

// Delete service state
router.delete('/service-states/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const state = await prisma.serviceState.findUnique({ where: { id } });
    if (!state) {
      return res.status(404).json({ error: 'Service state not found' });
    }

    await prisma.serviceState.delete({ where: { id } });

    // Clear cache
    await cacheService.delete(cacheKeys.activeStates());
    await cacheService.delete(cacheKeys.allStates());

    res.json({ message: 'Service state deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service state:', error);
    res.status(500).json({ error: error.message || 'Failed to delete service state' });
  }
});

// Bulk toggle service states
router.post('/service-states/bulk/toggle', async (req, res) => {
  try {
    const { stateIds, is_active } = req.body;

    if (!Array.isArray(stateIds) || stateIds.length === 0) {
      return res.status(400).json({ error: 'stateIds must be a non-empty array' });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    const result = await prisma.serviceState.updateMany({
      where: { id: { in: stateIds } },
      data: { is_active },
    });

    // Clear cache
    await cacheService.delete(cacheKeys.activeStates());
    await cacheService.delete(cacheKeys.allStates());

    res.json({
      count: result.count,
      message: `${result.count} service state(s) updated successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling service states:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle service states' });
  }
});

// ============================================================================
// Service State Management Routes
// ============================================================================

// Get all service states (Active & Inactive)
router.get('/service-states', async (req, res) => {
  try {
    const { active } = req.query;

    // Using the public service for fetching as it has the logic
    const states = await prisma.serviceState.findMany({
      where: active !== undefined ? { is_active: active === 'true' } : {},
      orderBy: { name: 'asc' },
    });

    res.json({ states });
  } catch (error: any) {
    console.error('Admin get states error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch service states' });
  }
});

// Get single service state
router.get('/service-states/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const state = await prisma.serviceState.findUnique({
      where: { id },
    });

    if (!state) {
      return res.status(404).json({ error: 'Service state not found' });
    }

    res.json({ state });
  } catch (error: any) {
    console.error('Admin get state error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch service state' });
  }
});

// Create new service state
router.post('/service-states', async (req, res) => {
  try {
    const { name, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'State name is required' });
    }

    // Check availability
    const existing = await prisma.serviceState.findFirst({
      where: { name: name.trim() },
    });

    if (existing) {
      return res.status(400).json({ error: 'State with this name already exists' });
    }

    const state = await prisma.serviceState.create({
      data: {
        name: name.trim(),
        is_active: is_active ?? true,
      },
    });

    // Clear cache to reflect changes immediately
    const { stateValidationService } = await import('../services/stateValidationService');
    await stateValidationService.clearCache();

    res.status(201).json({ state, message: 'Service state created successfully' });
  } catch (error: any) {
    console.error('Admin create state error:', error);
    res.status(500).json({ error: error.message || 'Failed to create service state' });
  }
});

// Update service state
router.put('/service-states/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const existing = await prisma.serviceState.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service state not found' });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (is_active !== undefined) updateData.is_active = is_active;

    const state = await prisma.serviceState.update({
      where: { id },
      data: updateData,
    });

    // Clear cache
    const { stateValidationService } = await import('../services/stateValidationService');
    await stateValidationService.clearCache();

    res.json({ state, message: 'Service state updated successfully' });
  } catch (error: any) {
    console.error('Admin update state error:', error);
    res.status(500).json({ error: error.message || 'Failed to update service state' });
  }
});

// Delete service state
router.delete('/service-states/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.serviceState.delete({
      where: { id },
    });

    // Clear cache
    const { stateValidationService } = await import('../services/stateValidationService');
    await stateValidationService.clearCache();

    res.json({ message: 'Service state deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete state error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete service state' });
  }
});

// Bulk toggle states
router.post('/service-states/bulk/toggle', async (req, res) => {
  try {
    const { stateIds, is_active } = req.body;

    if (!Array.isArray(stateIds) || stateIds.length === 0) {
      return res.status(400).json({ error: 'stateIds array is required' });
    }

    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active status is required' });
    }

    const result = await prisma.serviceState.updateMany({
      where: {
        id: { in: stateIds },
      },
      data: {
        is_active,
      },
    });

    // Clear cache
    const { stateValidationService } = await import('../services/stateValidationService');
    await stateValidationService.clearCache();

    res.json({
      count: result.count,
      message: `${result.count} states ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Admin bulk toggle states error:', error);
    res.status(500).json({ error: error.message || 'Failed to update states' });
  }
});

export default router;


