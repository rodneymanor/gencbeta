export interface ElementDetectionSettings {
  hooks: {
    enabled: boolean;
    sensitivity: number;
    patterns: string[];
    customPatterns: string[];
    minLength: number;
    maxLength: number;
    requireEmotionalWords: boolean;
    requireQuestionMarks: boolean;
  };
  bridges: {
    enabled: boolean;
    sensitivity: number;
    patterns: string[];
    customPatterns: string[];
    minLength: number;
    maxLength: number;
    requireTransitionWords: boolean;
    requireLogicalFlow: boolean;
  };
  goldenNuggets: {
    enabled: boolean;
    sensitivity: number;
    patterns: string[];
    customPatterns: string[];
    minLength: number;
    maxLength: number;
    requireValueWords: boolean;
    requireSpecificity: boolean;
  };
  ctas: {
    enabled: boolean;
    sensitivity: number;
    patterns: string[];
    customPatterns: string[];
    minLength: number;
    maxLength: number;
    requireActionWords: boolean;
    requireUrgency: boolean;
  };
}

export interface DetectedElement {
  type: 'hook' | 'bridge' | 'goldenNugget' | 'cta';
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  reasons: string[];
  suggestions: string[];
}

class EnhancedElementDetection {
  private settings: ElementDetectionSettings;

  private readonly defaultPatterns = {
    hooks: [
      'what if',
      'imagine',
      'have you ever',
      'did you know',
      'here\'s the thing',
      'the truth is',
      'let me tell you',
      'you won\'t believe',
      'this will shock you',
      'most people don\'t know'
    ],
    bridges: [
      'but here\'s the thing',
      'now here\'s where it gets interesting',
      'so what does this mean',
      'let me explain',
      'here\'s why',
      'the reason is',
      'this is important because',
      'what this means is',
      'in other words',
      'to put it simply'
    ],
    goldenNuggets: [
      'the secret is',
      'here\'s the key',
      'the most important thing',
      'this changes everything',
      'here\'s what works',
      'the breakthrough moment',
      'this is game-changing',
      'the hidden truth',
      'what nobody tells you',
      'the real secret'
    ],
    ctas: [
      'click the link',
      'subscribe now',
      'get started today',
      'don\'t wait',
      'act now',
      'limited time',
      'join us',
      'sign up',
      'download now',
      'try it free'
    ]
  };

  private readonly emotionalWords = [
    'amazing', 'incredible', 'shocking', 'unbelievable', 'stunning', 'mind-blowing',
    'revolutionary', 'game-changing', 'life-changing', 'breakthrough', 'secret',
    'hidden', 'exclusive', 'powerful', 'proven', 'guaranteed'
  ];

  private readonly transitionWords = [
    'however', 'therefore', 'meanwhile', 'furthermore', 'moreover', 'consequently',
    'nevertheless', 'nonetheless', 'additionally', 'similarly', 'likewise',
    'in contrast', 'on the other hand', 'as a result', 'for example'
  ];

  private readonly valueWords = [
    'benefit', 'advantage', 'profit', 'gain', 'save', 'earn', 'improve',
    'increase', 'boost', 'enhance', 'optimize', 'maximize', 'achieve',
    'success', 'results', 'transformation', 'solution', 'strategy'
  ];

  private readonly actionWords = [
    'click', 'subscribe', 'download', 'join', 'start', 'begin', 'get',
    'try', 'buy', 'order', 'purchase', 'sign up', 'register', 'apply',
    'contact', 'call', 'visit', 'discover', 'learn', 'explore'
  ];

  private readonly urgencyWords = [
    'now', 'today', 'immediately', 'urgent', 'limited', 'exclusive',
    'deadline', 'expires', 'hurry', 'quick', 'fast', 'instant',
    'don\'t wait', 'act fast', 'last chance', 'final opportunity'
  ];

  constructor(settings: ElementDetectionSettings) {
    this.settings = settings;
  }

  updateSettings(newSettings: ElementDetectionSettings) {
    this.settings = newSettings;
  }

  detectElements(text: string): DetectedElement[] {
    const elements: DetectedElement[] = [];
    
    if (this.settings.hooks.enabled) {
      elements.push(...this.detectHooks(text));
    }
    
    if (this.settings.bridges.enabled) {
      elements.push(...this.detectBridges(text));
    }
    
    if (this.settings.goldenNuggets.enabled) {
      elements.push(...this.detectGoldenNuggets(text));
    }
    
    if (this.settings.ctas.enabled) {
      elements.push(...this.detectCTAs(text));
    }

    // Sort by position in text
    return elements.sort((a, b) => a.startIndex - b.startIndex);
  }

