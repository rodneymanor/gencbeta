import { type ScriptElementType } from '@/app/(main)/dashboard/scripts/editor/_components/layout/contextual-menu';

interface AIEnhancementRequest {
  elementType: ScriptElementType;
  originalText: string;
  action: string;
  context?: string;
}

interface AIEnhancementResponse {
  success: boolean;
  enhancedText?: string;
  alternatives?: string[];
  analysis?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  error?: string;
}

/**
 * Enhance script elements using AI services
 */
export async function enhanceScriptElement(request: AIEnhancementRequest): Promise<AIEnhancementResponse> {
  try {
    // Use the existing ghost writer API for AI enhancements
    const response = await fetch('/api/ghost-writer/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'element_enhancement',
        elementType: request.elementType,
        originalText: request.originalText,
        action: request.action,
        context: request.context ?? '',
      }),
    });

    if (!response.ok) {
      throw new Error(`AI enhancement failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      enhancedText: data.enhancedText,
      alternatives: data.alternatives,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('AI enhancement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate element alternatives using AI
 */
export async function generateElementAlternatives(
  elementType: ScriptElementType,
  originalText: string,
  count: number = 3
): Promise<AIEnhancementResponse> {
  try {
    const response = await fetch('/api/ghost-writer/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'generate_alternatives',
        elementType,
        originalText,
        count,
      }),
    });

    if (!response.ok) {
      throw new Error(`Alternative generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      alternatives: data.alternatives,
    };
  } catch (error) {
    console.error('Alternative generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Analyze script element effectiveness
 */
export async function analyzeElementEffectiveness(
  elementType: ScriptElementType,
  text: string
): Promise<AIEnhancementResponse> {
  try {
    const response = await fetch('/api/ghost-writer/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'analyze_element',
        elementType,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Element analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('Element analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get enhancement prompts for different element types
 */
export function getEnhancementPrompts(elementType: ScriptElementType, action: string): string {
      const prompts: Record<ScriptElementType, Record<string, string>> = {
      hook: {
        enhance: 'Make this hook more engaging and attention-grabbing. Add emotional impact, curiosity, or urgency.',
        analyze: 'Analyze the effectiveness of this hook. Rate its engagement potential and suggest improvements.',
        alternatives: 'Generate 3 alternative hooks that would be equally or more effective.',
      },
      bridge: {
        strengthen: 'Improve this bridge to create better flow and connection between ideas.',
        analyze: 'Analyze how well this bridge connects ideas and maintains narrative flow.',
        alternatives: 'Generate 3 alternative bridges that would connect these ideas more effectively.',
      },
      'golden-nugget': {
        amplify: 'Amplify the value and impact of this golden nugget. Make it more compelling and memorable.',
        analyze: 'Analyze the value proposition and impact of this golden nugget.',
        alternatives: 'Generate 3 alternative ways to present this valuable insight.',
      },
      cta: {
        optimize: 'Optimize this call-to-action for maximum conversion and engagement.',
        analyze: 'Analyze the effectiveness of this CTA and its persuasive power.',
        alternatives: 'Generate 3 alternative CTAs that would drive better action.',
      },
    };

  return prompts[elementType]?.[action] ?? 
         `${action} this ${elementType} to make it more effective.`;
}

/**
 * Format enhancement request for AI processing
 */
export function formatEnhancementRequest(
  elementType: ScriptElementType,
  originalText: string,
  action: string,
  context?: string
): string {
  const prompt = getEnhancementPrompts(elementType, action);
  
  return `
${prompt}

Original ${elementType}: "${originalText}"
${context ? `Context: ${context}` : ''}

Please provide:
1. Enhanced version
2. Brief explanation of improvements
3. Alternative suggestions if applicable
  `.trim();
}

/**
 * Parse AI response for enhancement results
 */
function parseTextResponse(response: string): {
  enhancedText?: string;
  explanation?: string;
  alternatives?: string[];
} {
  const lines = response.split('\n').filter(line => line.trim());
  
  let enhancedText = '';
  let explanation = '';
  const alternatives: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    if (line.toLowerCase().includes('enhanced') || line.toLowerCase().includes('improved')) {
      currentSection = 'enhanced';
      continue;
    } else if (line.toLowerCase().includes('explanation') || line.toLowerCase().includes('improvement')) {
      currentSection = 'explanation';
      continue;
    } else if (line.toLowerCase().includes('alternative') || line.toLowerCase().includes('suggestion')) {
      currentSection = 'alternatives';
      continue;
    }
    
    if (currentSection === 'enhanced' && !enhancedText) {
      enhancedText = line.replace(/^[^:]*:/, '').trim();
    } else if (currentSection === 'explanation') {
      explanation += line + ' ';
    } else if (currentSection === 'alternatives') {
      const alt = line.replace(/^[^:]*:/, '').replace(/^\d+\./, '').trim();
      if (alt) alternatives.push(alt);
    }
  }
  
  return {
    enhancedText: enhancedText || undefined,
    explanation: explanation.trim() || undefined,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  };
}

export function parseEnhancementResponse(response: string): {
  enhancedText?: string;
  explanation?: string;
  alternatives?: string[];
} {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response);
    return parsed;
  } catch {
    // If not JSON, try to extract from text
    return parseTextResponse(response);
  }
} 