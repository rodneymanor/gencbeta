/**
 * Idea context prompt modifier for script generation
 * Integrates selected notes/ideas into the main prompt for enhanced AI context
 */

import { Note } from "@/lib/services/notes-service";

export interface IdeaContextConfig {
  selectedNotes: Note[];
  contextMode: "inspiration" | "reference" | "template" | "comprehensive";
  maxContextLength?: number;
  includeMetadata?: boolean;
}

/**
 * Generate idea context sub-prompt that provides AI with relevant notes/ideas
 */
export function createIdeaContextSubPrompt(config: IdeaContextConfig): string {
  const { selectedNotes, contextMode, maxContextLength = 2000, includeMetadata = true } = config;

  if (!selectedNotes || selectedNotes.length === 0) {
    return "";
  }

  const contextIntro = getContextIntroduction(contextMode);
  const formattedNotes = formatNotesForContext(selectedNotes, maxContextLength, includeMetadata);
  const contextGuidelines = getContextGuidelines(contextMode);

  return `
${contextIntro}

${formattedNotes}

${contextGuidelines}

INTEGRATION INSTRUCTIONS:
- Use the provided context as ${getIntegrationStyle(contextMode)}
- Maintain your own creative voice while leveraging these insights
- Don't copy directly - instead, let these ideas inform and enhance your response
- If relevant patterns emerge from the context, incorporate them naturally
`.trim();
}

/**
 * Get context introduction based on mode
 */
function getContextIntroduction(mode: IdeaContextConfig["contextMode"]): string {
  switch (mode) {
    case "inspiration":
      return `CREATIVE INSPIRATION CONTEXT:
The following are relevant ideas and insights from the user's idea library to spark creativity and provide directional inspiration:`;

    case "reference":
      return `REFERENCE MATERIAL CONTEXT:
The following are specific notes and references the user wants you to consider while generating content:`;

    case "template":
      return `TEMPLATE & STRUCTURE CONTEXT:
The following are examples of successful formats, structures, and approaches from the user's library:`;

    case "comprehensive":
      return `COMPREHENSIVE CONTEXT LIBRARY:
The following represents relevant knowledge, insights, and creative direction from the user's curated idea collection:`;

    default:
      return "CONTEXT FROM USER'S IDEA LIBRARY:";
  }
}

/**
 * Format notes for AI context with length limits
 */
function formatNotesForContext(notes: Note[], maxLength: number, includeMetadata: boolean): string {
  let formattedContext = "";
  let currentLength = 0;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];

    // Format note header
    const header = includeMetadata
      ? `[NOTE ${i + 1}: "${note.title}" | Tags: ${note.tags.join(", ") || "none"}]`
      : `[NOTE ${i + 1}: "${note.title}"]`;

    // Get clean content (remove markdown headers, excessive formatting)
    const cleanContent = cleanNoteContent(note.content);

    const noteSection = `
${header}
${cleanContent}
---
`;

    // Check if adding this note would exceed the limit
    if (currentLength + noteSection.length > maxLength) {
      // If this is the first note and it's too long, truncate it
      if (i === 0) {
        const truncatedContent = cleanContent.substring(0, maxLength - header.length - 100);
        formattedContext += `
${header}
${truncatedContent}...
[CONTENT TRUNCATED]
---
`;
      }
      break;
    }

    formattedContext += noteSection;
    currentLength += noteSection.length;
  }

  if (formattedContext === "") {
    return "[No context notes provided or all notes exceeded length limits]";
  }

  return formattedContext.trim();
}

/**
 * Clean note content for AI consumption
 */
