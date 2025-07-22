/**
 * Input validation with early exit for script generation
 * Prevents expensive processing of malformed requests
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
  suggestions?: string[];
}

export interface ScriptGenerationRequest {
  idea: string;
  length: string;
  type?: string;
  tone?: string;
  ideaContext?: {
    selectedNotes: Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
    }>;
    contextMode: string;
  };
}

/**
 * Comprehensive input validation for script generation requests
 * Returns validation result with early exit on first failure
 */
export function validateScriptGenerationInput(input: any): ValidationResult {
  // Type guard: Check if input is an object
  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      error: "Request body must be a valid JSON object",
      field: "body",
    };
  }

  // Required field: idea
  if (!input.idea) {
    return {
      isValid: false,
      error: "Idea is required",
      field: "idea",
      suggestions: ["Provide a topic or concept for the script"],
    };
  }

  // Type validation: idea must be string
  if (typeof input.idea !== "string") {
    return {
      isValid: false,
      error: "Idea must be a string",
      field: "idea",
    };
  }

  // Length validation: idea content
  const trimmedIdea = input.idea.trim();
  if (trimmedIdea.length < 10) {
    return {
      isValid: false,
      error: "Idea must be at least 10 characters long",
      field: "idea",
      suggestions: ["Provide more detail about your script topic"],
    };
  }

  if (trimmedIdea.length > 1000) {
    return {
      isValid: false,
      error: "Idea must be less than 1000 characters",
      field: "idea",
      suggestions: ["Keep your idea concise and focused"],
    };
  }

  // Required field: length
  if (!input.length) {
    return {
      isValid: false,
      error: "Length is required",
      field: "length",
      suggestions: ["Specify script duration: 15, 20, 30, 45, 60, or 90 seconds"],
    };
  }

  // Type validation: length must be string or number
  if (typeof input.length !== "string" && typeof input.length !== "number") {
    return {
      isValid: false,
      error: "Length must be a string or number",
      field: "length",
    };
  }

  // Enum validation: length values
  const validLengths = ["15", "20", "30", "45", "60", "90"];
  const lengthStr = String(input.length);
  if (!validLengths.includes(lengthStr)) {
    return {
      isValid: false,
      error: "Length must be one of: 15, 20, 30, 45, 60, 90 seconds",
      field: "length",
      suggestions: [`Valid options: ${validLengths.join(", ")}`],
    };
  }

  // Optional field validation: type
  if (input.type !== undefined) {
    if (typeof input.type !== "string") {
      return {
        isValid: false,
        error: "Type must be a string",
        field: "type",
      };
    }

    const validTypes = ["speed", "educational", "viral"];
    if (!validTypes.includes(input.type)) {
      return {
        isValid: false,
        error: "Type must be one of: speed, educational, viral",
        field: "type",
        suggestions: [`Valid options: ${validTypes.join(", ")}`],
      };
    }
  }

  // Optional field validation: tone
  if (input.tone !== undefined) {
    if (typeof input.tone !== "string") {
      return {
        isValid: false,
        error: "Tone must be a string",
        field: "tone",
      };
    }

    const validTones = ["casual", "professional", "energetic", "educational"];
    if (!validTones.includes(input.tone)) {
      return {
        isValid: false,
        error: "Tone must be one of: casual, professional, energetic, educational",
        field: "tone",
        suggestions: [`Valid options: ${validTones.join(", ")}`],
      };
    }
  }

  // Complex field validation: ideaContext
  if (input.ideaContext !== undefined) {
    if (typeof input.ideaContext !== "object" || input.ideaContext === null) {
      return {
        isValid: false,
        error: "IdeaContext must be an object",
        field: "ideaContext",
      };
    }

    // Validate selectedNotes
    if (input.ideaContext.selectedNotes !== undefined) {
      if (!Array.isArray(input.ideaContext.selectedNotes)) {
        return {
          isValid: false,
          error: "SelectedNotes must be an array",
          field: "ideaContext.selectedNotes",
        };
      }

      // Validate each note in the array
      for (let i = 0; i < input.ideaContext.selectedNotes.length; i++) {
        const note = input.ideaContext.selectedNotes[i];
        if (!note || typeof note !== "object") {
          return {
            isValid: false,
            error: `Note at index ${i} must be an object`,
            field: `ideaContext.selectedNotes[${i}]`,
          };
        }

        // Required note fields
        const requiredNoteFields = ["id", "title", "content"];
        for (const field of requiredNoteFields) {
          if (!note[field] || typeof note[field] !== "string") {
            return {
              isValid: false,
              error: `Note ${field} is required and must be a string`,
              field: `ideaContext.selectedNotes[${i}].${field}`,
            };
          }
        }

        // Validate tags if present
        if (note.tags !== undefined && !Array.isArray(note.tags)) {
          return {
            isValid: false,
            error: `Note tags must be an array`,
            field: `ideaContext.selectedNotes[${i}].tags`,
          };
        }
      }
    }

    // Validate contextMode
    if (input.ideaContext.contextMode !== undefined) {
      if (typeof input.ideaContext.contextMode !== "string") {
        return {
          isValid: false,
          error: "ContextMode must be a string",
          field: "ideaContext.contextMode",
        };
      }

      const validContextModes = ["inspiration", "reference", "template", "comprehensive"];
      if (!validContextModes.includes(input.ideaContext.contextMode)) {
        return {
          isValid: false,
          error: "ContextMode must be one of: inspiration, reference, template, comprehensive",
          field: "ideaContext.contextMode",
          suggestions: [`Valid options: ${validContextModes.join(", ")}`],
        };
      }
    }
  }

  // Content quality checks (early warnings for better UX)
  const suspiciousPatterns = [/^test\s*$/i, /^hello\s*$/i, /^hi\s*$/i, /^\d+$/, /^[a-z]$/i];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedIdea)) {
      return {
        isValid: false,
        error: "Please provide a more descriptive idea for your script",
        field: "idea",
        suggestions: [
          "Describe a specific topic, problem, or concept",
          "Example: 'How to improve productivity using time-blocking'",
        ],
      };
    }
  }

  // All validations passed
  return {
    isValid: true,
  };
}

