/**
 * Robust JSON extraction utility that handles markdown fences and surrounding text
 */

export interface JsonExtractionResult {
  success: boolean;
  data?: any;
  error?: string;
  rawContent?: string;
}

/**
 * Extracts JSON from text that may be wrapped in markdown code blocks or have surrounding text
 */
function extractJson(text: string): string | null {
  // Grab everything between the first "{" and the last "}"
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  return first !== -1 && last !== -1 ? text.slice(first, last + 1) : null;
}

/**
 * Safely parses JSON from AI response with comprehensive error handling
 */
export function parseStructuredResponse(rawContent: string, context: string = "unknown"): JsonExtractionResult {
  try {
    console.log(`[JsonExtractor] Parsing ${context} response:`, rawContent.substring(0, 200) + "...");

    // First try direct JSON parsing (for clean responses)
    try {
      const parsed = JSON.parse(rawContent.trim());
      console.log(`✅ [JsonExtractor] Direct JSON parse successful for ${context}`);
      return {
        success: true,
        data: parsed,
        rawContent,
      };
    } catch (directParseError) {
      // Direct parsing failed, try extraction
    }

    // Extract JSON from potentially wrapped content
    const extractedJson = extractJson(rawContent);
    if (!extractedJson) {
      console.warn(`❌ [JsonExtractor] No JSON found in ${context} response`);
      return {
        success: false,
        error: "No JSON object found in response",
        rawContent,
      };
    }

    console.log(`[JsonExtractor] Extracted JSON for ${context}:`, extractedJson.substring(0, 200) + "...");

    const parsed = JSON.parse(extractedJson);
    console.log(`✅ [JsonExtractor] JSON extraction and parse successful for ${context}`);

    return {
      success: true,
      data: parsed,
      rawContent,
    };
  } catch (error) {
    console.error(`❌ [JsonExtractor] Failed to parse ${context} response:`, error);
    console.error(`[JsonExtractor] Raw content that failed:`, rawContent);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown parsing error",
      rawContent,
    };
  }
}

/**
 * Creates structured script elements from parsed JSON data
 */
export function createScriptElements(data: any): {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
} {
  return {
    hook: data.hook ?? "",
    bridge: data.bridge ?? "",
    goldenNugget: data.goldenNugget ?? "",
    wta: data.wta ?? "",
  };
}

/**
 * Combines script elements into readable content
 */
export function combineScriptElements(elements: {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}): string {
  return [elements.hook, elements.bridge, elements.goldenNugget, elements.wta].filter(Boolean).join("\n\n");
}
