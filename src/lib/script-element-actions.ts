import { type ScriptElementType } from '@/app/(main)/dashboard/scripts/editor/_components/layout/contextual-menu';

export interface ElementActionResult {
  success: boolean;
  result?: string;
  suggestions?: string[];
  error?: string;
}

export interface ElementAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Enhance a hook to make it more engaging
 */
export async function enhanceHook(hookText: string): Promise<ElementActionResult> {
  try {
    // Analyze current hook
    const analysis = analyzeHook(hookText);

    // Generate enhanced version based on analysis
    const enhancedHook = await generateEnhancedHook(hookText, analysis);

    return {
      success: true,
      result: enhancedHook,
      suggestions: [
        'Consider adding a specific number or statistic',
        'Use more emotional language',
        'Create curiosity with a question',
        'Add urgency or scarcity',
      ]
    };
  } catch {
    return {
      success: false,
      error: 'Failed to enhance hook'
    };
  }
}

/**
 * Strengthen a bridge connection
 */
export async function strengthenBridge(bridgeText: string): Promise<ElementActionResult> {
  try {
    const analysis = analyzeBridge(bridgeText);
    const strengthenedBridge = await generateStrengthenedBridge(bridgeText, analysis);
    
    return {
      success: true,
      result: strengthenedBridge,
      suggestions: [
        'Use transition words for smoother flow',
        'Connect to previous point more clearly',
        'Add logical reasoning',
        'Use storytelling elements',
      ]
    };
  } catch {
    return {
      success: false,
      error: 'Failed to strengthen bridge'
    };
  }
}

/**
 * Amplify a golden nugget's value
 */
export async function amplifyGoldenNugget(nuggetText: string): Promise<ElementActionResult> {
  try {
    const analysis = analyzeGoldenNugget(nuggetText);
    const amplifiedNugget = await generateAmplifiedNugget(nuggetText, analysis);
    
    return {
      success: true,
      result: amplifiedNugget,
      suggestions: [
        'Add social proof or credibility',
        'Include specific examples',
        'Emphasize the unique value',
        'Use power words for impact',
      ]
    };
  } catch {
    return {
      success: false,
      error: 'Failed to amplify golden nugget'
    };
  }
}

/**
 * Optimize a call-to-action
 */
export async function optimizeCTA(ctaText: string): Promise<ElementActionResult> {
  try {
    const analysis = analyzeCTA(ctaText);
    const optimizedCTA = await generateOptimizedCTA(ctaText, analysis);
    
    return {
      success: true,
      result: optimizedCTA,
      suggestions: [
        'Use action-oriented verbs',
        'Create urgency',
        'Specify the benefit',
        'Make it easy to understand',
      ]
    };
  } catch {
    return {
      success: false,
      error: 'Failed to optimize CTA'
    };
  }
}

/**
 * Analyze element effectiveness
 */
export function analyzeElement(elementType: ScriptElementType, text: string): ElementAnalysis {
  switch (elementType) {
    case 'hook':
      return analyzeHook(text);
    case 'bridge':
      return analyzeBridge(text);
    case 'golden-nugget':
      return analyzeGoldenNugget(text);
    case 'cta':
      return analyzeCTA(text);
    default:
      return {
        score: 0,
        strengths: [],
        weaknesses: [],
        suggestions: []
      };
  }
}

/**
 * Generate alternatives for an element
 */
export async function generateAlternatives(elementType: ScriptElementType, text: string): Promise<ElementActionResult> {
  try {
    const alternatives = await generateElementAlternatives(elementType, text);
    
    return {
      success: true,
      suggestions: alternatives
    };
  } catch {
    return {
      success: false,
      error: 'Failed to generate alternatives'
    };
  }
}

// Internal analysis functions
function analyzeHook(text: string): ElementAnalysis {
  const score = calculateHookScore(text);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  
  // Check for emotional words
  const emotionalWords = ['amazing', 'shocking', 'incredible', 'unbelievable', 'mind-blowing'];
  const hasEmotionalWords = emotionalWords.some(word => text.toLowerCase().includes(word));
  
  if (hasEmotionalWords) {
    strengths.push('Uses emotional language');
  } else {
    weaknesses.push('Lacks emotional impact');
    suggestions.push('Add emotional words like "amazing" or "shocking"');
  }
  
  // Check for questions
  if (text.includes('?')) {
    strengths.push('Uses questions to engage');
  } else {
    suggestions.push('Consider starting with a question');
  }
  
  // Check for numbers
  if (/\d+/.test(text)) {
    strengths.push('Includes specific numbers');
  } else {
    suggestions.push('Add specific statistics or numbers');
  }
  
  // Check length
  if (text.length > 100) {
    weaknesses.push('May be too long');
    suggestions.push('Consider shortening for better impact');
  }
  
  return { score, strengths, weaknesses, suggestions };
}

function analyzeBridge(text: string): ElementAnalysis {
  const score = calculateBridgeScore(text);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  
  // Check for transition words
  const transitionWords = ['however', 'meanwhile', 'therefore', 'consequently', 'furthermore'];
  const hasTransitions = transitionWords.some(word => text.toLowerCase().includes(word));
  
  if (hasTransitions) {
    strengths.push('Uses transition words');
  } else {
    weaknesses.push('Lacks smooth transitions');
    suggestions.push('Add transition words for better flow');
  }
  
  return { score, strengths, weaknesses, suggestions };
}