  private detectHooks(text: string): DetectedElement[] {
    const hooks: DetectedElement[] = [];
    const sentences = this.splitIntoSentences(text);
    const settings = this.settings.hooks;
    
    for (const sentence of sentences) {
      const confidence = this.calculateHookConfidence(sentence, settings);
      
      if (confidence >= settings.sensitivity) {
        const reasons = this.getHookReasons(sentence, settings);
        const suggestions = this.getHookSuggestions(sentence, confidence);
        
        hooks.push({
          type: 'hook',
          text: sentence.text,
          startIndex: sentence.startIndex,
          endIndex: sentence.endIndex,
          confidence,
          reasons,
          suggestions
        });
      }
    }
    
    return hooks;
  }

  private detectBridges(text: string): DetectedElement[] {
    const bridges: DetectedElement[] = [];
    const sentences = this.splitIntoSentences(text);
    const settings = this.settings.bridges;
    
    for (const sentence of sentences) {
      const confidence = this.calculateBridgeConfidence(sentence, settings);
      
      if (confidence >= settings.sensitivity) {
        const reasons = this.getBridgeReasons(sentence, settings);
        const suggestions = this.getBridgeSuggestions(sentence, confidence);
        
        bridges.push({
          type: 'bridge',
          text: sentence.text,
          startIndex: sentence.startIndex,
          endIndex: sentence.endIndex,
          confidence,
          reasons,
          suggestions
        });
      }
    }
    
    return bridges;
  }

  private detectGoldenNuggets(text: string): DetectedElement[] {
    const nuggets: DetectedElement[] = [];
    const sentences = this.splitIntoSentences(text);
    const settings = this.settings.goldenNuggets;
    
    for (const sentence of sentences) {
      const confidence = this.calculateGoldenNuggetConfidence(sentence, settings);
      
      if (confidence >= settings.sensitivity) {
        const reasons = this.getGoldenNuggetReasons(sentence, settings);
        const suggestions = this.getGoldenNuggetSuggestions(sentence, confidence);
        
        nuggets.push({
          type: 'goldenNugget',
          text: sentence.text,
          startIndex: sentence.startIndex,
          endIndex: sentence.endIndex,
          confidence,
          reasons,
          suggestions
        });
      }
    }
    
    return nuggets;
  }

  private detectCTAs(text: string): DetectedElement[] {
    const ctas: DetectedElement[] = [];
    const sentences = this.splitIntoSentences(text);
    const settings = this.settings.ctas;
    
    for (const sentence of sentences) {
      const confidence = this.calculateCTAConfidence(sentence, settings);
      
      if (confidence >= settings.sensitivity) {
        const reasons = this.getCTAReasons(sentence, settings);
        const suggestions = this.getCTASuggestions(sentence, confidence);
        
        ctas.push({
          type: 'cta',
          text: sentence.text,
          startIndex: sentence.startIndex,
          endIndex: sentence.endIndex,
          confidence,
          reasons,
          suggestions
        });
      }
    }
    
    return ctas;
  }

