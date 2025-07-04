/**
 * Prompt generation utilities with hardened JSON output rules
 */

/**
 * Adds strict JSON-only formatting rules to any prompt
 */
export function addJsonFormatting(basePrompt: string, jsonSchema: string): string {
  return `${basePrompt}

CRITICAL OUTPUT REQUIREMENTS:
- Respond with ONLY a valid JSON object
- Do NOT add markdown code fences (\`\`\`json or \`\`\`)
- Do NOT add any explanatory text before or after the JSON
- Do NOT add comments or additional formatting
- Return pure JSON that can be parsed directly

${jsonSchema}`;
}

/**
 * Creates a hardened Speed Write prompt with explicit JSON formatting rules
 */
export function createSpeedWritePrompt(
  idea: string, 
  length: string, 
  targetWords: number, 
  negativeKeywordInstruction: string
): string {
  const basePrompt = `Write a video script using the Speed Write formula. Each section should be complete and ready to record.

Target Length: ${length} seconds (~${targetWords} words)
Script Topic: ${idea}${negativeKeywordInstruction}

Make sure each section flows naturally into the next when read aloud.`;

  const jsonSchema = `Return your response in this exact JSON format:
{
  "hook": "Your attention-grabbing opener that hooks the viewer immediately",
  "bridge": "Your transition that connects the hook to the main content", 
  "goldenNugget": "Your core value, insight, or main teaching point",
  "wta": "Your clear call to action that tells viewers what to do next"
}`;

  return addJsonFormatting(basePrompt, jsonSchema);
}

/**
 * Creates a hardened AI Voice prompt with explicit JSON formatting rules
 */
export function createAIVoicePrompt(
  idea: string,
  length: string,
  targetWordCount: number,
  templateHook: string,
  templateBridge: string,
  templateNugget: string,
  templateWta: string,
  negativeKeywordInstruction: string
): string {
  const basePrompt = `ROLE:
You are an expert content strategist and copywriter. Your primary skill is deconstructing information and skillfully reassembling it into a different, predefined narrative or structural framework.

OBJECTIVE:
Your task is to take the [1. Source Content] and rewrite it so that it perfectly fits the structure, tone, and cadence of the [2. Structural Template].

CRITICAL PLACEHOLDER REPLACEMENT RULE:
Any text in square brackets [like this] in the template are PLACEHOLDERS that MUST be replaced with actual, specific content from your source material. NEVER leave any square brackets or placeholder text in your final output. Every [placeholder] must become real words.

[1. SOURCE CONTENT - The "What"]
${idea}

[2. STRUCTURAL TEMPLATE - The "How"]
Hook: ${templateHook}
Bridge: ${templateBridge}
Golden Nugget: ${templateNugget}
What To Act: ${templateWta}

INSTRUCTIONS:
1. Replace ALL placeholders [like this] with actual content from the source material
2. Maintain the template's tone and narrative voice
3. Ensure smooth transitions between sections
4. Target approximately ${targetWordCount} words for a ${length}-second read

${negativeKeywordInstruction}

FINAL CHECK: Ensure NO square brackets [like this] remain in your response.`;

  const jsonSchema = `Return your response in this exact JSON format:
{
  "hook": "Your adapted hook section with all placeholders replaced",
  "bridge": "Your adapted bridge section with all placeholders replaced", 
  "goldenNugget": "Your adapted golden nugget section with all placeholders replaced",
  "wta": "Your adapted what-to-act section with all placeholders replaced"
}`;

  return addJsonFormatting(basePrompt, jsonSchema);
} 