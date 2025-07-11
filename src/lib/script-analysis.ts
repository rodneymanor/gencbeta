export interface ScriptElement {
  type: "hook" | "bridge" | "golden-nugget" | "wta";
  startIndex: number;
  endIndex: number;
  text: string;
  confidence: number;
  suggestions?: string[];
}

export interface ScriptAnalysis {
  hooks: ScriptElement[];
  bridges: ScriptElement[];
  goldenNuggets: ScriptElement[];
  wtas: ScriptElement[];
}

export interface HighlightConfig {
  hooks: boolean;
  bridges: boolean;
  goldenNuggets: boolean;
  wtas: boolean;
}

export interface ContextualAction {
  id: string;
  type: "improve_hook" | "make_question" | "strengthen_bridge" | "enhance_wta" | "custom";
  label: string;
  icon: string;
  description: string;
}

// Helper function to process hooks
const processHooks = (sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) => {
  if (!config.hooks) return;

  sentences.forEach((sentence, index) => {
    const trimmedSentence = sentence.trim();
    const startIndex = text.indexOf(trimmedSentence);
    const endIndex = startIndex + trimmedSentence.length;

    if (index < 2 || isHookPattern(trimmedSentence)) {
      analysis.hooks.push({
        type: "hook",
        startIndex,
        endIndex,
        text: trimmedSentence,
        confidence: calculateHookConfidence(trimmedSentence, index),
        suggestions: generateHookSuggestions(),
      });
    }
  });
};

// Helper function to process bridges
const processBridges = (sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) => {
  if (!config.bridges) return;

  sentences.forEach((sentence) => {
    const trimmedSentence = sentence.trim();
    const startIndex = text.indexOf(trimmedSentence);
    const endIndex = startIndex + trimmedSentence.length;

    if (isBridgePattern(trimmedSentence)) {
      analysis.bridges.push({
        type: "bridge",
        startIndex,
        endIndex,
        text: trimmedSentence,
        confidence: calculateBridgeConfidence(trimmedSentence),
        suggestions: generateBridgeSuggestions(),
      });
    }
  });
};

// Helper function to process golden nuggets
const processGoldenNuggets = (sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) => {
  if (!config.goldenNuggets) return;

  sentences.forEach((sentence) => {
    const trimmedSentence = sentence.trim();
    const startIndex = text.indexOf(trimmedSentence);
    const endIndex = startIndex + trimmedSentence.length;

    if (isGoldenNuggetPattern(trimmedSentence)) {
      analysis.goldenNuggets.push({
        type: "golden-nugget",
        startIndex,
        endIndex,
        text: trimmedSentence,
        confidence: calculateGoldenNuggetConfidence(trimmedSentence),
        suggestions: generateGoldenNuggetSuggestions(),
      });
    }
  });
};

// Helper function to process WTAs
const processWTAs = (sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) => {
  if (!config.wtas) return;

  sentences.forEach((sentence, index) => {
    const trimmedSentence = sentence.trim();
    const startIndex = text.indexOf(trimmedSentence);
    const endIndex = startIndex + trimmedSentence.length;

    if (index >= sentences.length - 2 || isWtaPattern(trimmedSentence)) {
      analysis.wtas.push({
        type: "wta",
        startIndex,
        endIndex,
        text: trimmedSentence,
        confidence: calculateWtaConfidence(trimmedSentence, index, sentences.length),
        suggestions: generateWtaSuggestions(),
      });
    }
  });
};

// Pattern-based analysis for script elements
export const analyzeScriptElements = async (text: string, config: HighlightConfig): Promise<ScriptAnalysis> => {
  const analysis: ScriptAnalysis = {
    hooks: [],
    bridges: [],
    goldenNuggets: [],
    wtas: [],
  };

  if (!text.trim()) return analysis;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Process each element type using helper functions
  processHooks(sentences, text, config, analysis);
  processBridges(sentences, text, config, analysis);
  processGoldenNuggets(sentences, text, config, analysis);
  processWTAs(sentences, text, config, analysis);

  return analysis;
};

