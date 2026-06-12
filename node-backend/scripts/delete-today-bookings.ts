/**
 * Script to delete all bookings created today
 * 
 * Run with: npx tsx scripts/delete-today-bookings.ts
 */

import prisma from '../src/config/database';

async function deleteTodayBookings() {
  try {
    // Get today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today (00:00:00)
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999); // End of today (23:59:59.999)

    console.log(`🔄 Deleting bookings created between ${today.toISOString()} and ${endOfToday.toISOString()}...`);

    // First, count how many bookings will be deleted
    const count = await prisma.booking.count({
      where: {
        createdAt: {
          gte: today,
          lte: endOfToday,
        },
      },
    });

    if (count === 0) {
      console.log('✅ No bookings found for today');
      return;
    }

    console.log(`📊 Found ${count} booking(s) to delete`);

    // Delete bookings created today
    // Note: Prisma will handle cascade deletes if configured in schema
    const result = await prisma.booking.deleteMany({
      where: {
        createdAt: {
          gte: today,
          lte: endOfToday,
        },
      },
    });

    console.log(`✅ Successfully deleted ${result.count} booking(s)`);
    console.log('✨ Deletion completed!');

  } catch (error: any) {
    console.error('❌ Error deleting bookings:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteTodayBookings()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