function cleanNoteContent(content: string): string {
  return (
    content
      // Remove excessive markdown headers
      .replace(/^#{1,6}\s+/gm, "")
      // Clean up multiple line breaks
      .replace(/\n{3,}/g, "\n\n")
      // Remove empty bullet points
      .replace(/^\s*[-*+]\s*$/gm, "")
      // Trim whitespace
      .trim()
  );
}

/**
 * Get context-specific guidelines for AI integration
 */
function getContextGuidelines(mode: IdeaContextConfig["contextMode"]): string {
  switch (mode) {
    case "inspiration":
      return `INSPIRATION MODE GUIDELINES:
- Use these ideas as creative springboards, not rigid templates
- Look for themes, emotions, and approaches that resonate
- Combine insights from multiple notes to create something new
- Let the context inspire tone, angle, or creative direction`;

    case "reference":
      return `REFERENCE MODE GUIDELINES:
- Treat these as factual references and specific guidance
- Incorporate relevant details, frameworks, or approaches mentioned
- Maintain accuracy to any specific information provided
- Use as authoritative source material for your response`;

    case "template":
      return `TEMPLATE MODE GUIDELINES:
- Analyze the structure and format patterns in these examples
- Adapt successful frameworks to the current request
- Maintain the core structural elements that make these effective
- Scale and modify templates to fit the specific requirements`;

    case "comprehensive":
      return `COMPREHENSIVE MODE GUIDELINES:
- Synthesize insights across all provided context
- Balance inspiration, reference material, and structural guidance
- Create connections between different notes when relevant
- Use the full depth of context to inform your creative process`;

    default:
      return "Use the provided context to enhance and inform your response.";
  }
}

/**
 * Get integration style description
 */
function getIntegrationStyle(mode: IdeaContextConfig["contextMode"]): string {
  switch (mode) {
    case "inspiration":
      return "creative fuel and directional guidance";
    case "reference":
      return "factual foundation and specific guidance";
    case "template":
      return "structural blueprint and format reference";
    case "comprehensive":
      return "comprehensive knowledge base and creative foundation";
    default:
      return "supporting context";
  }
}

/**
 * Create variables for prompt template integration
 */
export function createIdeaContextVariables(config: IdeaContextConfig): {
  ideaContext: string;
  hasIdeaContext: boolean;
  ideaContextMode: string;
  selectedNotesCount: number;
} {
  const ideaContext = createIdeaContextSubPrompt(config);

  return {
    ideaContext,
    hasIdeaContext: ideaContext.length > 0,
    ideaContextMode: config.contextMode,
    selectedNotesCount: config.selectedNotes.length,
  };
}

/**
 * Validate idea context configuration
 */
export function validateIdeaContext(config: IdeaContextConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.selectedNotes) {
    errors.push("Selected notes array is required");
  } else if (config.selectedNotes.length === 0) {
    errors.push("At least one note must be selected");
  } else if (config.selectedNotes.length > 10) {
    errors.push("Maximum 10 notes can be selected for context");
  }

  if (!["inspiration", "reference", "template", "comprehensive"].includes(config.contextMode)) {
    errors.push("Invalid context mode");
  }

  if (config.maxContextLength && (config.maxContextLength < 100 || config.maxContextLength > 5000)) {
    errors.push("Max context length must be between 100 and 5000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get recommended context mode based on note analysis
 */
export function getRecommendedContextMode(notes: Note[]): IdeaContextConfig["contextMode"] {
  if (notes.length === 0) return "inspiration";

  // Analyze note content to suggest best mode
  const hasStructuredContent = notes.some(
    (note) =>
      note.content.includes("##") ||
      note.content.includes("1.") ||
      note.content.includes("- ") ||
      note.title.toLowerCase().includes("template") ||
      note.title.toLowerCase().includes("structure") ||
      note.title.toLowerCase().includes("framework"),
  );

  const hasReferenceContent = notes.some(
    (note) =>
      note.content.includes("http") ||
      note.content.includes("data:") ||
      note.content.includes("source:") ||
      note.tags.includes("reference") ||
      note.tags.includes("research") ||
      note.tags.includes("data"),
  );

  const noteCount = notes.length;

  if (noteCount >= 5) return "comprehensive";
  if (hasStructuredContent) return "template";
  if (hasReferenceContent) return "reference";
  return "inspiration";
}
