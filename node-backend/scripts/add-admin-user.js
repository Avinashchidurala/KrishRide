// Script to add an admin user to the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function addAdminUser() {
  try {
    const mobile = '+919876543210'; // Format: +91 + 10 digits
    
    console.log('🔍 Checking if user already exists...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile },
      include: { admin: true },
    });
    
    if (existingUser) {
      console.log('⚠️  User already exists with mobile:', mobile);
      
      if (existingUser.role === 'admin') {
        console.log('✅ User is already an admin');
        if (existingUser.admin) {
          console.log('✅ Admin record already exists');
        } else {
          console.log('⚠️  User is admin but no Admin record found. Creating...');
          await prisma.admin.create({
            data: {
              userId: existingUser.id,
            },
          });
          console.log('✅ Admin record created');
        }
        return;
      } else {
        console.log('⚠️  User exists but is not an admin. Role:', existingUser.role);
        console.log('   Updating user to admin role...');
        
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
            },
          });
        }
        
        console.log('✅ User updated to admin role');
        return;
      }
    }
    
    console.log('📝 Creating new admin user...');
    
    // Create user
    const user = await prisma.user.create({
      data: {
        first_name: 'Admin',
        last_name: 'User',
        age: 25,
        mobile: mobile,
        email: 'admin@hushryd.com',
        role: 'admin',
        is_phone_verified: true,
        is_active: true,
        profile_completed: true,
        auth_provider: 'otp',
      },
    });
    
    console.log('✅ User created:', user.id);
    
    // Create admin record
    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
      },
    });
    
    console.log('✅ Admin record created:', admin.id);
    
    console.log('\n📊 Admin User Details:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.first_name, user.last_name);
    console.log('   Mobile:', user.mobile);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Phone Verified:', user.is_phone_verified);
    console.log('   Active:', user.is_active);
    console.log('   Admin Record ID:', admin.id);
    
    console.log('\n✅ Admin user created successfully!');
    console.log('   You can now login with mobile: 9876543210');
    console.log('   OTP: 123456 (in development mode)');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminUser();