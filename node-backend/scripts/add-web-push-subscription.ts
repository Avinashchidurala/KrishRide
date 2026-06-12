/**
 * Script to add web_push_subscription column to users table
 * Run with: npx ts-node scripts/add-web-push-subscription.ts
 */

import { PrismaClient } from '@prisma/client';
import * as mysql from 'mysql2/promise';

const prisma = new PrismaClient();

async function addWebPushSubscriptionColumn() {
  try {
    console.log('Checking if web_push_subscription column exists...');

    // Get database connection from Prisma
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
    });

    // Check if column exists
    const [rows]: any = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'web_push_subscription'
    `);

    if (rows.length > 0) {
      console.log('✅ web_push_subscription column already exists');
      await connection.end();
      return;
    }

    console.log('Creating web_push_subscription column...');

    // Add column
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN web_push_subscription TEXT NULL
      AFTER fcm_token
    `);

    console.log('✅ Successfully created web_push_subscription column');

    await connection.end();

    // Regenerate Prisma client
    console.log('Regenerating Prisma client...');
    await prisma.$disconnect();
  } catch (error: any) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ web_push_subscription column already exists (caught duplicate error)');
    } else {
      console.error('Error:', error);
      process.exit(1);
    }
  }
}

addWebPushSubscriptionColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