// Hook pattern detection
const isHookPattern = (text: string): boolean => {
  const hookPatterns = [
    /^(what if|imagine|did you know|here's why|the secret)/i,
    /\?$/,
    /^(stop|wait|hold on)/i,
    /^(this will|you won't believe)/i,
    /^(everyone thinks|most people)/i,
  ];

  return hookPatterns.some((pattern) => pattern.test(text));
};

// Bridge pattern detection
const isBridgePattern = (text: string): boolean => {
  const bridgePatterns = [
    /^(but|however|meanwhile|now|here's the thing)/i,
    /^(so|therefore|that's why|this means)/i,
    /^(let me explain|here's how|the reason)/i,
    /^(first|second|third|next|finally)/i,
    /^(on the other hand|in contrast|alternatively)/i,
  ];

  return bridgePatterns.some((pattern) => pattern.test(text));
};

// Golden nugget pattern detection
const isGoldenNuggetPattern = (text: string): boolean => {
  const nuggetPatterns = [
    /\d+%|\d+x|\$\d+/,
    /^(the key is|here's the secret|pro tip)/i,
    /^(studies show|research proves|data reveals)/i,
    /^(remember this|keep in mind|important)/i,
    /^(bonus|extra|advanced)/i,
  ];

  return nuggetPatterns.some((pattern) => pattern.test(text));
};

// WTA pattern detection
const isWtaPattern = (text: string): boolean => {
  const wtaPatterns = [
    /^(click|tap|swipe|visit|go to|check out)/i,
    /^(subscribe|follow|like|share|comment)/i,
    /^(download|get|try|start|join)/i,
    /^(buy|purchase|order|shop)/i,
    /^(learn more|find out|discover)/i,
  ];

  return wtaPatterns.some((pattern) => pattern.test(text));
};

// Confidence calculation functions
const calculateHookConfidence = (text: string, position: number): number => {
  let confidence = position === 0 ? 0.9 : 0.7;
  if (text.includes("?")) confidence += 0.1;
  if (text.toLowerCase().includes("what if")) confidence += 0.1;
  return Math.min(confidence, 1.0);
};

const calculateBridgeConfidence = (text: string): number => {
  const bridgeWords = ["but", "however", "so", "therefore", "now", "here"];
  const hasTransition = bridgeWords.some((word) => text.toLowerCase().startsWith(word));
  return hasTransition ? 0.8 : 0.6;
};

const calculateGoldenNuggetConfidence = (text: string): number => {
  let confidence = 0.6;
  if (/\d+%/.test(text)) confidence += 0.2;
  if (/studies show|research|data/i.test(text)) confidence += 0.1;
  return Math.min(confidence, 1.0);
};

const calculateWtaConfidence = (text: string, position: number, total: number): number => {
  let confidence = position >= total - 2 ? 0.8 : 0.6;
  const actionWords = ["try", "do", "start", "comment", "like", "share", "subscribe"];
  const hasAction = actionWords.some((word) => text.toLowerCase().includes(word));
  if (hasAction) confidence += 0.1;
  return Math.min(confidence, 1.0);
};

// Suggestion generators
const generateHookSuggestions = (): string[] => {
  return ["Make it more intriguing", "Add a question", "Include a surprising fact", "Create urgency"];
};

const generateBridgeSuggestions = (): string[] => {
  return ["Strengthen the connection", "Make the transition smoother", "Add more context", "Clarify the relationship"];
};

const generateGoldenNuggetSuggestions = (): string[] => {
  return ["Add supporting data", "Make it more actionable", "Emphasize the value", "Provide an example"];
};

const generateWtaSuggestions = (): string[] => {
  return ["Make it more compelling", "Add urgency", "Be more specific", "Include a benefit"];
};

// Generate contextual actions for an element
export const generateContextualActions = (element: ScriptElement): ContextualAction[] => {
  const actions: ContextualAction[] = [];

  // Add common action
  actions.push({
    id: "custom",
    type: "custom",
    label: "Custom Edit",
    icon: "✏️",
    description: "Make a custom edit to this text",
  });

  // Add element-specific actions
  switch (element.type) {
    case "hook":
      actions.push(
        {
          id: "improve_hook",
          type: "improve_hook",
          label: "Improve Hook",
          icon: "🪝",
          description: "Make this hook more engaging and attention-grabbing",
        },
        {
          id: "make_question",
          type: "make_question",
          label: "Make Question",
          icon: "❓",
          description: "Transform this into a compelling question",
        },
      );
      break;

    case "bridge":
      actions.push({
        id: "strengthen_bridge",
        type: "strengthen_bridge",
        label: "Strengthen Bridge",
        icon: "🌉",
        description: "Improve this transition or connection",
      });
      break;

    case "golden-nugget":
      actions.push({
        id: "enhance_nugget",
        type: "custom",
        label: "Enhance Value",
        icon: "💎",
        description: "Make this insight more valuable and actionable",
      });
      break;

    case "wta":
      actions.push({
        id: "enhance_wta",
        type: "enhance_wta",
        label: "Enhance CTA",
        icon: "🎯",
        description: "Make this call-to-action more compelling",
      });
      break;
  }

  return actions;
};

// Generate highlights for overlay
export const generateHighlights = (analysis: ScriptAnalysis) => {
  const highlights: Array<{
    id: string;
    type: ScriptElement["type"];
    startIndex: number;
    endIndex: number;
    confidence: number;
  }> = [];

  // Collect all elements
  const allElements = [...analysis.hooks, ...analysis.bridges, ...analysis.goldenNuggets, ...analysis.wtas];

  allElements.forEach((element, index) => {
    highlights.push({
      id: `${element.type}-${index}`,
      type: element.type,
      startIndex: element.startIndex,
      endIndex: element.endIndex,
      confidence: element.confidence,
    });
  });

  return highlights;
};

// Get color for element type
const getElementColor = (type: ScriptElement["type"]): string => {
  switch (type) {
    case "hook":
      return "hsl(var(--script-hook))";
    case "bridge":
      return "hsl(var(--script-bridge))";
    case "golden-nugget":
      return "hsl(var(--script-golden-nugget))";
    case "wta":
      return "hsl(var(--script-wta))";
    default:
      return "hsl(var(--muted))";
  }
};
