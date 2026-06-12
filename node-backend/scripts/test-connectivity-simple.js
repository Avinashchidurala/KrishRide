#!/usr/bin/env node

/**
 * Simple Connectivity Test (using built-in Node.js modules)
 * Tests services that can be tested without external dependencies
 */

require('dotenv').config();

const https = require('https');
const http = require('http');

const results = [];

function addResult(name, status, message, required = false) {
  results.push({ name, status, message, required });
  const icon = status === 'working' ? '✅' : status === 'error' ? '❌' : '⚠️';
  const reqIcon = required ? '🔴' : '🟡';
  console.log(`${icon} ${reqIcon} ${name}: ${message}`);
}

// Test Google Maps API (using built-in fetch in Node 18+ or https)
async function testGoogleMaps() {
  return new Promise((resolve) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
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
            addResult('Google Maps API', 'working', 'API key validated', true);
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
    });
  });
}

// Test SendGrid API
async function testSendGrid() {
  return new Promise((resolve) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
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
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          addResult('SendGrid', 'working', 'API key validated', false);
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
    
    req.end();
  });
}

// Test Redis connection (simple TCP connection test)
async function testRedis() {
  return new Promise((resolve) => {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    
    if (!redisUrl && !redisHost) {
      addResult('Redis', 'not_configured', 'Not configured', false);
      return resolve();
    }
    
    // Extract host and port from URL if provided
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
    
    const net = require('net');
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      addResult('Redis', 'error', 'Connection timeout', false);
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
        addResult('Redis', 'error', `Connection refused - Redis server not running on ${host}:${port}`, false);
      } else {
        addResult('Redis', 'error', err.message, false);
      }
      resolve();
    });
  });
}

// Main function
async function main() {
  console.log('🔍 Testing Connectivity (Simple Tests)...\n');
  console.log('Testing services that can be tested without dependencies...\n');
  
  await testGoogleMaps();
  await testSendGrid();
  await testRedis();
  
  console.log('\n📊 Summary:');
  console.log(`   Total Tests: ${results.length}`);
  const working = results.filter(r => r.status === 'working').length;
  const errors = results.filter(r => r.status === 'error').length;
  console.log(`   Working: ${working}`);
  console.log(`   Errors: ${errors}`);
  console.log('\n⚠️  Note: Database, Razorpay, and AWS S3 tests require installed dependencies.');
  console.log('   Run: npm install (in backend directory)');
  console.log('   Then run: node scripts/test-connectivity.js for full tests');
}

main().catch(console.error);

