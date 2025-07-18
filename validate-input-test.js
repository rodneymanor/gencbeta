// Browser-based test for input validation with authentication
// Run this in browser console on the test page after logging in

async function validateInputTest() {
  console.log('🔧 Testing input validation with authentication...');
  
  // Get auth token if available
  let authToken = null;
  try {
    // Try to get Firebase auth token
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      authToken = await firebase.auth().currentUser.getIdToken();
      console.log('✅ Got Firebase auth token');
    }
  } catch (e) {
    console.log('⚠️ No Firebase auth available, testing without auth');
  }

  const testCases = [
    {
      name: "Valid input",
      input: { idea: "How to improve productivity using time management", length: "30" },
      shouldPass: true
    },
    {
      name: "Idea too short",
      input: { idea: "test", length: "30" },
      shouldPass: false,
      expectedError: "at least 10 characters"
    },
    {
      name: "Invalid length",
      input: { idea: "How to improve productivity", length: "25" },
      shouldPass: false,
      expectedError: "Length must be one of"
    },
    {
      name: "Missing idea",
      input: { length: "30" },
      shouldPass: false,
      expectedError: "required"
    },
    {
      name: "Invalid type",
      input: { idea: "How to improve productivity", length: "30", type: "invalid" },
      shouldPass: false,
      expectedError: "Type must be one of"
    },
    {
      name: "Empty object",
      input: {},
      shouldPass: false,
      expectedError: "required"
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\n🧪 Testing: ${test.name}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/script/speed-write/v2', {
        method: 'POST',
        headers,
        body: JSON.stringify(test.input)
      });

      const result = await response.json();
      
      if (test.shouldPass) {
        // For valid inputs, we expect either success or auth failure (if no token)
        if (response.status === 200 || (response.status === 401 && !authToken)) {
          console.log(`✅ PASS: Valid input handled correctly`);
          passed++;
        } else {
          console.log(`❌ FAIL: Valid input rejected - ${result.error}`);
          failed++;
        }
      } else {
        // For invalid inputs, we expect 400 validation error
        if (response.status === 400 && result.error.includes(test.expectedError || 'validation')) {
          console.log(`✅ PASS: Invalid input rejected - ${result.error}`);
          passed++;
        } else {
          console.log(`❌ FAIL: Expected validation error, got status ${response.status}: ${result.error}`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ FAIL: Network error - ${error.message}`);
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Validation Test Results:`);
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  
  if (failed === 0) {
    console.log('🎉 All validation tests passed!');
  } else {
    console.log('⚠️ Some validation tests failed - check the implementation');
  }

  return { passed, failed, total: testCases.length };
}

console.log(`
🎯 Input Validation Test Instructions:
1. Make sure you're on http://localhost:3000/dashboard/test/script-generation
2. Make sure you're logged in (for auth token)
3. Run: validateInputTest()

This will test input validation with proper authentication.
`);

// Export for use
window.validateInputTest = validateInputTest;