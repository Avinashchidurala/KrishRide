/**
 * Script to delete all rides and bookings from the database
 * 
 * Note: Bookings are deleted first due to foreign key constraints
 * 
 * Run with: npx tsx scripts/delete-all-rides-bookings.ts
 */

import prisma from '../src/config/database';

async function deleteAllRidesAndBookings() {
  try {
    console.log('🔄 Starting deletion of all rides and bookings...');

    // First, count bookings and rides
    const bookingCount = await prisma.booking.count();
    const rideCount = await prisma.ride.count();

    console.log(`📊 Found ${bookingCount} booking(s) and ${rideCount} ride(s)`);

    if (bookingCount === 0 && rideCount === 0) {
      console.log('✅ No rides or bookings found');
      return;
    }

    // Delete bookings first (due to foreign key constraints)
    if (bookingCount > 0) {
      console.log(`🗑️  Deleting ${bookingCount} booking(s)...`);
      const bookingResult = await prisma.booking.deleteMany({});
      console.log(`✅ Successfully deleted ${bookingResult.count} booking(s)`);
    }

    // Then delete rides
    if (rideCount > 0) {
      console.log(`🗑️  Deleting ${rideCount} ride(s)...`);
      const rideResult = await prisma.ride.deleteMany({});
      console.log(`✅ Successfully deleted ${rideResult.count} ride(s)`);
    }

    console.log('✨ Deletion completed!');

    // Verify deletion
    const remainingBookings = await prisma.booking.count();
    const remainingRides = await prisma.ride.count();

    if (remainingBookings === 0 && remainingRides === 0) {
      console.log('✅ Verification passed: All rides and bookings deleted');
    } else {
      console.warn(`⚠️  Warning: ${remainingBookings} booking(s) and ${remainingRides} ride(s) still remain`);
    }

  } catch (error: any) {
    console.error('❌ Error deleting rides and bookings:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllRidesAndBookings()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

