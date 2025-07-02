import { TemplateGenerator } from "../src/index";

async function basicUsageExample() {
  console.log("🚀 Template Generator Service - Basic Usage Example\n");

  try {
    // Initialize the service
    const generator = new TemplateGenerator();
    console.log("✅ Service initialized successfully\n");

    // Example 1: Generate templates from marketing segments
    console.log("📝 Example 1: Generating templates from marketing segments");

    const segments = {
      Hook: "If you want your videos to look pro, here is why you need to stop using your back camera.",
      Bridge: "Now look, before y'all start typing in the comments, let me explain why this matters.",
      "Golden Nugget":
        "The key insight is that proper lighting leads to better engagement when you use your front camera.",
      WTA: "So if you're ready to level up your content, switch to front camera and start seeing real growth.",
    };

    const result1 = await generator.generateTemplatesFromSegments(segments);

    if (result1.success) {
      console.log("✅ Templates generated successfully!");
      console.log("📊 Processing time:", result1.processingTime, "ms");
      console.log("🎯 Templates generated:", result1.metadata?.templatesGenerated);
      console.log("🏷️  Placeholders identified:", result1.metadata?.placeholdersIdentified);

      console.log("\n📋 Generated Templates:");
      console.log("Hook:", result1.templates?.hook);
      console.log("Bridge:", result1.templates?.bridge);
      console.log("Golden Nugget:", result1.templates?.nugget);
      console.log("WTA:", result1.templates?.wta);
    } else {
      console.error("❌ Template generation failed:", result1.error);
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // Example 2: Generate templates from raw transcription
    console.log("📝 Example 2: Generating templates from raw transcription");

    const transcription =
      "If you want your videos to look pro, here is why you need to stop using your back camera. Now look, before y'all start typing in the comments, let me explain why this matters. The key insight is that proper lighting leads to better engagement when you use your front camera. So if you're ready to level up your content, switch to front camera and start seeing real growth.";

    const result2 = await generator.generateTemplatesFromTranscription(transcription);

    if (result2.success) {
      console.log("✅ Templates generated successfully from transcription!");
      console.log("📊 Processing time:", result2.processingTime, "ms");
      console.log("🎯 Processing mode:", result2.metadata?.processingMode);

      console.log("\n📋 Original Content:");
      console.log("Hook:", result2.originalContent?.Hook);
      console.log("Bridge:", result2.originalContent?.Bridge);
      console.log("Golden Nugget:", result2.originalContent?.["Golden Nugget"]);
      console.log("WTA:", result2.originalContent?.WTA);
    } else {
      console.error("❌ Template generation failed:", result2.error);
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // Example 3: Batch processing
    console.log("📝 Example 3: Batch processing multiple inputs");

    const inputs = [
      {
        segments: {
          Hook: "Stop making these 3 mistakes that are killing your productivity.",
          Bridge: "I know you think you're being efficient, but here's what's really happening.",
          "Golden Nugget":
            "The truth is that multitasking reduces your effectiveness by 40% and increases stress levels significantly.",
          WTA: "Start single-tasking today and watch your productivity skyrocket.",
        },
      },
      {
        transcription:
          "Your morning routine is the key to success. Most people waste the first hour of their day. The secret is to start with the most important task before checking your phone. This simple change will transform your entire day.",
      },
    ];

    const batchResult = await generator.batchGenerateTemplates(inputs);

    console.log("✅ Batch processing completed!");
    console.log("📊 Summary:");
    console.log("  - Total processed:", batchResult.summary.totalProcessed);
    console.log("  - Successful:", batchResult.summary.successful);
    console.log("  - Failed:", batchResult.summary.failed);
    console.log("  - Total time:", batchResult.summary.totalProcessingTime, "ms");
    console.log("  - Average time:", batchResult.summary.averageProcessingTime, "ms");

    if (batchResult.errors && batchResult.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      batchResult.errors.forEach((error) => {
        console.log(`  - Input ${error.index}: ${error.error}`);
      });
    }

    console.log("\n🎉 All examples completed successfully!");
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicUsageExample();
}

export { basicUsageExample };
