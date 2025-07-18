/**
 * Test script to validate new Alex Hormozi hook patterns
 */

const {
  getHookExamples,
  formatHookExamplesForPrompt,
} = require("./src/lib/prompts/script-generation/hook-examples.ts");

console.log("🧪 Testing New Alex Hormozi Hook Patterns\n");

// Test 1: Get all new Alex Hormozi hooks
console.log("=== Test 1: New Alex Hormozi Hooks ===");
const allHooks = getHookExamples({ limit: 50 });
const hormoziHooks = allHooks.filter(
  (hook) =>
    hook.id.includes("learned_from_unexpected") ||
    hook.id.includes("numbers_hack") ||
    hook.id.includes("if_i_said") ||
    hook.id.includes("significant_life_event") ||
    hook.id.includes("fastest_way_learn") ||
    hook.id.includes("two_things_say") ||
    hook.id.includes("greatest_advantage") ||
    hook.id.includes("cant_do_both") ||
    hook.id.includes("how_do_i_achieve") ||
    hook.id.includes("most_adjective_noun") ||
    hook.id.includes("outperform_percentage") ||
    hook.id.includes("lesson_wish_known") ||
    hook.id.includes("never_achieved_until") ||
    hook.id.includes("one_trait_pick"),
);

console.log(`Found ${hormoziHooks.length} new Alex Hormozi hooks:`);
hormoziHooks.forEach((hook) => {
  console.log(`  ✓ ${hook.id} (${hook.category}): "${hook.pattern}"`);
});

// Test 2: Test filtering by category
console.log("\n=== Test 2: Category Filtering ===");
const viralHooks = getHookExamples({ category: "viral", limit: 5 });
const speedHooks = getHookExamples({ category: "speed", limit: 5 });
const eduHooks = getHookExamples({ category: "educational", limit: 5 });

console.log(`Viral hooks: ${viralHooks.length}`);
console.log(`Speed hooks: ${speedHooks.length}`);
console.log(`Educational hooks: ${eduHooks.length}`);

// Test 3: Test prompt formatting
console.log("\n=== Test 3: Prompt Formatting ===");
const viralPrompt = formatHookExamplesForPrompt({ category: "viral", limit: 3 });
const speedPrompt = formatHookExamplesForPrompt({ category: "speed", limit: 3 });

console.log("Viral prompt sample:");
console.log(viralPrompt);

console.log("\nSpeed prompt sample:");
console.log(speedPrompt);

// Test 4: Test tone filtering
console.log("\n=== Test 4: Tone Filtering ===");
const casualHooks = getHookExamples({ tone: "casual", limit: 5 });
const dramaticHooks = getHookExamples({ tone: "dramatic", limit: 3 });

console.log(`Casual tone hooks: ${casualHooks.length}`);
console.log(`Dramatic tone hooks: ${dramaticHooks.length}`);

// Test 5: Test effectiveness filtering
console.log("\n=== Test 5: Effectiveness Filtering ===");
const highEffectiveness = getHookExamples({ effectiveness: "high", limit: 10 });
console.log(`High effectiveness hooks: ${highEffectiveness.length}`);

console.log("\n✅ Hook library tests completed!");
