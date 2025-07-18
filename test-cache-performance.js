// Quick test to verify negative keywords caching is working
// Run this in browser console on test page after logging in

async function testNegativeKeywordsCache() {
  console.log('🧪 Testing negative keywords cache performance...');
  
  // Test 1: Multiple rapid generations should show cache hits
  console.log('\n1️⃣ Testing cache hits with rapid generations...');
  
  const testIdea = "How to improve productivity";
  const textarea = document.querySelector('textarea');
  if (textarea) {
    textarea.value = testIdea;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Generate 3 scripts rapidly
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📝 Generation ${i}/3:`);
    
    const generateButton = document.querySelector('button:has(.lucide-zap)');
    if (generateButton && !generateButton.disabled) {
      const startTime = performance.now();
      generateButton.click();
      
      // Wait for completion
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        const loadingIcon = document.querySelector('.lucide-loader2');
        if (!loadingIcon) {
          const endTime = performance.now();
          console.log(`⏱️ Generation ${i} completed in ${Math.round(endTime - startTime)}ms`);
          break;
        }
      }
      
      // Short delay between generations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📊 Check the Network tab for database requests:');
  console.log('- First generation should show Firestore requests');
  console.log('- Subsequent generations should show fewer/no Firestore requests');
  console.log('- Look for "🎯 Cache hit" messages in console');
  
  return 'Test completed - check console logs and Network tab for cache behavior';
}

// Instructions
console.log(`
🎯 Negative Keywords Cache Test Instructions:
1. Make sure you're logged in at http://localhost:3000/dashboard/test/script-generation
2. Open Network tab in DevTools
3. Filter by "firestore" or "googleapis" to see database requests
4. Run: testNegativeKeywordsCache()
5. Watch for reduced database calls on subsequent generations

Expected behavior:
- Generation 1: Database fetch + "Cache miss" log
- Generation 2-3: No database fetch + "Cache hit" log
`);

// Export for use
window.testNegativeKeywordsCache = testNegativeKeywordsCache;