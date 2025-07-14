/**
 * Video Analyzer Service
 * Centralized video content analysis for Hook/Bridge/Nugget/WTA extraction
 */

import type { ContentMetadata, EngagementMetrics } from "./metadata";
import type { Platform } from "./platform-detector";

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

export interface VideoAnalysisResult {
  scriptAnalysis: ScriptAnalysis;
  contentScore: number;
  viralPotential: number;
  engagementRate: number;
  recommendations: string[];
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

/**
 * Analyzes video content for script elements and engagement potential
 * @param transcript - Video transcript
 * @param metadata - Content metadata
 * @param metrics - Engagement metrics
 * @param config - Analysis configuration
 * @returns Comprehensive video analysis
 */
export async function analyzeVideoContent(
  transcript: string,
  metadata: ContentMetadata,
  metrics: EngagementMetrics,
  config: HighlightConfig = { hooks: true, bridges: true, goldenNuggets: true, wtas: true },
): Promise<VideoAnalysisResult> {
  console.log("🔍 [ANALYZER] Starting video content analysis...");

  const scriptAnalysis = await analyzeScriptElements(transcript, config);
  const contentScore = calculateContentScore(transcript, metadata, metrics);
  const viralPotential = calculateViralPotential(metadata, metrics);
  const engagementRate = calculateEngagementRate(metrics);
  const recommendations = generateRecommendations(scriptAnalysis, metadata, metrics);

  return {
    scriptAnalysis,
    contentScore,
    viralPotential,
    engagementRate,
    recommendations,
  };
}

/**
 * Analyzes script text for Hook/Bridge/Nugget/WTA elements
 * @param text - Script text to analyze
 * @param config - Analysis configuration
 * @returns Script analysis with identified elements
 */
export async function analyzeScriptElements(text: string, config: HighlightConfig): Promise<ScriptAnalysis> {
  const analysis: ScriptAnalysis = {
    hooks: [],
    bridges: [],
    goldenNuggets: [],
    wtas: [],
  };

  if (!text.trim()) return analysis;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Process each element type
  processHooks(sentences, text, config, analysis);
  processBridges(sentences, text, config, analysis);
  processGoldenNuggets(sentences, text, config, analysis);
  processWTAs(sentences, text, config, analysis);

  return analysis;
}

/**
 * Processes hooks in the script
 */
function processHooks(sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) {
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
}

/**
 * Processes bridges in the script
 */
function processBridges(sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) {
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
}

/**
 * Processes golden nuggets in the script
 */
function processGoldenNuggets(sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) {
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
}

/**
 * Processes WTAs (What To Action) in the script
 */
function processWTAs(sentences: string[], text: string, config: HighlightConfig, analysis: ScriptAnalysis) {
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
}

// Pattern detection functions
function isHookPattern(text: string): boolean {
  const hookPatterns = [
    /^(what if|imagine|did you know|here's why|the secret)/i,
    /\?$/,
    /^(stop|wait|hold on)/i,
    /^(this will|you won't believe)/i,
    /^(everyone thinks|most people)/i,
  ];

  return hookPatterns.some((pattern) => pattern.test(text));
}

function isBridgePattern(text: string): boolean {
  const bridgePatterns = [
    /^(but|however|meanwhile|now|here's the thing)/i,
    /^(so|therefore|that's why|this means)/i,
    /^(let me explain|here's how|the reason)/i,
    /^(first|second|third|next|finally)/i,
    /^(on the other hand|in contrast|alternatively)/i,
  ];

  return bridgePatterns.some((pattern) => pattern.test(text));
}

function isGoldenNuggetPattern(text: string): boolean {
  const nuggetPatterns = [
    /\d+%|\d+x|\$\d+/,
    /^(the key is|here's the secret|pro tip)/i,
    /^(studies show|research proves|data reveals)/i,
    /^(remember this|keep in mind|important)/i,
    /^(bonus|extra|advanced)/i,
  ];

  return nuggetPatterns.some((pattern) => pattern.test(text));
}

function isWtaPattern(text: string): boolean {
  const wtaPatterns = [
    /^(click|tap|swipe|visit|go to|check out)/i,
    /^(subscribe|follow|like|share|comment)/i,
    /^(download|get|try|start|join)/i,
    /^(buy|purchase|order|shop)/i,
    /^(learn more|find out|discover)/i,
  ];

  return wtaPatterns.some((pattern) => pattern.test(text));
}

// Confidence calculation functions
function calculateHookConfidence(text: string, position: number): number {
  let confidence = position === 0 ? 0.9 : 0.7;
  if (text.includes("?")) confidence += 0.1;
  if (text.toLowerCase().includes("what if")) confidence += 0.1;
  return Math.min(confidence, 1.0);
}

function calculateBridgeConfidence(text: string): number {
  let confidence = 0.6;
  if (text.toLowerCase().includes("but")) confidence += 0.2;
  if (text.toLowerCase().includes("however")) confidence += 0.2;
  return Math.min(confidence, 1.0);
}

function calculateGoldenNuggetConfidence(text: string): number {
  let confidence = 0.5;
  if (/\d+%|\d+x|\$\d+/.test(text)) confidence += 0.3;
  if (text.toLowerCase().includes("secret")) confidence += 0.2;
  return Math.min(confidence, 1.0);
}

function calculateWtaConfidence(text: string, position: number, total: number): number {
  let confidence = position >= total - 2 ? 0.8 : 0.6;
  if (text.toLowerCase().includes("click") || text.toLowerCase().includes("subscribe")) confidence += 0.2;
  return Math.min(confidence, 1.0);
}

// Suggestion generation functions
function generateHookSuggestions(): string[] {
  return [
    "Start with a question to grab attention",
    "Use 'What if' scenarios",
    "Include surprising statistics",
    "Create curiosity gaps",
  ];
}

function generateBridgeSuggestions(): string[] {
  return [
    "Use transition words like 'but', 'however'",
    "Connect ideas with 'so', 'therefore'",
    "Explain the 'why' behind your point",
    "Use numbered lists for clarity",
  ];
}

function generateGoldenNuggetSuggestions(): string[] {
  return [
    "Include specific numbers and percentages",
    "Share actionable tips",
    "Use 'pro tip' or 'secret' language",
    "Reference studies or data",
  ];
}

function generateWtaSuggestions(): string[] {
  return [
    "Use clear action verbs",
    "Make it easy to follow through",
    "Include urgency or scarcity",
    "Provide multiple engagement options",
  ];
}

/**
 * Calculates overall content score
 */
function calculateContentScore(transcript: string, metadata: ContentMetadata, metrics: EngagementMetrics): number {
  let score = 0;

  // Transcript quality (30%)
  const transcriptLength = transcript.length;
  score += Math.min(transcriptLength / 100, 30);

  // Hashtag optimization (20%)
  score += Math.min(metadata.hashtags.length * 2, 20);

  // Engagement rate (30%)
  const engagementRate = calculateEngagementRate(metrics);
  score += Math.min(engagementRate * 3, 30);

  // Content completeness (20%)
  if (metadata.description) score += 10;
  if (metadata.duration) score += 5;
  if (metadata.author !== "Unknown") score += 5;

  return Math.min(score, 100);
}

/**
 * Calculates viral potential score
 */
function calculateViralPotential(metadata: ContentMetadata, metrics: EngagementMetrics): number {
  const engagementRate = calculateEngagementRate(metrics);
  const hashtagCount = metadata.hashtags.length;
  const hasDescription = metadata.description.length > 0;

  let score = 0;

  // Engagement rate weight (40%)
  score += Math.min(engagementRate * 2, 40);

  // Hashtag optimization weight (30%)
  score += Math.min(hashtagCount * 3, 30);

  // Content completeness weight (20%)
  score += hasDescription ? 20 : 0;

  // Platform-specific factors (10%)
  switch (metadata.platform) {
    case "tiktok":
      score += metrics.shares > 100 ? 10 : 0;
      break;
    case "instagram":
      score += metrics.saves > 50 ? 10 : 0;
      break;
    case "youtube":
      score += metrics.comments > 20 ? 10 : 0;
      break;
  }

  return Math.min(score, 100);
}

/**
 * Calculates engagement rate
 */
function calculateEngagementRate(metrics: EngagementMetrics): number {
  const { likes, views, shares, comments } = metrics;

  if (views === 0) return 0;

  const totalEngagement = likes + shares + comments;
  return (totalEngagement / views) * 100;
}

/**
 * Generates content recommendations
 */
function generateRecommendations(
  analysis: ScriptAnalysis,
  metadata: ContentMetadata,
  metrics: EngagementMetrics,
): string[] {
  const recommendations: string[] = [];

  if (analysis.hooks.length === 0) {
    recommendations.push("Add a strong hook at the beginning to grab attention");
  }

  if (analysis.wtas.length === 0) {
    recommendations.push("Include a clear call-to-action at the end");
  }

  if (metadata.hashtags.length < 3) {
    recommendations.push("Add more relevant hashtags to increase discoverability");
  }

  if (calculateEngagementRate(metrics) < 2) {
    recommendations.push("Focus on creating more engaging content to improve interaction rates");
  }

  return recommendations;
}

/**
 * Generates contextual actions for script elements
 */
export function generateContextualActions(element: ScriptElement): ContextualAction[] {
  const actions: ContextualAction[] = [];

  switch (element.type) {
    case "hook":
      actions.push(
        {
          id: "improve_hook",
          type: "improve_hook",
          label: "Improve Hook",
          icon: "🎣",
          description: "Make the hook more engaging",
        },
        {
          id: "make_question",
          type: "make_question",
          label: "Make Question",
          icon: "❓",
          description: "Convert to a question format",
        },
      );
      break;
    case "bridge":
      actions.push({
        id: "strengthen_bridge",
        type: "strengthen_bridge",
        label: "Strengthen Bridge",
        icon: "🌉",
        description: "Improve the transition",
      });
      break;
    case "wta":
      actions.push({
        id: "enhance_wta",
        type: "enhance_wta",
        label: "Enhance CTA",
        icon: "🎯",
        description: "Make the call-to-action stronger",
      });
      break;
  }

  return actions;
}
