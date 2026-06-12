/**
 * Script to add fcm_token column to users table
 * 
 * Run with: npx ts-node scripts/add-fcm-token.ts
 */

import prisma from '../src/config/database';

async function addFcmTokenColumn() {
  try {
    console.log('Checking if fcm_token column exists...');
    
    // Check if column exists by querying information_schema
    const result = await prisma.$queryRaw<Array<{COLUMN_NAME: string}>>`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'fcm_token'
    `;

    if (result.length > 0) {
      console.log('✅ fcm_token column already exists in users table');
      return;
    }

    console.log('Adding fcm_token column to users table...');
    
    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN fcm_token TEXT NULL
    `;

    console.log('✅ Successfully added fcm_token column to users table');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ fcm_token column already exists (caught duplicate field error)');
    } else {
      console.error('❌ Error adding fcm_token column:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addFcmTokenColumn()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

