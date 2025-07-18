/**
 * Validate that Alex Hormozi hooks are properly integrated
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validating Alex Hormozi Hook Integration\n");

// Read the hook examples file
const hookExamplesPath = path.join(__dirname, "src/lib/prompts/script-generation/hook-examples.ts");
const hookExamplesContent = fs.readFileSync(hookExamplesPath, "utf8");

// Read the speed-write file
const speedWritePath = path.join(__dirname, "src/lib/prompts/script-generation/speed-write.ts");
const speedWriteContent = fs.readFileSync(speedWritePath, "utf8");

console.log("=== Validation Results ===");

// Check 1: Alex Hormozi hooks are present
const hormoziHooksPresent = hookExamplesContent.includes("Alex Hormozi-inspired hooks");
console.log(`✓ Alex Hormozi hooks section present: ${hormoziHooksPresent}`);

// Check 2: Key new hook patterns exist
const keyPatterns = [
  "learned_from_unexpected",
  "numbers_hack",
  "if_i_said",
  "significant_life_event",
  "fastest_way_learn",
  "two_things_say",
  "greatest_advantage",
  "cant_do_both",
];

console.log("\n=== Key Hook Patterns Check ===");
let foundPatterns = 0;
keyPatterns.forEach((pattern) => {
  const exists = hookExamplesContent.includes(pattern);
  console.log(`${exists ? "✓" : "✗"} ${pattern}: ${exists}`);
  if (exists) foundPatterns++;
});

console.log(`\nFound ${foundPatterns}/${keyPatterns.length} key patterns`);

// Check 3: Hook examples are being imported and used
const importsHookExamples = speedWriteContent.includes("formatHookExamplesForPrompt");
console.log(`\n✓ Hook examples imported in speed-write: ${importsHookExamples}`);

const usesHookExamples = speedWriteContent.includes("formatHookExamplesForPrompt({ category");
console.log(`✓ Hook examples used in generation: ${usesHookExamples}`);

// Check 4: Dynamic hook guidelines function exists
const hasDynamicGuidelines = speedWriteContent.includes("generateHookGuidelines");
console.log(`✓ Dynamic hook guidelines function: ${hasDynamicGuidelines}`);

// Check 5: High effectiveness hooks are properly marked
const highEffectivenessCount = (hookExamplesContent.match(/effectiveness: "high"/g) || []).length;
console.log(`✓ High effectiveness hooks: ${highEffectivenessCount}`);

console.log("\n=== Integration Status ===");
if (foundPatterns >= 6 && importsHookExamples && usesHookExamples && hasDynamicGuidelines) {
  console.log("🎉 ✅ Alex Hormozi hooks are properly integrated!");
  console.log("📈 The AI generation system now has access to proven high-engagement hook patterns.");
} else {
  console.log("❌ Integration issues detected. Please check the files.");
}

console.log("\n🚀 Ready for testing at: http://localhost:3001/dashboard/test");
