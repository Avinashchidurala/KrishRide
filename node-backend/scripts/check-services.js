#!/usr/bin/env node

/**
 * Third-Party Services Configuration Check Script
 * 
 * This script checks if all third-party services are properly configured.
 * Run with: node scripts/check-services.js
 */

require('dotenv').config();

const services = {
  'Twilio (SMS/WhatsApp)': {
    required: false,
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    check: () => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (!accountSid || !authToken || !phoneNumber) {
        return { status: 'not_configured', message: 'Missing credentials' };
      }
      
      if (!accountSid.startsWith('AC')) {
        return { status: 'error', message: 'Account SID format may be invalid (should start with AC)' };
      }
      
      return { status: 'configured', message: `Account SID: ${accountSid.substring(0, 10)}...` };
    }
  },
  
  'SendGrid (Email)': {
    required: false,
    envVars: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
    check: () => {
      const apiKey = process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.SENDGRID_FROM_EMAIL;
      
      if (!apiKey) {
        return { status: 'not_configured', message: 'Missing SENDGRID_API_KEY' };
      }
      
      if (!fromEmail) {
        return { status: 'not_configured', message: 'Missing SENDGRID_FROM_EMAIL' };
      }
      
      if (!apiKey.startsWith('SG.')) {
        return { status: 'error', message: 'API key format may be invalid (should start with SG.)' };
      }
      
      return { status: 'configured', message: `From email: ${fromEmail}` };
    }
  },
  
  'Razorpay (Payment Gateway)': {
    required: true,
    envVars: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
    check: () => {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!keyId || !keySecret) {
        return { status: 'not_configured', message: 'Missing credentials' };
      }
      
      if (!keyId.startsWith('rzp_')) {
        return { status: 'error', message: 'Key ID format may be invalid (should start with rzp_)' };
      }
      
      return { status: 'configured', message: `Key ID: ${keyId.substring(0, 15)}...` };
    }
  },
  
  'AWS S3 (File Storage)': {
    required: true,
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
    check: () => {
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.AWS_REGION;
      const bucket = process.env.AWS_S3_BUCKET;
      
      const missing = [];
      if (!accessKeyId) missing.push('AWS_ACCESS_KEY_ID');
      if (!secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY');
      if (!region) missing.push('AWS_REGION');
      if (!bucket) missing.push('AWS_S3_BUCKET');
      
      if (missing.length > 0) {
        return { status: 'not_configured', message: `Missing: ${missing.join(', ')}` };
      }
      
      return { status: 'configured', message: `Bucket: ${bucket}, Region: ${region}` };
    }
  },
  
  'Google Maps API': {
    required: true,
    envVars: ['GOOGLE_MAPS_API_KEY'],
    check: () => {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        return { status: 'not_configured', message: 'Missing GOOGLE_MAPS_API_KEY' };
      }
      
      if (!apiKey.startsWith('AIza')) {
        return { status: 'error', message: 'API key format may be invalid (should start with AIza)' };
      }
      
      return { status: 'configured', message: `API key: ${apiKey.substring(0, 10)}...` };
    }
  },
  
  'Redis (Caching)': {
    required: false,
    envVars: ['REDIS_URL'],
    check: () => {
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST;
      
      if (!redisUrl && !redisHost) {
        return { status: 'not_configured', message: 'Missing REDIS_URL or REDIS_HOST' };
      }
      
      const url = redisUrl || `redis://${redisHost || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
      return { status: 'configured', message: `URL: ${url}` };
    }
  },
  
  'MySQL Database': {
    required: true,
    envVars: ['DATABASE_URL'],
    check: () => {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        return { status: 'not_configured', message: 'Missing DATABASE_URL' };
      }
      
      if (!databaseUrl.startsWith('mysql://')) {
        return { status: 'error', message: 'DATABASE_URL format may be invalid (should start with mysql://)' };
      }
      
      // Mask password in URL
      const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
      return { status: 'configured', message: `URL: ${maskedUrl}` };
    }
  }
};

// Main function
function main() {
  console.log('🔍 Checking Third-Party Services Configuration...\n');
  
  const results = [];
  
  for (const [name, service] of Object.entries(services)) {
    const result = service.check();
    results.push({
      name,
      ...result,
      required: service.required
    });
  }
  
  // Separate results
  const configured = results.filter(r => r.status === 'configured');
  const notConfigured = results.filter(r => r.status === 'not_configured');
  const errors = results.filter(r => r.status === 'error');
  
  // Print results
  if (configured.length > 0) {
    console.log('✅ Configured Services:');
    configured.forEach(result => {
      const icon = result.required ? '✓' : '○';
      console.log(`   ${icon} ${result.name}: ${result.message}`);
    });
    console.log('');
  }
  
  if (notConfigured.length > 0) {
    const required = notConfigured.filter(r => r.required);
    const optional = notConfigured.filter(r => !r.required);
    
    if (optional.length > 0) {
      console.log('⚠️  Not Configured (Optional):');
      optional.forEach(result => {
        console.log(`   ○ ${result.name}: ${result.message}`);
      });
      console.log('');
    }
    
    if (required.length > 0) {
      console.log('❌ Not Configured (Required):');
      required.forEach(result => {
        console.log(`   ✗ ${result.name}: ${result.message}`);
      });
      console.log('');
    }
  }
  
  if (errors.length > 0) {
    const required = errors.filter(r => r.required);
    const optional = errors.filter(r => !r.required);
    
    if (required.length > 0) {
      console.log('❌ Configuration Errors (Required):');
      required.forEach(result => {
        console.log(`   ✗ ${result.name}: ${result.message}`);
      });
      console.log('');
    }
    
    if (optional.length > 0) {
      console.log('⚠️  Configuration Errors (Optional):');
      optional.forEach(result => {
        console.log(`   ○ ${result.name}: ${result.message}`);
      });
      console.log('');
    }
  }
  
  // Summary
  const requiredConfigured = results.filter(r => r.required && r.status === 'configured').length;
  const totalRequired = results.filter(r => r.required).length;
  
  console.log('📊 Summary:');
  console.log(`   Total Services: ${results.length}`);
  console.log(`   Configured: ${configured.length}`);
  console.log(`   Not Configured: ${notConfigured.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log('');
  console.log(`   Required Services: ${requiredConfigured}/${totalRequired} configured`);
  
  if (requiredConfigured < totalRequired) {
    console.log('\n⚠️  Warning: Some required services are not configured!');
    console.log('   Please check your .env file in the backend directory.');
    process.exit(1);
  } else {
    console.log('\n✅ All required services are configured!');
    console.log('   Note: This only checks configuration, not actual connectivity.');
    process.exit(0);
  }
}

// Run
main();

