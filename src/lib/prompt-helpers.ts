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
 * Creates a hardened AI Voice prompt with sophisticated voice processing logic
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
Your task is to take the [1. Source Content] and rewrite it so that it perfectly fits the structure, tone, and cadence of the [2. Structural Template]. The goal is to produce a new, seamless piece of content that accomplishes the goal of the Source Content while flawlessly embodying the style of the Structural Template.

PRIMARY CONSTRAINT:
The final output must adhere closely to the provided template. The deviation from the template's core structure and language should be minimal, ideally less than 15%. The new content should feel as though it was originally created for this specific format.

[1. SOURCE CONTENT - The "What"]
(This is the information you want to communicate.)

${idea}

[2. STRUCTURAL TEMPLATE - The "How"]
(This is the format, style, and narrative structure you want to follow.)

Hook: ${templateHook}

Bridge: ${templateBridge}

Golden Nugget: ${templateNugget}

What To Act: ${templateWta}

EXECUTION INSTRUCTIONS:
Your task is to adapt my source content into a script using the provided template. Follow these instructions precisely to ensure a high-quality, coherent, and effective result.

1. Analyze and Deconstruct
First, thoroughly analyze the chosen template's components (hook, bridge, nugget, wta). Identify its core narrative function (e.g., is it a personal story, a persuasion framework, a step-by-step guide, or a philosophical lesson?). Concurrently, analyze the core components of my source content to identify the main problem, solution, key facts, and central message.

2. Interpret and Map Concepts
Your primary goal is to logically map the key ideas from my source content onto the [placeholders] in the template. Do not perform a literal word replacement; interpret the contextual meaning of each placeholder (e.g., [Negative Consequence], [Desired Outcome]) and fill it with the most fitting concept from my source material.

3. Adopt the Narrative Voice
You must adopt the specific tone and narrative voice implied by the template's structure and language. If the template is written in the first person, your script should be too. If it is authoritative, your tone should be confident. The final output must feel authentic to the template's style.

4. Ensure Cohesion and Flow
Assemble the filled hook, bridge, nugget, and wta sections into a single, seamless script. The transition from one section to the next must be smooth and natural. The final script should not sound like a form that has been filled out, but like a story or argument that flows logically from beginning to end.

5. Replace ALL Placeholders
CRITICAL: Any text in square brackets [like this] in the template are PLACEHOLDERS that MUST be replaced with actual, specific content from your source material. NEVER leave any square brackets or placeholder text in your final output. Every [placeholder] must become real words.

Target approximately ${targetWordCount} words for a ${length}-second read.

${negativeKeywordInstruction}

FINAL CHECK: Ensure NO square brackets [like this] remain in your response.`;

  const jsonSchema = `Return your response in this exact JSON format:
{
  "hook": "Your adapted hook section with all placeholders replaced and narrative voice adopted",
  "bridge": "Your adapted bridge section with smooth transitions and cohesive flow", 
  "goldenNugget": "Your adapted golden nugget section with core concepts mapped from source content",
  "wta": "Your adapted what-to-act section with clear, actionable guidance"
}`;

  return addJsonFormatting(basePrompt, jsonSchema);
} 