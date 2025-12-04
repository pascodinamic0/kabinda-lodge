#!/usr/bin/env node

/**
 * Simple API Testing Script
 * 
 * Usage:
 *   node test-api.js
 * 
 * Make sure your dev server is running: npm run dev
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, options = {}) {
  try {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Testing: ${name}`, 'blue');
    log(`Method: ${method}`, 'blue');
    log(`URL: ${url}`, 'blue');
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();
    
    if (response.ok) {
      log(`✓ Status: ${response.status}`, 'green');
      log(`Response:`, 'green');
      console.log(JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      log(`✗ Status: ${response.status}`, 'red');
      log(`Error:`, 'red');
      console.log(JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    log(`✗ Request failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Starting API Tests', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'cyan');

  const results = [];

  // Test 1: Get default hotel
  results.push(await testEndpoint(
    'Get Default Hotel',
    'GET',
    `${BASE_URL}/api/hotels/get-default`
  ));

  // Test 2: List agents (requires hotel ID - will fail without it)
  // Replace YOUR_HOTEL_ID with actual hotel ID from test 1
  const hotelId = results[0]?.data?.hotelId || 'YOUR_HOTEL_ID';
  if (hotelId !== 'YOUR_HOTEL_ID') {
    results.push(await testEndpoint(
      'List Agents',
      'GET',
      `${BASE_URL}/api/agents?hotel=${hotelId}`
    ));
  } else {
    log('\n⚠️  Skipping agent test - no hotel ID available', 'yellow');
  }

  // Test 3: List card issues
  if (hotelId !== 'YOUR_HOTEL_ID') {
    results.push(await testEndpoint(
      'List Card Issues',
      'GET',
      `${BASE_URL}/api/card-issues?hotel=${hotelId}`
    ));
  }

  // Test 4: Create card issue (example - may fail without proper data)
  if (hotelId !== 'YOUR_HOTEL_ID') {
    results.push(await testEndpoint(
      'Create Card Issue',
      'POST',
      `${BASE_URL}/api/card-issues`,
      {
        body: {
          hotelId: hotelId,
          cardType: 'guest',
          payload: {
            roomNumber: '101',
            checkIn: new Date().toISOString(),
            checkOut: new Date(Date.now() + 86400000).toISOString(),
          },
        },
      }
    ));
  }

  // Summary
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('Test Summary', 'cyan');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});