  private calculateHookConfidence(sentence: any, settings: any): number {
    let confidence = 0;
    const text = sentence.text.toLowerCase();
    
    // Check for pattern matches
    const allPatterns = [...this.defaultPatterns.hooks, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    confidence += patternMatches.length * 25;
    
    // Check length requirements
    if (text.length >= settings.minLength && text.length <= settings.maxLength) {
      confidence += 10;
    }
    
    // Check for emotional words
    if (settings.requireEmotionalWords) {
      const emotionalMatches = this.emotionalWords.filter(word => text.includes(word));
      if (emotionalMatches.length > 0) {
        confidence += 15;
      }
    }
    
    // Check for question marks
    if (settings.requireQuestionMarks && text.includes('?')) {
      confidence += 20;
    }
    
    // Check sentence position (hooks are often at the beginning)
    if (sentence.startIndex < text.length * 0.2) {
      confidence += 10;
    }
    
    return Math.min(100, confidence);
  }

  private calculateBridgeConfidence(sentence: any, settings: any): number {
    let confidence = 0;
    const text = sentence.text.toLowerCase();
    
    // Check for pattern matches
    const allPatterns = [...this.defaultPatterns.bridges, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    confidence += patternMatches.length * 25;
    
    // Check length requirements
    if (text.length >= settings.minLength && text.length <= settings.maxLength) {
      confidence += 10;
    }
    
    // Check for transition words
    if (settings.requireTransitionWords) {
      const transitionMatches = this.transitionWords.filter(word => text.includes(word));
      if (transitionMatches.length > 0) {
        confidence += 15;
      }
    }
    
    // Check for logical flow indicators
    if (settings.requireLogicalFlow) {
      const logicalWords = ['because', 'since', 'therefore', 'thus', 'so', 'hence'];
      const logicalMatches = logicalWords.filter(word => text.includes(word));
      if (logicalMatches.length > 0) {
        confidence += 15;
      }
    }
    
    return Math.min(100, confidence);
  }

  private calculateGoldenNuggetConfidence(sentence: any, settings: any): number {
    let confidence = 0;
    const text = sentence.text.toLowerCase();
    
    // Check for pattern matches
    const allPatterns = [...this.defaultPatterns.goldenNuggets, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    confidence += patternMatches.length * 25;
    
    // Check length requirements
    if (text.length >= settings.minLength && text.length <= settings.maxLength) {
      confidence += 10;
    }
    
    // Check for value words
    if (settings.requireValueWords) {
      const valueMatches = this.valueWords.filter(word => text.includes(word));
      if (valueMatches.length > 0) {
        confidence += 15;
      }
    }
    
    // Check for specificity (numbers, percentages, specific outcomes)
    if (settings.requireSpecificity) {
      const specificityPatterns = [/\d+%/, /\$\d+/, /\d+x/, /\d+ times/];
      const hasSpecificity = specificityPatterns.some(pattern => pattern.test(text));
      if (hasSpecificity) {
        confidence += 20;
      }
    }
    
    return Math.min(100, confidence);
  }

  private calculateCTAConfidence(sentence: any, settings: any): number {
    let confidence = 0;
    const text = sentence.text.toLowerCase();
    
    // Check for pattern matches
    const allPatterns = [...this.defaultPatterns.ctas, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    confidence += patternMatches.length * 25;
    
    // Check length requirements
    if (text.length >= settings.minLength && text.length <= settings.maxLength) {
      confidence += 10;
    }
    
    // Check for action words
    if (settings.requireActionWords) {
      const actionMatches = this.actionWords.filter(word => text.includes(word));
      if (actionMatches.length > 0) {
        confidence += 15;
      }
    }
    
    // Check for urgency
    if (settings.requireUrgency) {
      const urgencyMatches = this.urgencyWords.filter(word => text.includes(word));
      if (urgencyMatches.length > 0) {
        confidence += 20;
      }
    }
    
    // CTAs are often at the end
    const totalLength = sentence.text.length;
    if (sentence.startIndex > totalLength * 0.8) {
      confidence += 10;
    }
    
    return Math.min(100, confidence);
  }

  private getHookReasons(sentence: any, settings: any): string[] {
    const reasons: string[] = [];
    const text = sentence.text.toLowerCase();
    
    const allPatterns = [...this.defaultPatterns.hooks, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    
    if (patternMatches.length > 0) {
      reasons.push(`Contains hook patterns: ${patternMatches.join(', ')}`);
    }
    
    if (text.includes('?')) {
      reasons.push('Uses question format to engage reader');
    }
    
    const emotionalMatches = this.emotionalWords.filter(word => text.includes(word));
    if (emotionalMatches.length > 0) {
      reasons.push(`Contains emotional words: ${emotionalMatches.join(', ')}`);
    }
    
    return reasons;
  }

  private getBridgeReasons(sentence: any, settings: any): string[] {
    const reasons: string[] = [];
    const text = sentence.text.toLowerCase();
    
    const allPatterns = [...this.defaultPatterns.bridges, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    
    if (patternMatches.length > 0) {
      reasons.push(`Contains bridge patterns: ${patternMatches.join(', ')}`);
    }
    
    const transitionMatches = this.transitionWords.filter(word => text.includes(word));
    if (transitionMatches.length > 0) {
      reasons.push(`Uses transition words: ${transitionMatches.join(', ')}`);
    }
    
    return reasons;
  }

  private getGoldenNuggetReasons(sentence: any, settings: any): string[] {
    const reasons: string[] = [];
    const text = sentence.text.toLowerCase();
    
    const allPatterns = [...this.defaultPatterns.goldenNuggets, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    
    if (patternMatches.length > 0) {
      reasons.push(`Contains value patterns: ${patternMatches.join(', ')}`);
    }
    
    const valueMatches = this.valueWords.filter(word => text.includes(word));
    if (valueMatches.length > 0) {
      reasons.push(`Contains value words: ${valueMatches.join(', ')}`);
    }
    
    return reasons;
  }

  private getCTAReasons(sentence: any, settings: any): string[] {
    const reasons: string[] = [];
    const text = sentence.text.toLowerCase();
    
    const allPatterns = [...this.defaultPatterns.ctas, ...settings.patterns, ...settings.customPatterns];
    const patternMatches = allPatterns.filter(pattern => text.includes(pattern.toLowerCase()));
    
    if (patternMatches.length > 0) {
      reasons.push(`Contains CTA patterns: ${patternMatches.join(', ')}`);
    }
    
    const actionMatches = this.actionWords.filter(word => text.includes(word));
    if (actionMatches.length > 0) {
      reasons.push(`Contains action words: ${actionMatches.join(', ')}`);
    }
    
    const urgencyMatches = this.urgencyWords.filter(word => text.includes(word));
    if (urgencyMatches.length > 0) {
      reasons.push(`Creates urgency: ${urgencyMatches.join(', ')}`);
    }
    
    return reasons;
  }

  private getHookSuggestions(sentence: any, confidence: number): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 50) {
      suggestions.push('Consider adding emotional words to increase engagement');
      suggestions.push('Try using a question format to hook the reader');
      suggestions.push('Add intrigue or curiosity to make it more compelling');
    }
    
    return suggestions;
  }

  private getBridgeSuggestions(sentence: any, confidence: number): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 50) {
      suggestions.push('Add transition words to improve flow');
      suggestions.push('Make the logical connection more explicit');
      suggestions.push('Consider explaining the "why" behind the transition');
    }
    
    return suggestions;
  }

  private getGoldenNuggetSuggestions(sentence: any, confidence: number): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 50) {
      suggestions.push('Add specific numbers or percentages for credibility');
      suggestions.push('Include value words to emphasize the benefit');
      suggestions.push('Make the insight more concrete and actionable');
    }
    
    return suggestions;
  }

  private getCTASuggestions(sentence: any, confidence: number): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 50) {
      suggestions.push('Add action words to make it more compelling');
      suggestions.push('Create urgency with time-sensitive language');
      suggestions.push('Make the next step clearer and more specific');
    }
    
