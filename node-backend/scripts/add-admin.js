const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAdmin(phoneNumber) {
  // Format phone number: remove non-digits and add +91 prefix
  const cleanMobile = phoneNumber.replace(/\D/g, '');
  const formattedMobile = `+91${cleanMobile}`;

  console.log(`🔍 Checking for user with phone number: ${formattedMobile}...`);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { mobile: formattedMobile },
    include: { admin: true },
  });

  if (existingUser) {
    console.log('\n📋 User found:');
    console.log(`   ID: ${existingUser.id}`);
    console.log(`   Name: ${existingUser.first_name} ${existingUser.last_name}`);
    console.log(`   Mobile: ${existingUser.mobile}`);
    console.log(`   Email: ${existingUser.email || 'N/A'}`);
    console.log(`   Current Role: ${existingUser.role}`);

    if (existingUser.role === 'admin') {
      if (existingUser.admin) {
        console.log('\n✅ User is already an admin with an admin record.');
        return;
      } else {
        console.log('\n⚠️  User has admin role but no admin record. Creating admin record...');
        await prisma.admin.create({
          data: {
            userId: existingUser.id,
            permissions: {
              dashboard: true,
              users: true,
              rides: true,
              bookings: true,
              drivers: true,
              customers: true,
              vehicles: true,
              kyc: true,
              complaints: true,
              sos: true,
              payouts: true,
              subscriptions: true,
              analytics: true,
              settings: true,
            },
          },
        });
        console.log('✅ Admin record created successfully!');
        return;
      }
    } else {
      console.log(`\n⚠️  User exists but role is "${existingUser.role}". Updating to admin...`);
      
      // Update user role to admin
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'admin',
        },
      });

      // Create admin record if it doesn't exist
      if (!existingUser.admin) {
        await prisma.admin.create({
          data: {
            userId: existingUser.id,
            permissions: {
              dashboard: true,
              users: true,
              rides: true,
              bookings: true,
              drivers: true,
              customers: true,
              vehicles: true,
              kyc: true,
              complaints: true,
              sos: true,
              payouts: true,
              subscriptions: true,
              analytics: true,
              settings: true,
            },
          },
        });
      }

      console.log('✅ User role updated to admin and admin record created!');
      console.log(`\n📊 Updated User Details:`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.first_name} ${existingUser.last_name}`);
      console.log(`   Mobile: ${existingUser.mobile}`);
      console.log(`   Role: admin`);
      return;
    }
  }

  // User doesn't exist, create new admin user
  console.log('\n📝 User not found. Creating new admin user...');

  const user = await prisma.user.create({
    data: {
      first_name: 'Admin',
      last_name: 'User',
      mobile: formattedMobile,
      age: 25,
      role: 'admin',
      is_phone_verified: true,
      is_active: true,
      profile_completed: true,
      auth_provider: 'otp',
    },
  });

  console.log(`✅ User created with ID: ${user.id}`);

  // Create admin record
  const admin = await prisma.admin.create({
    data: {
      userId: user.id,
      permissions: {
        dashboard: true,
        users: true,
        rides: true,
        bookings: true,
        drivers: true,
        customers: true,
        vehicles: true,
        kyc: true,
        complaints: true,
        sos: true,
        payouts: true,
        subscriptions: true,
        analytics: true,
        settings: true,
      },
    },
  });

  console.log(`✅ Admin record created with ID: ${admin.id}`);
  console.log('\n✅ Admin user created successfully!');
  console.log(`\n📊 User Details:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.first_name} ${user.last_name}`);
  console.log(`   Mobile: ${user.mobile}`);
  console.log(`   Email: ${user.email || 'Not provided'}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Admin ID: ${admin.id}`);
  console.log(`\n💡 The admin can now login using OTP authentication with phone number: ${formattedMobile}`);
}

if (process.argv.length < 3) {
  console.error('Usage: node add-admin.js <phone_number>');
  console.error('Example: node add-admin.js 9392363932');
  process.exit(1);
}

const phoneNumber = process.argv[2];

addAdmin(phoneNumber)
  .catch((e) => {
    console.error('🔴 An error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Script completed successfully');
  });

