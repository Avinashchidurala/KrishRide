import axios from 'axios';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function testSOSFunctionality() {
  try {
    console.log('🔐 Step 1: Logging in as customer...');
    
    // Step 1: Login as customer (using OTP 123456)
    const customerMobile = '9999999999'; // Test customer mobile
    
    // Request OTP
    await axios.post(`${BASE_URL}/api/auth/login`, {
      mobile: customerMobile,
    });
    
    console.log('📱 OTP sent (using hardcoded 123456)...');
    
    // Verify OTP and get token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login/verify`, {
      mobile: customerMobile,
      otp: '123456',
    });
    
    const accessToken = loginResponse.data.data?.accessToken || loginResponse.data.accessToken || loginResponse.data.token;
    
    if (!accessToken) {
      console.error('❌ Failed to get access token');
      console.log('Response:', loginResponse.data);
      return;
    }
    
    console.log('✅ Customer login successful!');
    console.log('🚨 Step 2: Testing SOS endpoint...');
    
    // Step 2: Test SOS endpoint
    const sosResponse = await axios.post(
      `${BASE_URL}/api/sos`,
      {
        latitude: 12.9716,
        longitude: 77.5946,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ SOS alert created successfully!');
    console.log('\n📋 SOS Alert Details:');
    console.log(JSON.stringify(sosResponse.data, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.status === 401) {
      console.error('\n💡 Tip: Authentication failed. Make sure the user exists and OTP is correct.');
    }
  }
}

testSOSFunctionality();