    return suggestions;
  }

  private splitIntoSentences(text: string): Array<{ text: string; startIndex: number; endIndex: number }> {
    const sentences: Array<{ text: string; startIndex: number; endIndex: number }> = [];
    const sentenceRegex = /[.!?]+/g;
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentenceText = text.slice(lastIndex, endIndex).trim();
      
      if (sentenceText.length > 0) {
        sentences.push({
          text: sentenceText,
          startIndex: lastIndex,
          endIndex: endIndex
        });
      }
      
      lastIndex = endIndex;
    }

    // Handle remaining text if no ending punctuation
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim();
      if (remainingText.length > 0) {
        sentences.push({
          text: remainingText,
          startIndex: lastIndex,
          endIndex: text.length
        });
      }
    }

    return sentences;
  }
}

export const defaultElementDetectionSettings: ElementDetectionSettings = {
  hooks: {
    enabled: true,
    sensitivity: 60,
    patterns: [],
    customPatterns: [],
    minLength: 10,
    maxLength: 200,
    requireEmotionalWords: false,
    requireQuestionMarks: false
  },
  bridges: {
    enabled: true,
    sensitivity: 55,
    patterns: [],
    customPatterns: [],
    minLength: 15,
    maxLength: 150,
    requireTransitionWords: false,
    requireLogicalFlow: false
  },
  goldenNuggets: {
    enabled: true,
    sensitivity: 65,
    patterns: [],
    customPatterns: [],
    minLength: 20,
    maxLength: 300,
    requireValueWords: false,
    requireSpecificity: false
  },
  ctas: {
    enabled: true,
    sensitivity: 70,
    patterns: [],
    customPatterns: [],
    minLength: 5,
    maxLength: 100,
    requireActionWords: true,
    requireUrgency: false
  }
};

export { EnhancedElementDetection }; 