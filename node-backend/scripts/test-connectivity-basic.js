#!/usr/bin/env node

/**
 * Basic Connectivity Test (using only Node.js built-in modules)
 * Tests services without requiring dependencies
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const net = require('net');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
let envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^[\"']|[\"']$/g, '');
        envVars[key] = value;
      }
    }
  });
}

const results = [];

function addResult(name, status, message, required = false) {
  results.push({ name, status, message, required });
}

// Test Google Maps API
async function testGoogleMaps() {
  return new Promise((resolve) => {
    const apiKey = envVars.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      addResult('Google Maps API', 'error', 'API key not configured', true);
      return resolve();
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Hyderabad&key=${apiKey}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK') {
            addResult('Google Maps API', 'working', 'API key validated successfully', true);
          } else if (json.status === 'REQUEST_DENIED') {
            addResult('Google Maps API', 'error', `API key invalid: ${json.error_message || json.status}`, true);
          } else {
            addResult('Google Maps API', 'error', `API returned: ${json.status}`, true);
          }
        } catch (e) {
          addResult('Google Maps API', 'error', 'Invalid response format', true);
        }
        resolve();
      });
    }).on('error', (err) => {
      addResult('Google Maps API', 'error', err.message, true);
      resolve();
    }).setTimeout(10000, () => {
      addResult('Google Maps API', 'error', 'Request timeout', true);
      resolve();
    });
  });
}

// Test SendGrid API
async function testSendGrid() {
  return new Promise((resolve) => {
    const apiKey = envVars.SENDGRID_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      addResult('SendGrid', 'not_configured', 'API key not configured', false);
      return resolve();
    }
    
    const options = {
      hostname: 'api.sendgrid.com',
      path: '/v3/user/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          addResult('SendGrid', 'working', 'API key validated successfully', false);
        } else if (res.statusCode === 401) {
          addResult('SendGrid', 'error', 'Invalid API key', false);
        } else {
          addResult('SendGrid', 'error', `HTTP ${res.statusCode}`, false);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      addResult('SendGrid', 'error', err.message, false);
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      addResult('SendGrid', 'error', 'Request timeout', false);
      resolve();
    });
    
    req.end();
  });
}

// Test Redis connection
async function testRedis() {
  return new Promise((resolve) => {
    const redisUrl = envVars.REDIS_URL;
    const redisHost = envVars.REDIS_HOST || 'localhost';
    const redisPort = parseInt(envVars.REDIS_PORT || '6379', 10);
    
    if (!redisUrl && !redisHost) {
      addResult('Redis', 'not_configured', 'Not configured', false);
      return resolve();
    }
    
    let host = redisHost;
    let port = redisPort;
    if (redisUrl && redisUrl.startsWith('redis://')) {
      try {
        const url = new URL(redisUrl);
        host = url.hostname;
        port = parseInt(url.port || '6379', 10);
      } catch (e) {
        // Use defaults
      }
    }
    
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      addResult('Redis', 'error', `Connection timeout to ${host}:${port}`, false);
      resolve();
    }, 5000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      addResult('Redis', 'working', `Connected to ${host}:${port}`, false);
      resolve();
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeout);
      if (err.code === 'ECONNREFUSED') {
        addResult('Redis', 'error', `Redis server not running on ${host}:${port}`, false);
      } else {
        addResult('Redis', 'error', err.message, false);
      }
      resolve();
    });
  });
}

// Test MySQL Database (simple TCP connection test)
async function testDatabase() {
  return new Promise((resolve) => {
    const databaseUrl = envVars.DATABASE_URL;
    if (!databaseUrl || databaseUrl.startsWith('your_')) {
      addResult('MySQL Database', 'error', 'DATABASE_URL not configured', true);
      return resolve();
    }
    
    try {
      // Parse MySQL URL: mysql://user:pass@host:port/db
      const match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!match) {
        addResult('MySQL Database', 'error', 'Invalid DATABASE_URL format', true);
        return resolve();
      }
      
      const [, user, pass, host, port, db] = match;
      const mysqlPort = parseInt(port, 10);
      
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        addResult('MySQL Database', 'error', `Connection timeout to ${host}:${mysqlPort}`, true);
        resolve();
      }, 5000);
      
      socket.connect(mysqlPort, host, () => {
        clearTimeout(timeout);
        socket.destroy();
        addResult('MySQL Database', 'working', `TCP connection to ${host}:${mysqlPort} successful (credentials not validated)`, true);
        resolve();
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        if (err.code === 'ECONNREFUSED') {
          addResult('MySQL Database', 'error', `MySQL server not running on ${host}:${mysqlPort}`, true);
        } else {
          addResult('MySQL Database', 'error', err.message, true);
        }
        resolve();
      });
    } catch (err) {
      addResult('MySQL Database', 'error', err.message, true);
      resolve();
    }
  });
}

// Main function
async function main() {
  console.log('🔍 Testing Connectivity (Basic Tests - No Dependencies)...\n');
  console.log('Testing services using built-in Node.js modules only...\n');
  
  await testDatabase();
  await testGoogleMaps();
  await testSendGrid();
  await testRedis();
  
  // Print results
  const working = results.filter(r => r.status === 'working');
  const errors = results.filter(r => r.status === 'error');
  const notConfigured = results.filter(r => r.status === 'not_configured');
  
  console.log('\n📊 Results:\n');
  
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
  
  if (notConfigured.length > 0) {
    console.log('⚠️  Not Configured (Optional):');
    notConfigured.forEach(r => {
      console.log(`   ○ ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  // Summary
  const totalRequired = results.filter(r => r.required).length;
  const requiredWorking = working.filter(r => r.required).length;
  
  console.log('📈 Summary:');
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Working: ${working.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Required Services: ${requiredWorking}/${totalRequired} working`);
  
  console.log('\n⚠️  Note:');
  console.log('   - Database test only checks TCP connection (not credentials)');
  console.log('   - Razorpay and AWS S3 tests require npm dependencies');
  console.log('   - For full tests, run: npm install && node scripts/test-connectivity.js');
  
  if (requiredWorking < totalRequired) {
    console.log('\n⚠️  Warning: Some required services are not working!');
    process.exit(1);
  } else {
    console.log('\n✅ All testable required services are working!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

