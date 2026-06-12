/**
 * Script to create refresh_tokens table
 * 
 * Run with: npx ts-node scripts/add-refresh-tokens-table.ts
 */

import prisma from '../src/config/database';

async function createRefreshTokensTable() {
  try {
    console.log('Checking if refresh_tokens table exists...');
    
    // Check if table exists
    const tables = await prisma.$queryRaw<Array<{TABLE_NAME: string}>>`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'refresh_tokens'
    `;

    if (tables.length > 0) {
      console.log('✅ refresh_tokens table already exists');
      return;
    }

    console.log('Creating refresh_tokens table...');
    
    // Create the table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE refresh_tokens (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        revoked_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX refresh_tokens_user_id_index (user_id),
        INDEX refresh_tokens_token_index (token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Successfully created refresh_tokens table');
  } catch (error: any) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('✅ refresh_tokens table already exists (caught table exists error)');
    } else {
      console.error('❌ Error creating table:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createRefreshTokensTable()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

