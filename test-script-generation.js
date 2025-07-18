// Test script to verify script generation components are populated correctly
// Run this in the browser console on the test page

async function testScriptGeneration() {
  const testCases = [
    { idea: "How to overcome procrastination", type: "speed" },
    { idea: "Why morning routines matter", type: "educational" },
    { idea: "The secret to viral content", type: "viral" },
    { idea: "Building better habits", type: "speed" },
    { idea: "Understanding productivity science", type: "educational" },
    { idea: "Creating engaging social media posts", type: "viral" }
  ];

  console.log("🚀 Starting script generation tests...");
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}/${testCases.length}: ${testCase.idea} (${testCase.type})`);
    
    // Set the idea in the textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = testCase.idea;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Set the type if provided
    if (testCase.type && testCase.type !== "auto") {
      const typeButtons = document.querySelectorAll('[role="combobox"]');
      const typeButton = Array.from(typeButtons).find(btn => 
        btn.textContent.toLowerCase().includes('type') || 
        btn.textContent.toLowerCase().includes('auto')
      );
      if (typeButton) {
        typeButton.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const option = document.querySelector(`[data-value="${testCase.type}"]`);
        if (option) {
          option.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    // Click the generate button
    const generateButton = document.querySelector('button:has(.lucide-zap)');
    if (generateButton && !generateButton.disabled) {
      generateButton.click();
      
      // Wait for generation to complete (max 30 seconds)
      let waitTime = 0;
      while (waitTime < 30000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitTime += 1000;
        
        // Check if loading is complete
        const loadingIcon = document.querySelector('.lucide-loader2');
        if (!loadingIcon) {
          break;
        }
      }
      
      // Give UI time to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check results
      const v2Results = document.querySelectorAll('[data-version="v2"] pre');
      let hasEmptyComponents = false;
      let componentStatus = {};
      
      v2Results.forEach(pre => {
        try {
          const content = JSON.parse(pre.textContent);
          if (content.elements) {
            const elements = content.elements;
            componentStatus = {
              hook: !!elements.hook && elements.hook.trim() !== "",
              bridge: !!elements.bridge && elements.bridge.trim() !== "",
              goldenNugget: !!elements.goldenNugget && elements.goldenNugget.trim() !== "",
              wta: !!elements.wta && elements.wta.trim() !== ""
            };
            
            hasEmptyComponents = Object.values(componentStatus).some(status => !status);
          }
        } catch (e) {
          console.error("Failed to parse result:", e);
        }
      });
      
      const result = {
        testCase,
        success: v2Results.length > 0 && !hasEmptyComponents,
        hasEmptyComponents,
        componentStatus,
        timestamp: new Date().toISOString()
      };
      
      results.push(result);
      
      if (hasEmptyComponents) {
        console.log(`❌ Test ${i + 1} FAILED - Empty components:`, 
          Object.entries(componentStatus)
            .filter(([_, status]) => !status)
            .map(([component]) => component)
            .join(', ')
        );
      } else {
        console.log(`✅ Test ${i + 1} PASSED - All components populated`);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log("\n📊 Test Summary:");
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log("\n❌ Failed tests:");
    failedTests.forEach(test => {
      console.log(`- ${test.testCase.idea} (${test.testCase.type})`);
      console.log(`  Missing: ${Object.entries(test.componentStatus)
        .filter(([_, status]) => !status)
        .map(([component]) => component)
        .join(', ')}`);
    });
  }
  
  return results;
}

// Instructions
console.log(`
📋 Script Generation Test Instructions:
1. Navigate to http://localhost:3000/dashboard/test/script-generation
2. Make sure you're logged in
3. Open browser console (F12)
4. Run: testScriptGeneration()

This will test 6 different script generations and report any with empty components.
`);

// Export for use
window.testScriptGeneration = testScriptGeneration;