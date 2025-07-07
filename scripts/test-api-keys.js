#!/usr/bin/env node

/**
 * Test script for API Key Authentication System
 * Tests key generation, validation, and endpoint access
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3001}`;
const FIREBASE_ID_TOKEN = process.env.FIREBASE_ID_TOKEN; // You'll need to set this

console.log('🧪 Testing API Key Authentication System');
console.log('📍 Base URL:', BASE_URL);

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Generate API Key
async function testGenerateApiKey() {
  console.log('\n🔑 Test 1: Generate API Key');
  
  if (!FIREBASE_ID_TOKEN) {
    console.log('❌ FIREBASE_ID_TOKEN not set. Please set it as an environment variable.');
    return null;
  }

  const url = new URL(`${BASE_URL}/api/keys`);
  const options = {
    method: 'POST',
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: {
      'Authorization': `Bearer ${FIREBASE_ID_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(options);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ API Key generated successfully');
      console.log('🔐 API Key:', response.data.apiKey?.substring(0, 20) + '...');
      return response.data.apiKey;
    } else if (response.status === 409) {
      console.log('⚠️ API Key already exists');
      return await testGetApiKeyStatus();
    } else {
      console.log('❌ Failed to generate API key');
      console.log('📝 Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Test 2: Get API Key Status
async function testGetApiKeyStatus() {
  console.log('\n📋 Test 2: Get API Key Status');
  
  if (!FIREBASE_ID_TOKEN) {
    console.log('❌ FIREBASE_ID_TOKEN not set');
    return null;
  }

  const url = new URL(`${BASE_URL}/api/keys`);
  const options = {
    method: 'GET',
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: {
      'Authorization': `Bearer ${FIREBASE_ID_TOKEN}`,
    },
  };

  try {
    const response = await makeRequest(options);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ API Key status retrieved successfully');
      console.log('🔍 Has Active Key:', response.data.hasActiveKey);
      console.log('📈 Key History:', response.data.keyHistory?.length || 0, 'keys');
      return response.data.activeKey;
    } else {
      console.log('❌ Failed to get API key status');
      console.log('📝 Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Test 3: Test Collections API with API Key
async function testCollectionsApi(apiKey) {
  console.log('\n📚 Test 3: Test Collections API');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return false;
  }

  const url = new URL(`${BASE_URL}/api/collections`);
  const options = {
    method: 'GET',
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: {
      'x-api-key': apiKey,
    },
  };

  try {
    const response = await makeRequest(options);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Collections API test successful');
      console.log('📁 Collections found:', response.data.collections?.length || 0);
      return true;
    } else {
      console.log('❌ Collections API test failed');
      console.log('📝 Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 4: Test Add Video API with API Key
async function testAddVideoApi(apiKey) {
  console.log('\n🎬 Test 4: Test Add Video API');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return false;
  }

  // First, get collections to find one to add video to
  const url = new URL(`${BASE_URL}/api/collections`);
  const getOptions = {
    method: 'GET',
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: {
      'x-api-key': apiKey,
    },
  };

  try {
    const collectionsResponse = await makeRequest(getOptions);
    
    if (collectionsResponse.status !== 200 || !collectionsResponse.data.collections?.length) {
      console.log('❌ No collections found to test with');
      return false;
    }

    const firstCollection = collectionsResponse.data.collections[0];
    console.log('🎯 Testing with collection:', firstCollection.title);

    // Test add video endpoint
    const addVideoUrl = new URL(`${BASE_URL}/api/add-video-to-collection`);
    const addOptions = {
      method: 'POST',
      hostname: addVideoUrl.hostname,
      port: addVideoUrl.port,
      path: addVideoUrl.pathname,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    const testData = {
      videoUrl: 'https://www.tiktok.com/@example/video/12345',
      collectionId: firstCollection.id,
      title: 'API Key Test Video',
    };

    const response = await makeRequest(addOptions, testData);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Add Video API test successful');
      console.log('📝 Response:', response.data);
      return true;
    } else {
      console.log('❌ Add Video API test failed');
      console.log('📝 Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 5: Test Rate Limiting
async function testRateLimiting(apiKey) {
  console.log('\n⚡ Test 5: Test Rate Limiting');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return false;
  }

  console.log('🔄 Making 5 rapid requests to test rate limiting...');
  
  const url = new URL(`${BASE_URL}/api/collections`);
  const options = {
    method: 'GET',
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: {
      'x-api-key': apiKey,
    },
  };

  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest(options));
  }

  try {
    const responses = await Promise.all(promises);
    const statusCodes = responses.map(r => r.status);
    
    console.log('📊 Response status codes:', statusCodes);
    
    const successCount = statusCodes.filter(code => code === 200).length;
    const rateLimitCount = statusCodes.filter(code => code === 429).length;
    
    console.log(`✅ Successful requests: ${successCount}`);
    console.log(`🚫 Rate limited requests: ${rateLimitCount}`);
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Key Authentication Tests');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Generate or get API key
    let apiKey = await testGenerateApiKey();
    
    if (!apiKey) {
      console.log('\n❌ Cannot continue tests without API key');
      return;
    }

    // Test 2: Get API key status
    await testGetApiKeyStatus();

    // Test 3: Test collections API
    await testCollectionsApi(apiKey);

    // Test 4: Test add video API
    await testAddVideoApi(apiKey);

    // Test 5: Test rate limiting
    await testRateLimiting(apiKey);

    console.log('\n🎉 All tests completed!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('💥 Test runner error:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testGenerateApiKey,
  testGetApiKeyStatus,
  testCollectionsApi,
  testAddVideoApi,
  testRateLimiting,
}; 