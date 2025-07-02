"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_GENERATION_PROMPTS = void 0;
exports.TEMPLATE_GENERATION_PROMPTS = {
  /**
   * Prompt for converting a specific marketing segment into a generic template
   */
  createTemplateFromComponent: (componentText, componentType) => `
You are an expert in content strategy and pattern recognition. Your task is to convert a specific script component into a generic, reusable template. Analyze the provided text and identify its underlying structure. Replace specific nouns, topics, and outcomes with generic, bracketed placeholders like [Topic], [Target Audience], [Common Problem], [Desired Outcome], [Specific Action], or [Benefit]. The goal is to create a template that can be adapted to ANY subject.

**Example:**
- **Specific Text:** "If you want your videos to look pro, here is why you need to stop using your back camera."
- **Generated Template:** "If you want to achieve [Desired Outcome], here is why you need to stop [Common Mistake]."

**Component Type:** ${componentType.toUpperCase()}
**Specific Text to Analyze:**
"${componentText}"

**CRITICAL OUTPUT REQUIREMENT:** 
Your response must start IMMEDIATELY with the opening brace { and contain NOTHING else except the JSON object.

Expected JSON format:
{
  "template": "Your generic template with [Placeholders] here",
  "placeholders": ["List", "of", "placeholder", "types", "used"],
  "explanation": "Brief explanation of the pattern identified"
}`,
  /**
   * Prompt for analyzing raw transcription and extracting marketing segments
   */
  analyzeTranscription: (transcription) => `
You are an expert Script Analyst AI. Your task is to analyze the transcript and assign EVERY SINGLE WORD to one of the four marketing categories.

CRITICAL REQUIREMENTS:
- Every word in the transcript must be assigned to exactly one category
- No word can be left unassigned
- No word can be assigned to multiple categories
- The sum of all category text must equal the complete transcript
- Maintain the original word order and spacing

CRITICAL OUTPUT REQUIREMENT: 
Your response must start IMMEDIATELY with the opening brace { and contain NOTHING else except the JSON object.

Expected JSON format:
{
  "transcription": "The complete, accurate transcription of the video audio",
  "marketingSegments": {
    "Hook": "All words assigned to Hook category in original order",
    "Bridge": "All words assigned to Bridge category in original order", 
    "Golden Nugget": "All words assigned to Golden Nugget category in original order",
    "WTA": "All words assigned to WTA category in original order"
  }
}

PRECISE CATEGORY DEFINITIONS:

Hook: ONLY the initial attention-grabbing statement that presents the core problem, controversial opinion, or bold claim. This should be ONE complete sentence or thought that immediately hooks the viewer.

Bridge: Words that build connection, establish credibility, provide context, or transition from the hook to the main content.

Golden Nugget: Words containing the main value, insights, tips, or core educational content. The actual teaching or valuable information being shared.

WTA (Why To Act): Words that create urgency, provide calls-to-action, or motivate immediate response.

**Transcription to Analyze:**
"${transcription}"

FINAL REMINDER: Your response must be PURE JSON starting with { and ending with }. No other text whatsoever.`,
};
//# sourceMappingURL=prompts.js.map
