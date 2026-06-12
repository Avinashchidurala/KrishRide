#!/usr/bin/env node

/**
 * Delete User Script
 * Safely deletes a user by phone number
 * 
 * Usage: node scripts/delete-user.js <phone_number>
 * Example: node scripts/delete-user.js 9494255698
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser(phoneNumber) {
  try {
    // Format phone number
    const cleanMobile = phoneNumber.replace(/\D/g, '');
    const formattedMobile = `+91${cleanMobile}`;

    console.log(`🔍 Searching for user with phone number: ${formattedMobile}...\n`);

    // Find user with all related data
    const user = await prisma.user.findUnique({
      where: { mobile: formattedMobile },
      include: {
        customer: {
          include: {
            bookings: true,
            walletTransactions: true,
            subscriptions: true,
            referrals: true,
            referredBy: true,
            savedAddresses: true,
          },
        },
        driver: {
          include: {
            rides: {
              include: {
                bookings: true,
              },
            },
            vehicles: true,
            driverVerifications: true,
            payouts: true,
          },
        },
        admin: true,
        emergencyContacts: true,
        sosAlerts: true,
        complaints: true,
        supportTickets: true,
        savedAddresses: true,
        refreshTokens: true,
        notifications: true,
      },
    });

    if (!user) {
      console.log(`❌ User with phone number ${formattedMobile} not found.`);
      process.exit(1);
    }

    // Display user information
    console.log('📋 User Information:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Mobile: ${user.mobile}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('');

    // Display related data counts
    console.log('📊 Related Data:');
    if (user.customer) {
      console.log(`   Customer Record: Yes`);
      console.log(`   - Bookings: ${user.customer.bookings?.length || 0}`);
      console.log(`   - Wallet Transactions: ${user.customer.walletTransactions?.length || 0}`);
      console.log(`   - Saved Addresses: ${user.customer.savedAddresses?.length || 0}`);
    }
    if (user.driver) {
      console.log(`   Driver Record: Yes`);
      console.log(`   - Rides: ${user.driver.rides?.length || 0}`);
      console.log(`   - Vehicles: ${user.driver.vehicles?.length || 0}`);
      console.log(`   - KYC Status: ${user.driver.kyc_status || 'N/A'}`);
    }
    if (user.admin) {
      console.log(`   Admin Record: Yes`);
    }
    console.log(`   - Emergency Contacts: ${user.emergencyContacts?.length || 0}`);
    console.log(`   - SOS Alerts: ${user.sosAlerts?.length || 0}`);
    console.log(`   - Complaints: ${user.complaints?.length || 0}`);
    console.log(`   - Support Tickets: ${user.supportTickets?.length || 0}`);
    console.log(`   - Refresh Tokens: ${user.refreshTokens?.length || 0}`);
    console.log(`   - Notifications: ${user.notifications?.length || 0}`);
    console.log('');

    // Check for active bookings or rides
    if (user.customer) {
      const activeBookings = user.customer.bookings?.filter(
        b => ['pending', 'confirmed', 'started'].includes(b.status)
      ) || [];
      if (activeBookings.length > 0) {
        console.log(`⚠️  WARNING: User has ${activeBookings.length} active booking(s)!`);
        console.log('   Booking IDs:', activeBookings.map(b => b.id).join(', '));
        console.log('');
      }
    }

    if (user.driver) {
      const activeRides = user.driver.rides?.filter(
        r => ['active', 'started'].includes(r.status)
      ) || [];
      if (activeRides.length > 0) {
        console.log(`⚠️  WARNING: Driver has ${activeRides.length} active ride(s)!`);
        console.log('   Ride IDs:', activeRides.map(r => r.id).join(', '));
        console.log('');
      }
    }

    // Confirm deletion
    console.log('🗑️  This will delete:');
    console.log('   - User record');
    console.log('   - All related records (customer/driver/admin)');
    console.log('   - All bookings, rides, transactions, etc.');
    console.log('   - All related data (cascade delete)');
    console.log('');

    // Delete user (cascade will handle related records)
    console.log('🗑️  Deleting user...');
    
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log('✅ User deleted successfully!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Phone: ${formattedMobile}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    if (error.code === 'P2003') {
      console.error('   Foreign key constraint violation. Some related records may still exist.');
    } else if (error.code === 'P2025') {
      console.error('   User not found.');
    } else {
      console.error('   Error details:', error.message);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get phone number from command line
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('❌ Error: Phone number is required');
  console.log('');
  console.log('Usage: node scripts/delete-user.js <phone_number>');
  console.log('Example: node scripts/delete-user.js 9494255698');
  process.exit(1);
}

// Run the deletion
deleteUser(phoneNumber)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

