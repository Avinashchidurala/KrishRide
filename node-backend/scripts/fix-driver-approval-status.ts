import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix existing approved drivers to have is_driver_approved = true
 * This script updates all drivers with kyc_status = 'approved' to also have is_driver_approved = true
 */
async function fixDriverApprovalStatus() {
  try {
    console.log('🔄 Starting driver approval status fix...');

    // Find all drivers with approved KYC but is_driver_approved is false or null
    const driversToFix = await prisma.driver.findMany({
      where: {
        kyc_status: 'approved',
        OR: [
          { is_driver_approved: false },
          { is_driver_approved: null },
        ],
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            mobile: true,
          },
        },
      },
    });

    console.log(`📊 Found ${driversToFix.length} drivers with approved KYC but not marked as approved`);

    if (driversToFix.length === 0) {
      console.log('✅ No drivers need to be fixed!');
      return;
    }

    // Update each driver
    let successCount = 0;
    let errorCount = 0;

    for (const driver of driversToFix) {
      try {
        await prisma.driver.update({
          where: { id: driver.id },
          data: {
            is_driver_approved: true,
          },
        });
        
        console.log(
          `✅ Fixed driver: ${driver.user.first_name} ${driver.user.last_name} (${driver.user.mobile})`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error fixing driver ${driver.id}:`,
          error instanceof Error ? error.message : error
        );
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} drivers`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} drivers`);
    }
    console.log('\n✨ Driver approval status fix completed!');

  } catch (error) {
    console.error('❌ Error during driver approval status fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixDriverApprovalStatus()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

