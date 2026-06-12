/**
 * Seed Script: Service States
 * 
 * Populates the service_states table with initial data.
 * Safe for production - only inserts if states don't already exist.
 * 
 * Usage: npx ts-node scripts/seed-service-states.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StateData {
  id: string;
  name: string;
}
const DEFAULT_STATES = [
{
  id: 'state-ap-001',
    name: 'Andhra Pradesh',
  },
{
  id: 'state-tg-001',
    name: 'Telangana',
  },
{
  id: 'state-ka-001',
    name: 'Karnataka',
  },
{
  id: 'state-tn-001',
    name: 'Tamil Nadu',
  },
{
  id: 'state-pb-001',
    name: 'Punjab',
  },
];

async function seedStates() {
  console.log('🌱 Starting service states seeding...');

  try {
    // Check existing states
    const existingCount = await prisma.serviceState.count();
    console.log(`📊 Found ${existingCount} existing states in database`);

    if (existingCount > 0) {
      console.log('✅ States already exist. Skipping insertion.');

      // Show existing states
      const existingStates = await prisma.serviceState.findMany({
        select: { id: true, name: true, is_active: true },
      });
      console.log('\n📋 Existing States:');
      existingStates.forEach(state => {
        console.log(`  - ${state.name} [${state.is_active ? 'Active' : 'Inactive'}]`);
      });

      return;
    }

    // Insert default states
    console.log('\n📝 Inserting default states...');
    let insertedCount = 0;

    for (const state of DEFAULT_STATES) {
      try {
        const created = await prisma.serviceState.create({
          data: {
            id: state.id,
            name: state.name,
            is_active: true,
          },
        });
        console.log(`  ✓ Created: ${created.name}`);
        insertedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation - state already exists
          console.log(`  ⚠ Skipped: ${state.name} - Already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ Seeding completed successfully! ${insertedCount} states inserted.`);

    // Show final state
    const finalStates = await prisma.serviceState.findMany({
      select: { id: true, name: true, is_active: true },
      orderBy: { name: 'asc' },
    });
    console.log('\n📋 Final Service States:');
    finalStates.forEach(state => {
      console.log(`  - ${state.name} [${state.is_active ? 'Active' : 'Inactive'}]`);
    });
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedStates().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
