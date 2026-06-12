/**
 * Script to populate seats_booked field for existing rides
 * This calculates seats_booked from confirmed and started bookings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateSeatsBooked() {
  try {
    console.log('Starting to populate seats_booked field...');

    // Get all rides
    const rides = await prisma.ride.findMany({
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'started'] },
          },
          select: {
            passengerCount: true,
          },
        },
      },
    });

    console.log(`Found ${rides.length} rides to update`);

    let updated = 0;
    for (const ride of rides) {
      // Calculate booked seats from confirmed/started bookings
      const bookedSeats = ride.bookings.reduce(
        (sum, booking) => sum + booking.passengerCount,
        0
      );

      // Update the ride with calculated seats_booked
      await prisma.ride.update({
        where: { id: ride.id },
        data: {
          seats_booked: bookedSeats,
        },
      });

      updated++;
      if (updated % 100 === 0) {
        console.log(`Updated ${updated}/${rides.length} rides...`);
      }
    }

    console.log(`✅ Successfully updated ${updated} rides with seats_booked field`);
  } catch (error) {
    console.error('❌ Error populating seats_booked:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateSeatsBooked()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

