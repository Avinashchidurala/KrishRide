import prisma from '../src/config/database';

/**
 * Script to create an admin user in the database
 * Usage: npx tsx scripts/create-admin.ts <phone_number> [first_name] [last_name] [email]
 * Example: npx tsx scripts/create-admin.ts 9885221843 "Admin" "User" "admin@hushryd.com"
 */

async function createAdmin() {
  try {
    // Get phone number from command line arguments
    const phoneNumber = process.argv[2];
    const firstName = process.argv[3] || 'Admin';
    const lastName = process.argv[4] || 'User';
    const email = process.argv[5] || null;

    if (!phoneNumber) {
      console.error('Error: Phone number is required');
      console.log('Usage: npx tsx scripts/create-admin.ts <phone_number> [first_name] [last_name] [email]');
      process.exit(1);
    }

    // Format mobile number consistently (remove non-digits, add +91 prefix)
    const cleanMobile = phoneNumber.replace(/\D/g, '');
    const formattedMobile = `+91${cleanMobile}`;

    console.log(`Creating admin user with phone number: ${formattedMobile}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: formattedMobile },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        mobile: true,
        role: true,
        email: true,
      },
    });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('Admin user already exists with this phone number!');
        console.log(`User ID: ${existingUser.id}`);
        console.log(`Name: ${existingUser.first_name} ${existingUser.last_name}`);
        
        // Check if admin record exists
        const adminRecord = await prisma.admin.findUnique({
          where: { userId: existingUser.id },
        });
        if (adminRecord) {
          console.log(`Admin ID: ${adminRecord.id}`);
        }
        await prisma.$disconnect();
        process.exit(0);
      } else {
        // User exists but is not an admin - convert them to admin
        console.log(`User with phone number ${formattedMobile} exists with role: ${existingUser.role}`);
        console.log('Converting user to admin role...');
        
        // Update user to admin role
        const user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'admin',
            first_name: firstName,
            last_name: lastName,
            email: email || existingUser.email,
            is_active: true,
            profile_completed: true,
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
            role: true,
          },
        });

        console.log(`✓ User updated to admin role with ID: ${user.id}`);

        // Check if admin record already exists
        const existingAdmin = await prisma.admin.findUnique({
          where: { userId: user.id },
        });

        if (existingAdmin) {
          console.log(`✓ Admin record already exists with ID: ${existingAdmin.id}`);
          console.log('\n✅ Admin user updated successfully!');
          console.log(`\nUser Details:`);
          console.log(`  Phone: ${user.mobile}`);
          console.log(`  Name: ${user.first_name} ${user.last_name}`);
          console.log(`  Email: ${user.email || 'Not provided'}`);
          console.log(`  User ID: ${user.id}`);
          console.log(`  Admin ID: ${existingAdmin.id}`);
          await prisma.$disconnect();
          process.exit(0);
        }

        // Create admin record for existing user
        const admin = await prisma.admin.create({
          data: {
            userId: user.id,
            permissions: {
              // Default admin permissions - can be customized
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

        console.log(`✓ Admin record created with ID: ${admin.id}`);
        console.log('\n✅ Admin user created successfully!');
        console.log(`\nUser Details:`);
        console.log(`  Phone: ${user.mobile}`);
        console.log(`  Name: ${user.first_name} ${user.last_name}`);
        console.log(`  Email: ${user.email || 'Not provided'}`);
        console.log(`  User ID: ${user.id}`);
        console.log(`  Admin ID: ${admin.id}`);
        console.log(`\nNote: The admin can now login using OTP authentication with phone number: ${formattedMobile}`);
        await prisma.$disconnect();
        process.exit(0);
      }
    }

    // Create new user with admin role
    const user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        mobile: formattedMobile,
        email: email,
        age: 25, // Default age
        role: 'admin',
        is_phone_verified: true,
        is_active: true,
        profile_completed: true,
        auth_provider: 'otp',
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        mobile: true,
        email: true,
        role: true,
      },
    });

    console.log(`✓ User created with ID: ${user.id}`);

    // Create admin record
    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
        permissions: {
          // Default admin permissions - can be customized
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

    console.log(`✓ Admin record created with ID: ${admin.id}`);
    console.log('\n✅ Admin user created successfully!');
    console.log(`\nUser Details:`);
    console.log(`  Phone: ${user.mobile}`);
    console.log(`  Name: ${user.first_name} ${user.last_name}`);
    console.log(`  Email: ${user.email || 'Not provided'}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Admin ID: ${admin.id}`);
    console.log(`\nNote: The admin can now login using OTP authentication with phone number: ${formattedMobile}`);

  } catch (error: any) {
    console.error('Error creating admin:', error.message);
    if (error.code === 'P2002') {
      console.error('A user with this phone number or email already exists.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin();

