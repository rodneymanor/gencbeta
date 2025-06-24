/**
 * Content Strategy Engine for Gen C Application
 * 
 * Provides AI-powered content strategy generation functionality
 * including 4-step wizard data collection and comprehensive strategy generation
 */

// ==================== TYPE DEFINITIONS ====================

/**
 * 4-Step Wizard Data Structure
 */
export interface WizardData {
  // Step 1: Identity & Topics
  profession: string;
  brandPersonality: string;
  keyTopics: string;
  
  // Step 2: Audience
  idealAudience: string;
  
  // Step 3: Core Problem
  coreProblem: string;
  
  // Step 4: Quick Win
  quickWin: string;
}

/**
 * Content Pillar Structure
 */
export interface ContentPillar {
  pillar_name: string;
  description: string;
  video_ideas: string[];
  keywords?: string[];
}

/**
 * Hashtag Categories
 */
export interface HashtagCategories {
  broad: string[];      // High-volume, general reach
  niche: string[];      // Specific to industry/topic
  community: string[];  // Engagement-focused, community building
}

/**
 * Complete Content Strategy Result
 */
export interface ContentStrategy {
  // Original wizard input
  formData: WizardData;
  
  // AI-generated strategy components
  results: {
    core_keywords: string[];
    audience_keywords: string[];
    problem_aware_keywords: string[];
    solution_aware_keywords: string[];
    content_pillars: ContentPillar[];
    suggested_hashtags: HashtagCategories;
    
    // Optional metadata
    trending_keywords?: string[];
    content_calendar_suggestions?: string[];
    value_propositions?: string[];
  };
  
  // Generation metadata
  metadata: {
    generated_at: string;
    model_used: string;
    processing_time_ms: number;
    wizard_version: string;
  };
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Content Strategy Generation Options
 */
export interface GenerationOptions {
  model?: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  temperature?: number;
  maxTokens?: number;
  includeMetadata?: boolean;
  enableDebugMode?: boolean;
}

// ==================== CORE ENGINE CLASS ====================

/**
 * ContentStrategyEngine
 * 
 * Main class responsible for generating complete content strategies
 * from wizard data using AI analysis
 */
export class ContentStrategyEngine {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(geminiApiKey: string) {
    if (!geminiApiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = geminiApiKey;
  }

