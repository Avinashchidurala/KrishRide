#!/usr/bin/env node

/**
 * Test Twilio Credentials
 * Verifies if Twilio Account SID and Auth Token are valid
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('🔍 Testing Twilio Credentials...\n');

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials in .env file');
  console.log('   Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   Account SID: ${accountSid.substring(0, 10)}...${accountSid.substring(accountSid.length - 4)}`);
console.log(`   Auth Token: ${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 4)}`);
console.log(`   Phone Number: ${phoneNumber || 'Not set'}`);
console.log('');

try {
  const client = twilio(accountSid, authToken);
  
  console.log('🔐 Testing authentication...');
  
  // Try to fetch account details (this will fail if credentials are invalid)
  client.api.accounts(accountSid)
    .fetch()
    .then(account => {
      console.log('✅ Twilio credentials are VALID!');
      console.log('');
      console.log('📊 Account Details:');
      console.log(`   Account Name: ${account.friendlyName || 'N/A'}`);
      console.log(`   Status: ${account.status || 'N/A'}`);
      console.log(`   Type: ${account.type || 'N/A'}`);
      console.log('');
      
      // Test phone number if provided
      if (phoneNumber) {
        console.log('📱 Testing phone number...');
        return client.incomingPhoneNumbers.list({ phoneNumber });
      }
      return Promise.resolve([]);
    })
    .then(phoneNumbers => {
      if (phoneNumbers && phoneNumbers.length > 0) {
        console.log('✅ Phone number is valid and active!');
        console.log(`   Phone Number: ${phoneNumbers[0].phoneNumber}`);
        console.log(`   Status: ${phoneNumbers[0].status || 'N/A'}`);
      } else if (phoneNumber) {
        console.log('⚠️  Phone number not found in your Twilio account');
        console.log(`   Configured: ${phoneNumber}`);
        console.log('   Note: This might be a trial account number or the number might not be active');
      }
      console.log('');
      console.log('✅ All tests passed! Twilio is configured correctly.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Twilio Authentication Failed!');
      console.error('');
      console.error('Error Details:');
      console.error(`   Status: ${error.status || 'N/A'}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error(`   Message: ${error.message || 'N/A'}`);
      console.error('');
      
      if (error.code === 20003) {
        console.error('🔴 Error Code 20003: Authentication Failed');
        console.error('');
        console.error('Possible causes:');
        console.error('   1. Invalid Account SID');
        console.error('   2. Invalid Auth Token');
        console.error('   3. Account suspended or inactive');
        console.error('   4. Credentials don\'t match');
        console.error('');
        console.error('How to fix:');
        console.error('   1. Go to https://console.twilio.com/');
        console.error('   2. Check your Account SID and Auth Token on the dashboard');
        console.error('   3. Make sure they match exactly in your .env file');
        console.error('   4. Ensure your account is active (not suspended)');
      } else if (error.status === 401) {
        console.error('🔴 HTTP 401: Unauthorized');
        console.error('   Your credentials are being rejected by Twilio');
        console.error('   Please verify your Account SID and Auth Token');
      }
      
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Failed to initialize Twilio client:', error.message);
  process.exit(1);
}

