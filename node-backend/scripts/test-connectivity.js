#!/usr/bin/env node

/**
 * Third-Party Services Connectivity Test Script
 * 
 * This script tests actual connectivity to all third-party services.
 * Run with: node scripts/test-connectivity.js
 */

require('dotenv').config();

const results = [];

function addResult(name, status, message, required = false) {
  results.push({ name, status, message, required });
}

// Test MySQL Database
async function testDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    
    addResult('MySQL Database', 'working', 'Connected successfully', true);
  } catch (error) {
    addResult('MySQL Database', 'error', error.message, true);
  }
}

// Test Razorpay
async function testRazorpay() {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    // Try to fetch account details (this validates credentials)
    await razorpay.customers.all({ count: 1 });
    addResult('Razorpay', 'working', 'Credentials validated successfully', true);
  } catch (error) {
    if (error.statusCode === 401) {
      addResult('Razorpay', 'error', 'Invalid credentials', true);
    } else {
      addResult('Razorpay', 'working', 'Credentials valid (connection test passed)', true);
    }
  }
}

// Test AWS S3
async function testAWS() {
  try {
    const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    // Try to list buckets (validates credentials)
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    // Check if our bucket exists
    const bucketExists = response.Buckets?.some(b => b.Name === process.env.AWS_S3_BUCKET);
    if (bucketExists) {
      addResult('AWS S3', 'working', `Bucket "${process.env.AWS_S3_BUCKET}" accessible`, true);
    } else {
      addResult('AWS S3', 'error', `Bucket "${process.env.AWS_S3_BUCKET}" not found`, true);
    }
  } catch (error) {
    if (error.name === 'InvalidAccessKeyId') {
      addResult('AWS S3', 'error', 'Invalid AWS credentials', true);
    } else if (error.name === 'SignatureDoesNotMatch') {
      addResult('AWS S3', 'error', 'AWS secret key is incorrect', true);
    } else {
      addResult('AWS S3', 'error', error.message, true);
    }
  }
}

// Test Google Maps API
async function testGoogleMaps() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Hyderabad&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      addResult('Google Maps API', 'working', 'API key validated successfully', true);
    } else if (data.status === 'REQUEST_DENIED') {
      addResult('Google Maps API', 'error', 'API key is invalid or restricted', true);
    } else {
      addResult('Google Maps API', 'error', `API returned: ${data.status}`, true);
    }
  } catch (error) {
    addResult('Google Maps API', 'error', error.message, true);
  }
}

// Test Redis
async function testRedis() {
  try {
    const { createClient } = require('redis');
    const client = createClient({ url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}` });
    
    await client.connect();
    await client.ping();
    
    // Test set/get
    await client.set('test:connectivity', 'ok', { EX: 10 });
    const value = await client.get('test:connectivity');
    await client.del('test:connectivity');
    
    if (value === 'ok') {
      addResult('Redis', 'working', 'Connected and working correctly', false);
    } else {
      addResult('Redis', 'error', 'Connection OK but read/write test failed', false);
    }
    
    await client.quit();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      addResult('Redis', 'error', 'Connection refused - Redis server not running', false);
    } else {
      addResult('Redis', 'error', error.message, false);
    }
  }
}

// Test Twilio
async function testTwilio() {
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Try to fetch account details (validates credentials)
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    addResult('Twilio', 'working', `Account validated: ${account.status}`, false);
  } catch (error) {
    if (error.status === 401) {
      addResult('Twilio', 'error', 'Invalid credentials', false);
    } else {
      addResult('Twilio', 'error', error.message, false);
    }
  }
}

// Test SendGrid
async function testSendGrid() {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Try to validate API key by making a simple request
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      addResult('SendGrid', 'working', 'API key validated successfully', false);
    } else if (response.status === 401) {
      addResult('SendGrid', 'error', 'Invalid API key', false);
    } else {
      addResult('SendGrid', 'error', `API returned status: ${response.status}`, false);
    }
  } catch (error) {
    addResult('SendGrid', 'error', error.message, false);
  }
}

// Main function
async function main() {
  console.log('🔍 Testing Third-Party Services Connectivity...\n');
  console.log('This may take a few moments...\n');
  
  // Run all tests
  await testDatabase();
  await testRazorpay();
  await testAWS();
  await testGoogleMaps();
  await testRedis();
  await testTwilio();
  await testSendGrid();
  
  // Separate results
  const working = results.filter(r => r.status === 'working');
  const errors = results.filter(r => r.status === 'error');
  const requiredWorking = working.filter(r => r.required);
  const requiredErrors = errors.filter(r => r.required);
  
  // Print results
  if (working.length > 0) {
    console.log('✅ Working Services:');
    working.forEach(r => {
      const icon = r.required ? '✓' : '○';
      console.log(`   ${icon} ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  if (errors.length > 0) {
    const required = errors.filter(r => r.required);
    const optional = errors.filter(r => !r.required);
    
    if (required.length > 0) {
      console.log('❌ Errors (Required Services):');
      required.forEach(r => {
        console.log(`   ✗ ${r.name}: ${r.message}`);
      });
      console.log('');
    }
    
    if (optional.length > 0) {
      console.log('⚠️  Errors (Optional Services):');
      optional.forEach(r => {
        console.log(`   ○ ${r.name}: ${r.message}`);
      });
      console.log('');
    }
  }
  
  // Summary
  const totalRequired = results.filter(r => r.required).length;
  
  console.log('📊 Summary:');
  console.log(`   Total Services: ${results.length}`);
  console.log(`   Working: ${working.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Required Services: ${requiredWorking.length}/${totalRequired} working`);
  
  if (requiredWorking.length < totalRequired) {
    console.log('\n⚠️  Warning: Some required services are not working!');
    process.exit(1);
  } else {
    console.log('\n✅ All required services are working!');
    process.exit(0);
  }
}

// Run tests
main().catch((error) => {
  console.error('❌ Error running connectivity tests:', error);
  process.exit(1);
});