  /**
   * Generate a complete content strategy from wizard data
   */
  async generateContentStrategy(
    wizardData: WizardData, 
    options: GenerationOptions = {}
  ): Promise<ContentStrategy> {
    const startTime = Date.now();
    
    // Validate input data
    const validation = this.validateWizardData(wizardData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Set default options
    const opts = {
      model: 'gemini-1.5-flash' as const,
      temperature: 0.8,
      maxTokens: 4096,
      includeMetadata: true,
      enableDebugMode: false,
      ...options
    };

    if (opts.enableDebugMode) {
      console.log('[ContentStrategy] Starting generation with data:', wizardData);
    }

    try {
      // Generate the content strategy using AI
      const aiResponse = await this.callGeminiAPI(wizardData, opts);
      
      // Parse and validate the response
      const parsedResults = this.parseAIResponse(aiResponse);
      
      // Construct the final content strategy
      const strategy: ContentStrategy = {
        formData: wizardData,
        results: parsedResults,
        metadata: {
          generated_at: new Date().toISOString(),
          model_used: opts.model,
          processing_time_ms: Date.now() - startTime,
          wizard_version: '1.0.0'
        }
      };

      if (opts.enableDebugMode) {
        console.log('[ContentStrategy] Generation completed:', {
          keywords: Object.keys(parsedResults).filter(k => k.includes('keywords')).length,
          pillars: parsedResults.content_pillars.length,
          hashtags: Object.keys(parsedResults.suggested_hashtags).length,
          processingTime: strategy.metadata.processing_time_ms
        });
      }

      return strategy;

    } catch (error) {
      console.error('[ContentStrategy] Generation failed:', error);
      throw new Error(`Content strategy generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate wizard data completeness and format
   */
  validateWizardData(data: WizardData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!data.profession || !data.profession.trim()) {
      errors.push('Profession is required');
    }
    if (!data.brandPersonality || !data.brandPersonality.trim()) {
      errors.push('Brand personality is required');
    }
    if (!data.keyTopics || !data.keyTopics.trim()) {
      errors.push('Key topics are required');
    }
    if (!data.idealAudience || !data.idealAudience.trim()) {
      errors.push('Ideal audience description is required');
    }
    if (!data.coreProblem || !data.coreProblem.trim()) {
      errors.push('Core problem is required');
    }
    if (!data.quickWin || !data.quickWin.trim()) {
      errors.push('Quick win advice is required');
    }

    // Quality validation
    if (data.idealAudience && data.idealAudience.length < 20) {
      warnings.push('Ideal audience description is quite short - more detail may improve results');
    }
    if (data.coreProblem && data.coreProblem.length < 20) {
      warnings.push('Core problem description is quite short - more detail may improve results');
    }
    if (data.keyTopics && data.keyTopics.split(',').length < 2) {
      warnings.push('Consider adding more key topics for better strategy diversity');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Call Gemini API with the content strategy generation prompt
   */
  private async callGeminiAPI(wizardData: WizardData, options: GenerationOptions): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(wizardData);
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const response = await fetch(`${this.baseUrl}/models/${options.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: options.temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: options.maxTokens,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Build the system prompt for content strategy generation
   */
  private buildSystemPrompt(): string {
    return `You are an expert content strategist specializing in short-form video content strategy for social media platforms (TikTok, Instagram Reels, YouTube Shorts). Your task is to analyze user input and generate a comprehensive content strategy with keywords, content pillars, and hashtags.

Your expertise includes:
- Keyword research and audience awareness levels
- Content pillar development with video ideas
- Hashtag strategy for maximum reach and engagement
- Understanding creator pain points and audience psychology

CRITICAL: You must output a valid JSON object with this EXACT structure:

{
  "core_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "audience_keywords": ["audience-term1", "audience-term2", "audience-term3", "audience-term4"],
  "problem_aware_keywords": ["problem1", "problem2", "problem3", "problem4"],
  "solution_aware_keywords": ["solution1", "solution2", "solution3", "solution4"],
  "content_pillars": [
    {
      "pillar_name": "Pillar Name",
      "description": "Detailed description of this content pillar and its purpose",
      "video_ideas": [
        "Specific video idea 1 for this pillar",
        "Specific video idea 2 for this pillar",
        "Specific video idea 3 for this pillar",
        "Specific video idea 4 for this pillar"
      ],
      "keywords": ["related", "keywords"]
    }
  ],
  "suggested_hashtags": {
    "broad": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
    "niche": ["niche1", "niche2", "niche3", "niche4", "niche5"],
    "community": ["community1", "community2", "community3", "community4", "community5"]
  }
}

Keyword Categories Explained:
- CORE KEYWORDS: Primary terms directly related to their profession/expertise
- AUDIENCE KEYWORDS: Terms their target audience uses to describe themselves
- PROBLEM-AWARE KEYWORDS: Terms people use when experiencing the core problem
- SOLUTION-AWARE KEYWORDS: Terms people use when actively seeking solutions

Content Pillars: Generate 3-4 strategic content themes that align with their expertise and audience needs. Each pillar should have 4 specific, actionable video ideas.

Hashtag Categories:
- BROAD: High-volume hashtags for maximum reach (10k-1M+ posts)
- NICHE: Industry/topic-specific hashtags for targeted audience (1k-100k posts)
- COMMUNITY: Engagement-focused hashtags for building community (100-10k posts)

Return ONLY the JSON object, no additional text or formatting.`;
  }

  /**
   * Build the user prompt from wizard data
   */
  private buildUserPrompt(data: WizardData): string {
    return `Analyze the following user profile and generate a comprehensive content strategy:

PROFESSION/BUSINESS: ${data.profession}

BRAND PERSONALITY: ${data.brandPersonality}

KEY TOPICS: ${data.keyTopics}

IDEAL AUDIENCE: ${data.idealAudience}

CORE PROBLEM THEY SOLVE: ${data.coreProblem}

EXPERT ADVICE/QUICK WIN: ${data.quickWin}

Based on this information, generate:

1. KEYWORDS: Extract and categorize relevant keywords for each awareness level
2. CONTENT PILLARS: Create 3-4 strategic content themes with specific video ideas
3. HASHTAGS: Suggest hashtags across broad, niche, and community categories

Focus on creating a strategy that:
- Addresses their audience's core problem: ${data.coreProblem}
- Aligns with their brand personality: ${data.brandPersonality}
- Leverages their expertise in: ${data.profession}
- Provides actionable content ideas for daily posting
- Maximizes reach and engagement through strategic hashtag use

Generate a strategy that helps them consistently create valuable content that resonates with ${data.idealAudience} while establishing authority in ${data.keyTopics}.`;
  }

  /**
   * Parse and validate AI response
   */
  private parseAIResponse(aiResponse: string): ContentStrategy['results'] {
    // Clean up the response
    let cleanResponse = aiResponse.trim();
    cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    // Extract JSON from response
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON found in AI response');
    }
    
    cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);

    try {
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required structure
      const required = ['core_keywords', 'audience_keywords', 'problem_aware_keywords', 'solution_aware_keywords', 'content_pillars', 'suggested_hashtags'];
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate content pillars structure
      if (!Array.isArray(parsed.content_pillars) || parsed.content_pillars.length === 0) {
        throw new Error('Content pillars must be a non-empty array');
      }

      for (const pillar of parsed.content_pillars) {
        if (!pillar.pillar_name || !pillar.description || !Array.isArray(pillar.video_ideas)) {
          throw new Error('Invalid content pillar structure');
        }
      }

      // Validate hashtags structure
      const hashtags = parsed.suggested_hashtags;
      if (!hashtags.broad || !hashtags.niche || !hashtags.community) {
        throw new Error('Hashtags must include broad, niche, and community categories');
      }

      return parsed;

    } catch (error) {
      console.error('Failed to parse AI response:', cleanResponse);
      throw new Error(`Failed to parse content strategy: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }
}

// ==================== WORKFLOW CLASS ====================

/**
 * ContentStrategyWorkflow
 * 
 * High-level workflow management for content strategy generation
 * Provides step-by-step validation and guided strategy creation
 */
export class ContentStrategyWorkflow {
  private engine: ContentStrategyEngine;
  private currentStep: number = 1;
  private wizardData: Partial<WizardData> = {};

  constructor(geminiApiKey: string) {
    this.engine = new ContentStrategyEngine(geminiApiKey);
  }

  /**
   * Start the workflow and reset any existing data
   */
  startWorkflow(): void {
    this.currentStep = 1;
    this.wizardData = {};
  }

  /**
   * Get current step information
   */
  getCurrentStep(): { step: number; title: string; description: string } {
    const steps = [
      { step: 1, title: "Identity & Topics", description: "Tell us about your profession and content focus" },
      { step: 2, title: "Your Audience", description: "Describe who you're creating content for" },
      { step: 3, title: "The Core Problem", description: "What's the main challenge you help solve?" },
      { step: 4, title: "The Quick Win", description: "Share your best piece of expert advice" }
    ];
    
    return steps[this.currentStep - 1] || steps[0];
  }

  /**
   * Validate and set step 1 data (Identity & Topics)
   */
  setStep1Data(profession: string, brandPersonality: string, keyTopics: string): ValidationResult {
    const errors: string[] = [];
    
    if (!profession || !profession.trim()) errors.push('Profession is required');
    if (!brandPersonality || !brandPersonality.trim()) errors.push('Brand personality is required');
    if (!keyTopics || !keyTopics.trim()) errors.push('Key topics are required');

    if (errors.length === 0) {
      this.wizardData.profession = profession.trim();
      this.wizardData.brandPersonality = brandPersonality.trim();
      this.wizardData.keyTopics = keyTopics.trim();
      this.currentStep = 2;
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  /**
   * Validate and set step 2 data (Audience)
   */
  setStep2Data(idealAudience: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!idealAudience || !idealAudience.trim()) {
      errors.push('Ideal audience description is required');
    } else if (idealAudience.length < 20) {
      warnings.push('Consider providing more detail about your audience for better results');
    }

    if (errors.length === 0) {
      this.wizardData.idealAudience = idealAudience.trim();
      this.currentStep = 3;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate and set step 3 data (Core Problem)
   */
  setStep3Data(coreProblem: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!coreProblem || !coreProblem.trim()) {
      errors.push('Core problem description is required');
    } else if (coreProblem.length < 20) {
      warnings.push('Consider providing more detail about the problem for better results');
    }

    if (errors.length === 0) {
      this.wizardData.coreProblem = coreProblem.trim();
      this.currentStep = 4;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate and set step 4 data (Quick Win)
   */
  setStep4Data(quickWin: string): ValidationResult {
    const errors: string[] = [];
    
    if (!quickWin || !quickWin.trim()) {
      errors.push('Quick win advice is required');
    }

    if (errors.length === 0) {
      this.wizardData.quickWin = quickWin.trim();
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  /**
   * Check if workflow is complete and ready for generation
   */
  isComplete(): boolean {
    return !!(
      this.wizardData.profession &&
      this.wizardData.brandPersonality &&
      this.wizardData.keyTopics &&
      this.wizardData.idealAudience &&
      this.wizardData.coreProblem &&
      this.wizardData.quickWin
    );
  }

  /**
   * Generate the content strategy (only if workflow is complete)
   */
  async generateStrategy(options?: GenerationOptions): Promise<ContentStrategy> {
    if (!this.isComplete()) {
      throw new Error('Workflow is not complete. Please fill in all required fields.');
    }

    return this.engine.generateContentStrategy(this.wizardData as WizardData, options);
  }

  /**
   * Get current wizard data
   */
  getWizardData(): Partial<WizardData> {
    return { ...this.wizardData };
  }

  /**
   * Go back to previous step
   */
  goToPreviousStep(): boolean {
    if (this.currentStep > 1) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  /**
   * Reset workflow to beginning
   */
  reset(): void {
    this.startWorkflow();
  }
} 