function analyzeGoldenNugget(text: string): ElementAnalysis {
  const score = calculateGoldenNuggetScore(text);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  
  // Check for value indicators
  const valueWords = ['secret', 'key', 'important', 'crucial', 'essential', 'breakthrough'];
  const hasValueWords = valueWords.some(word => text.toLowerCase().includes(word));
  
  if (hasValueWords) {
    strengths.push('Emphasizes value');
  } else {
    weaknesses.push('Doesn\'t emphasize uniqueness');
    suggestions.push('Use words like "secret" or "key" to highlight value');
  }
  
  return { score, strengths, weaknesses, suggestions };
}

function analyzeCTA(text: string): ElementAnalysis {
  const score = calculateCTAScore(text);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  
  // Check for action verbs
  const actionVerbs = ['click', 'tap', 'follow', 'subscribe', 'like', 'share', 'download', 'get'];
  const hasActionVerbs = actionVerbs.some(verb => text.toLowerCase().includes(verb));
  
  if (hasActionVerbs) {
    strengths.push('Uses action verbs');
  } else {
    weaknesses.push('Lacks clear action');
    suggestions.push('Use strong action verbs like "click" or "follow"');
  }
  
  return { score, strengths, weaknesses, suggestions };
}

// Scoring functions
function calculateHookScore(text: string): number {
  let score = 50; // Base score
  
  // Length optimization
  if (text.length >= 20 && text.length <= 80) score += 20;
  
  // Emotional words
  const emotionalWords = ['amazing', 'shocking', 'incredible', 'unbelievable'];
  if (emotionalWords.some(word => text.toLowerCase().includes(word))) score += 15;
  
  // Questions
  if (text.includes('?')) score += 10;
  
  // Numbers
  if (/\d+/.test(text)) score += 5;
  
  return Math.min(100, score);
}

function calculateBridgeScore(text: string): number {
  let score = 50;
  
  const transitionWords = ['however', 'meanwhile', 'therefore', 'but', 'and'];
  if (transitionWords.some(word => text.toLowerCase().includes(word))) score += 20;
  
  if (text.length >= 30 && text.length <= 100) score += 15;
  
  return Math.min(100, score);
}

function calculateGoldenNuggetScore(text: string): number {
  let score = 50;
  
  const valueWords = ['secret', 'key', 'important', 'crucial'];
  if (valueWords.some(word => text.toLowerCase().includes(word))) score += 25;
  
  if (text.length >= 40) score += 15;
  
  if (/\d+/.test(text)) score += 10;
  
  return Math.min(100, score);
}

function calculateCTAScore(text: string): number {
  let score = 50;
  
  const actionVerbs = ['click', 'tap', 'follow', 'subscribe', 'like', 'share'];
  if (actionVerbs.some(verb => text.toLowerCase().includes(verb))) score += 25;
  
  if (text.length <= 50) score += 10; // CTAs should be concise
  
  return Math.min(100, score);
}

// AI-powered generation functions (simplified versions)
async function generateEnhancedHook(original: string, _analysis: ElementAnalysis): Promise<string> {
  // In a real implementation, this would call an AI service
  // For now, return a template-based enhancement
  
  const templates = [
    `🤯 ${original.replace(/^(did you know|imagine)/i, 'Did you know')}`,
    `Wait... ${original.toLowerCase()}`,
    `Here's something shocking: ${original.toLowerCase()}`,
    `You won't believe this: ${original.toLowerCase()}`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function generateStrengthenedBridge(original: string, _analysis: ElementAnalysis): Promise<string> {
  const templates = [
    `But here's the thing: ${original.toLowerCase()}`,
    `Now, this is where it gets interesting - ${original.toLowerCase()}`,
    `However, ${original.toLowerCase()}`,
    `This leads us to something important: ${original.toLowerCase()}`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function generateAmplifiedNugget(original: string, _analysis: ElementAnalysis): Promise<string> {
  const templates = [
    `🔑 Here's the secret: ${original.toLowerCase()}`,
    `This is the game-changer: ${original.toLowerCase()}`,
    `Most people don't know this, but ${original.toLowerCase()}`,
    `The key insight is: ${original.toLowerCase()}`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function generateOptimizedCTA(original: string, _analysis: ElementAnalysis): Promise<string> {
  const templates = [
    `👆 ${original.replace(/^(click|tap)/i, 'Click')} now!`,
    `Don't wait - ${original.toLowerCase()} today!`,
    `${original.replace(/^(follow|subscribe)/i, 'Follow')} for more content like this!`,
    `Take action: ${original.toLowerCase()} right now!`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function generateElementAlternatives(elementType: ScriptElementType, _text: string): Promise<string[]> {
  const alternatives: Record<ScriptElementType, string[]> = {
    hook: [
      'Did you know that...',
      'Imagine if...',
      'What if I told you...',
      'Here\'s something shocking...',
      'You won\'t believe this...'
    ],
    bridge: [
      'But here\'s the thing...',
      'Now, this is where it gets interesting...',
      'However...',
      'This leads us to...',
      'Speaking of which...'
    ],
    'golden-nugget': [
      'Here\'s the secret...',
      'The key insight is...',
      'Most people don\'t know...',
      'This is the game-changer...',
      'The breakthrough moment...'
    ],
    cta: [
      'Click the link below!',
      'Follow for more tips!',
      'Subscribe now!',
      'Don\'t forget to like!',
      'Share this with friends!'
    ]
  };
  
  return alternatives[elementType] || [];
} 