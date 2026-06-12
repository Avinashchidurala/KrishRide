/**
 * Script to add missing columns to customers table
 * 
 * Run with: npx ts-node scripts/add-customer-columns.ts
 */

import prisma from '../src/config/database';

async function addCustomerColumns() {
  const columnsToAdd = [
    { name: 'drop_pin', type: 'VARCHAR(10)', default: null },
  ];

  try {
    console.log('Checking for missing columns in customers table...');
    
    for (const column of columnsToAdd) {
      // Check if column exists
      const result = await prisma.$queryRaw<Array<{COLUMN_NAME: string}>>`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'customers' 
        AND COLUMN_NAME = ${column.name}
      `;

      if (result.length > 0) {
        console.log(`✅ ${column.name} column already exists`);
        continue;
      }

      console.log(`Adding ${column.name} column...`);
      
      // Build ALTER TABLE statement
      let alterStatement = `ALTER TABLE customers ADD COLUMN ${column.name} ${column.type} NULL`;
      if (column.default && column.default !== 'null') {
        alterStatement += ` DEFAULT ${column.default}`;
      }
      
      await prisma.$executeRawUnsafe(alterStatement);
      console.log(`✅ Successfully added ${column.name} column`);
    }

    console.log('✅ All customer columns check completed');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Column already exists (caught duplicate field error)');
    } else {
      console.error('❌ Error adding columns:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addCustomerColumns()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

