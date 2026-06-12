/**
 * Script to fix NULL created_at values in users table
 * 
 * Run with: npx ts-node scripts/fix-users-created-at.ts
 */

import prisma from '../src/config/database';

async function fixUsersCreatedAt() {
  try {
    console.log('Checking for NULL created_at values in users table...');
    
    // Check for NULL values
    const nullCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at IS NULL
    `;

    const count = Number(nullCount[0].count);
    
    if (count === 0) {
      console.log('✅ No NULL created_at values found');
      return;
    }

    console.log(`Found ${count} users with NULL created_at. Fixing...`);
    
    // Update NULL values to current timestamp
    // This is safe because created_at should represent when the record was created
    // Since we don't have the original creation time, we use current timestamp
    await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET created_at = COALESCE(updated_at, NOW())
      WHERE created_at IS NULL
    `);

    console.log(`✅ Successfully updated ${count} user records`);
    
    // Verify fix
    const remainingNull = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at IS NULL
    `;
    
    if (Number(remainingNull[0].count) === 0) {
      console.log('✅ Verification passed: No NULL created_at values remain');
    } else {
      console.warn(`⚠️  Warning: ${remainingNull[0].count} NULL values still remain`);
    }
  } catch (error: any) {
    console.error('❌ Error fixing created_at values:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUsersCreatedAt()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

