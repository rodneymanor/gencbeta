/**
 * Test script generation with new Alex Hormozi hook patterns
 */

const { generateTypeSpecificHookGuidelines } = require("./src/lib/prompts/script-generation/speed-write.ts");

console.log("🎯 Testing Script Generation with New Hook Patterns\n");

// Test 1: Generate hook guidelines for different types
console.log("=== Test 1: Hook Guidelines Generation ===");

const speedGuidelines = generateTypeSpecificHookGuidelines("speed", "casual");
console.log("Speed + Casual Hook Guidelines:");
console.log(speedGuidelines);

console.log("\n" + "=".repeat(50) + "\n");

const viralGuidelines = generateTypeSpecificHookGuidelines("viral", "dramatic");
console.log("Viral + Dramatic Hook Guidelines:");
console.log(viralGuidelines);

console.log("\n" + "=".repeat(50) + "\n");

const eduGuidelines = generateTypeSpecificHookGuidelines("educational", "professional");
console.log("Educational + Professional Hook Guidelines:");
console.log(eduGuidelines);

console.log("\n✅ Hook guidelines generation completed!");
