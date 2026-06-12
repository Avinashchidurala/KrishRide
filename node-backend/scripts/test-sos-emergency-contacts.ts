/**
 * Test Script: SOS Emergency Contacts SMS
 * 
 * This script tests the SOS feature's ability to send SMS to multiple emergency contacts.
 * It simulates what happens when a user triggers an SOS alert.
 * 
 * Usage:
 *   npx ts-node scripts/test-sos-emergency-contacts.ts
 * 
 * What it does:
 *   1. Verifies Twilio configuration
 *   2. Tests SMS sending to multiple phone numbers
 *   3. Simulates Promise.allSettled behavior
 *   4. Shows detailed logs for each SMS attempt
 *   5. Provides debugging information
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { sendSMS } from '../src/utils/smsService';
import { config } from '../src/config/environment';

// Mock emergency contacts for testing
interface TestContact {
  name: string;
  mobile: string;
  description: string;
}

const testContacts: TestContact[] = [
  {
    name: 'Mother',
    mobile: '+919999999999',
    description: 'Valid format with country code',
  },
  {
    name: 'Father',
    mobile: '9888888888',
    description: 'Valid format without country code (10 digits)',
  },
  {
    name: 'Sister',
    mobile: '+919777777777',
    description: 'Another valid format with country code',
  },
  {
    name: 'Brother',
    mobile: '9666666666',
    description: 'Another valid format without country code',
  },
  {
    name: 'Invalid Contact',
    mobile: '123',
    description: 'Invalid: too short',
  },
];

async function testSOSEmergencyContacts() {
  console.log('\n' + '='.repeat(70));
  console.log('🚨 SOS EMERGENCY CONTACTS SMS TEST');
  console.log('='.repeat(70));

  // Check configuration
  console.log('\n📋 Configuration Status:');
  console.log(`   Twilio Account SID: ${config.twilioAccountSid ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Twilio Auth Token: ${config.twilioAuthToken ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Twilio Phone Number: ${config.twilioPhoneNumber ? '✅ ' + config.twilioPhoneNumber : '❌ Missing'}`);

  if (!config.twilioPhoneNumber) {
    console.error('\n❌ ERROR: Twilio not properly configured');
    console.error('   Please set TWILIO_PHONE_NUMBER in your .env file');
    process.exit(1);
  }

  // Show test setup
  console.log(`\n👥 Emergency Contacts Test Setup:`);
  console.log(`   Total test contacts: ${testContacts.length}`);
  console.log(`   Test message will be sent to each contact`);
  testContacts.forEach((contact, index) => {
    console.log(`   ${index + 1}. ${contact.name} (${contact.mobile}) - ${contact.description}`);
  });

  // Simulate SOS alert
  const smsMessage = `🚨 SOS ALERT: John Doe needs help. Location: https://maps.google.com?q=40.7128,-74.0060`;
  
  console.log(`\n📤 Sending SOS Alert Messages:`);
  console.log(`   Message: "${smsMessage.substring(0, 50)}..."`);
  console.log(`   Length: ${smsMessage.length} characters\n`);

  // Send SMS to all emergency contacts in parallel (like the new SOS implementation)
  const smsPromises = testContacts.map(async (contact) => {
    try {
      console.log(`   ⏳ Sending to ${contact.name} (${contact.mobile})...`);
      const result = await sendSMS(contact.mobile, smsMessage);
      
      if (result.success) {
        console.log(`   ✅ ${contact.name}: SMS sent successfully`);
      } else {
        console.log(`   ❌ ${contact.name}: Failed - ${result.message}`);
      }
      
      return {
        contactName: contact.name,
        phoneNumber: contact.mobile,
        success: result.success,
        message: result.message,
      };
    } catch (error: any) {
      console.error(`   ⚠️  ${contact.name}: Error - ${error.message}`);
      return {
        contactName: contact.name,
        phoneNumber: contact.mobile,
        success: false,
        message: error.message,
      };
    }
  });

  // Wait for all SMS to complete (using Promise.allSettled like in the SOS route)
  console.log(`\n⏳ Processing all SMS in parallel...`);
  const smsResults = await Promise.allSettled(smsPromises);

  // Analyze results
  console.log(`\n📊 Results Summary:`);
  console.log('='.repeat(70));

  let successCount = 0;
  let failureCount = 0;
  const resultDetails: any[] = [];

  smsResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      resultDetails.push(value);
      if (value.success) {
        successCount++;
        console.log(`✅ ${value.contactName.padEnd(15)} | ${value.phoneNumber.padEnd(15)} | ${value.message}`);
      } else {
        failureCount++;
        console.log(`❌ ${value.contactName.padEnd(15)} | ${value.phoneNumber.padEnd(15)} | ${value.message}`);
      }
    } else if (result.status === 'rejected') {
      failureCount++;
      console.log(`❌ Promise rejected for contact ${index}`);
    }
  });

  console.log('='.repeat(70));
  console.log(`\n📈 Statistics:`);
  console.log(`   Total contacts: ${testContacts.length}`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   Success rate: ${((successCount / testContacts.length) * 100).toFixed(1)}%`);

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  console.log(`   1. Emergency contact phone numbers should be stored as:`);
  console.log(`      - 10-digit format: 9876543210`);
  console.log(`      - With country code: +919876543210`);
  console.log(`   2. Twilio will automatically handle the formatting`);
  console.log(`   3. Check Twilio dashboard for delivery status`);
  console.log(`   4. One failed SMS won't block others (using Promise.allSettled)`);
  console.log(`   5. All attempts are logged with [SOS-SMS] prefix\n`);

  // Testing instructions
  console.log(`🧪 To test with real emergency contacts:`);
  console.log(`   1. Get user ID from your database`);
  console.log(`   2. Trigger SOS through the app`);
  console.log(`   3. Watch backend logs for [SOS-SMS] entries`);
  console.log(`   4. Check Twilio console for delivery status\n`);

  console.log('='.repeat(70) + '\n');
}

// Run the test
testSOSEmergencyContacts().catch(console.error);