/**
 * Fast type guard to check if request has required fields
 * Use this for the fastest possible validation
 */
export function hasRequiredFields(input: any): input is ScriptGenerationRequest {
  return (
    input &&
    typeof input === "object" &&
    typeof input.idea === "string" &&
    input.idea.trim().length >= 10 &&
    (typeof input.length === "string" || typeof input.length === "number") &&
    ["15", "20", "30", "45", "60", "90"].includes(String(input.length))
  );
}

/**
 * Quick content safety check
 */
export function isContentSafe(idea: string): boolean {
  const unsafePatterns = [
    /porn|sex|nude|naked/i,
    /\bhate\s+(speech|crime|group)/i, // Only hate speech, not general "hate"
    /racist|terrorism/i,
    /kill|murder|violence/i,
    /drug|cocaine|heroin/i,
  ];

  const matchedPattern = unsafePatterns.find((pattern) => pattern.test(idea));

  if (matchedPattern) {
    console.log(`🚨 [SAFETY] Content blocked by pattern: ${matchedPattern} in "${idea.substring(0, 100)}"`);
    return false;
  }

  console.log(`✅ [SAFETY] Content passed safety check: "${idea.substring(0, 50)}"`);
  return true;
}

/**
 * Sanitize content to avoid Gemini safety triggers while preserving meaning
 * Replaces problematic phrases that trigger commercial content filters
 */
export function sanitizeForGemini(idea: string): string {
  const sanitizePatterns = [
    // AI solution patterns that trigger commercial content filters
    {
      pattern: /\bAI solution\b/gi,
      replacement: "new tool",
    },
    {
      pattern: /\bAI (tool|software|platform|app)\b/gi,
      replacement: "digital $1",
    },
    // Exaggerated productivity claims
    {
      pattern: /completely changed my workflow/gi,
      replacement: "improved my process",
    },
    {
      pattern: /revolutionized my (work|productivity|business)/gi,
      replacement: "helped my $1",
    },
    {
      pattern: /game-changing (AI|tool|solution)/gi,
      replacement: "helpful $1",
    },
    // Generic promotional language that triggers filters
    {
      pattern: /this (amazing|incredible|revolutionary) (AI|tool)/gi,
      replacement: "this useful $2",
    },
  ];

  let sanitized = idea;

  for (const { pattern, replacement } of sanitizePatterns) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

/**
 * Estimate processing complexity to help with early resource planning
 */
export function estimateComplexity(input: ScriptGenerationRequest): "low" | "medium" | "high" {
  let complexity = 0;

  // Base complexity
  if (input.idea.length > 100) complexity += 1;
  if (input.idea.length > 300) complexity += 1;

  // Type complexity
  if (input.type === "educational") complexity += 1;
  if (input.type === "viral") complexity += 2;

  // Context complexity
  if (input.ideaContext?.selectedNotes) {
    complexity += Math.min(input.ideaContext.selectedNotes.length, 3);
  }

  // Duration complexity
  const duration = parseInt(String(input.length));
  if (duration >= 60) complexity += 1;
  if (duration >= 90) complexity += 1;

  if (complexity <= 2) return "low";
  if (complexity <= 5) return "medium";
  return "high";
}
