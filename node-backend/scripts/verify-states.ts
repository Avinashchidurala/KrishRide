/**
 * Quick verification script to ensure service states are in the database
 */

import prisma from '../src/config/database';

async function verifyStates() {
  try {
    console.log('🔍 Verifying service states in database...\n');

    const states = await prisma.serviceState.findMany({
      select: { id: true, name: true, code: true, is_active: true },
      orderBy: { name: 'asc' },
    });

    if (states.length === 0) {
      console.log('❌ No service states found in database!');
      process.exit(1);
    }

    console.log(`✅ Found ${states.length} service states:\n`);
    console.log('┌─────────────────────┬────────────┬────────────┐');
    console.log('│ Name                │ Code       │ Active     │');
    console.log('├─────────────────────┼────────────┼────────────┤');

    states.forEach((state: any) => {
      const name = state.name.padEnd(19);
      const code = state.code.padEnd(10);
      const active = state.is_active ? 'Yes' : 'No';
      console.log(`│ ${name} │ ${code} │ ${active.padEnd(10)} │`);
    });

    console.log('└─────────────────────┴────────────┴────────────┘\n');
    console.log('✨ Database verification successful!');
  } catch (error) {
    console.error('❌ Error verifying states:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStates();
