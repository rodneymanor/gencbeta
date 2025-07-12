/**
 * PEQ Extractor Service
 * Centralized Problems, Excuses, Questions extraction for content strategy
 */

import { GeminiService } from "@/lib/gemini";
import { BrandQuestionnaire } from "@/types/brand-profile";

export interface PEQData {
  problems: string[];
  excuses: string[];
  questions: string[];
}

export interface PEQExtractionResult {
  success: boolean;
  data?: PEQData;
  error?: string;
}

export interface PEQAnalysis {
  peqData: PEQData;
  problemCategories: string[];
  excusePatterns: string[];
  questionTypes: string[];
  contentOpportunities: string[];
}

/**
 * Extracts Problems, Excuses, and Questions from brand profile questionnaire
 * @param questionnaire - Brand questionnaire data
 * @returns PEQ extraction result
 */
export async function extractPEQ(questionnaire: BrandQuestionnaire): Promise<PEQExtractionResult> {
  try {
    console.log("🔍 [PEQ] Extracting Problems, Excuses, Questions from brand profile");

    const prompt = buildPEQExtractionPrompt(questionnaire);
    
    const result = await GeminiService.generateContent({
      prompt,
      maxTokens: 1000,
      temperature: 0.7,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to generate PEQ data");
    }

    const text = result.content!;
    console.log("🤖 [PEQ] Raw AI response:", text);

    // Parse the JSON response
    let parsedPEQ: PEQData;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("❌ [PEQ] No JSON found in AI response");
        throw new Error("No JSON found in response");
      }
      
      console.log("🔍 [PEQ] Extracted JSON:", jsonMatch[0]);
      parsedPEQ = JSON.parse(jsonMatch[0]);
      console.log("✅ [PEQ] Parsed PEQ data:", JSON.stringify(parsedPEQ, null, 2));
    } catch (parseError) {
      console.error("❌ [PEQ] Failed to parse AI response:", parseError);
      console.error("❌ [PEQ] Raw text was:", text);
      throw new Error("Failed to parse AI response");
    }

    // Validate the structure
    if (!parsedPEQ.problems || !parsedPEQ.excuses || !parsedPEQ.questions) {
      throw new Error("Invalid PEQ structure - missing required fields");
    }

    console.log(`✅ [PEQ] Successfully extracted ${parsedPEQ.problems.length} problems, ${parsedPEQ.excuses.length} excuses, ${parsedPEQ.questions.length} questions`);

    return {
      success: true,
      data: parsedPEQ,
    };
  } catch (error) {
    console.error("❌ [PEQ] Failed to extract PEQ data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Analyzes PEQ data for content strategy insights
 * @param peqData - PEQ data to analyze
 * @returns Comprehensive PEQ analysis
 */
export function analyzePEQ(peqData: PEQData): PEQAnalysis {
  const problemCategories = categorizeProblems(peqData.problems);
  const excusePatterns = identifyExcusePatterns(peqData.excuses);
  const questionTypes = categorizeQuestions(peqData.questions);
  const contentOpportunities = generateContentOpportunities(peqData);

  return {
    peqData,
    problemCategories,
    excusePatterns,
    questionTypes,
    contentOpportunities,
  };
}

/**
 * Builds the AI prompt for PEQ extraction
 * @param questionnaire - Brand questionnaire data
 * @returns Formatted prompt string
 */
function buildPEQExtractionPrompt(questionnaire: BrandQuestionnaire): string {
  return `You are an expert content strategist specializing in audience psychology and pain point analysis. 

Your task is to analyze the brand questionnaire responses below and extract specific Problems, Excuses, and Questions (PEQ) that the target audience experiences.

BRAND QUESTIONNAIRE RESPONSES:
- Profession/Business: ${questionnaire.profession}
- Brand Personality: ${questionnaire.brandPersonality}
- Universal Problem: ${questionnaire.universalProblem}
- Initial Hurdle: ${questionnaire.initialHurdle}
- Persistent Struggle: ${questionnaire.persistentStruggle}
- Visible Triumph: ${questionnaire.visibleTriumph}
- Ultimate Transformation: ${questionnaire.ultimateTransformation}

EXTRACTION REQUIREMENTS:

1. **PROBLEMS** (5-7 items): Specific pain points, challenges, and frustrations the audience faces. These should be actionable problems that content can address.

2. **EXCUSES** (4-6 items): Common justifications, rationalizations, and mental barriers that prevent the audience from taking action or solving their problems.

3. **QUESTIONS** (5-7 items): Direct questions the audience asks themselves or others about their situation, goals, and potential solutions.

CRITICAL OUTPUT REQUIREMENT: 
Your response must start IMMEDIATELY with the opening brace { and contain NOTHING else except the JSON object.

Expected JSON format:
{
  "problems": [
    "Specific problem statement 1",
    "Specific problem statement 2",
    "..."
  ],
  "excuses": [
    "Common excuse or barrier 1",
    "Common excuse or barrier 2", 
    "..."
  ],
  "questions": [
    "Direct question the audience asks 1",
    "Direct question the audience asks 2",
    "..."
  ]
}

GUIDELINES:
- Make each item specific and actionable
- Use the audience's voice and language
- Focus on emotional and practical aspects
- Ensure variety in complexity and scope
- Keep items concise but meaningful (10-15 words each)

FINAL REMINDER: Your response must be PURE JSON starting with { and ending with }. No other text whatsoever.`;
}

/**
 * Categorizes problems into themes
 * @param problems - Array of problem statements
 * @returns Array of problem categories
 */
function categorizeProblems(problems: string[]): string[] {
  const categories = new Set<string>();
  
  problems.forEach(problem => {
    const lowerProblem = problem.toLowerCase();
    
    if (lowerProblem.includes('time') || lowerProblem.includes('busy') || lowerProblem.includes('schedule')) {
      categories.add('Time Management');
    }
    if (lowerProblem.includes('money') || lowerProblem.includes('cost') || lowerProblem.includes('budget')) {
      categories.add('Financial');
    }
    if (lowerProblem.includes('skill') || lowerProblem.includes('knowledge') || lowerProblem.includes('learn')) {
      categories.add('Skills & Knowledge');
    }
    if (lowerProblem.includes('confidence') || lowerProblem.includes('fear') || lowerProblem.includes('doubt')) {
      categories.add('Confidence & Mindset');
    }
    if (lowerProblem.includes('network') || lowerProblem.includes('connection') || lowerProblem.includes('relationship')) {
      categories.add('Networking');
    }
    if (lowerProblem.includes('technology') || lowerProblem.includes('tool') || lowerProblem.includes('platform')) {
      categories.add('Technology');
    }
  });
  
  return Array.from(categories);
}

/**
 * Identifies patterns in excuses
 * @param excuses - Array of excuse statements
 * @returns Array of excuse patterns
 */
function identifyExcusePatterns(excuses: string[]): string[] {
  const patterns = new Set<string>();
  
  excuses.forEach(excuse => {
    const lowerExcuse = excuse.toLowerCase();
    
    if (lowerExcuse.includes('not enough') || lowerExcuse.includes('lack of')) {
      patterns.add('Resource Scarcity');
    }
    if (lowerExcuse.includes('too late') || lowerExcuse.includes('missed')) {
      patterns.add('Timing Concerns');
    }
    if (lowerExcuse.includes('not ready') || lowerExcuse.includes('need more')) {
      patterns.add('Readiness Issues');
    }
    if (lowerExcuse.includes('what if') || lowerExcuse.includes('worried')) {
      patterns.add('Fear & Uncertainty');
    }
    if (lowerExcuse.includes('tried before') || lowerExcuse.includes('failed')) {
      patterns.add('Past Failures');
    }
  });
  
  return Array.from(patterns);
}

/**
 * Categorizes questions by type
 * @param questions - Array of question statements
 * @returns Array of question types
 */
function categorizeQuestions(questions: string[]): string[] {
  const types = new Set<string>();
  
  questions.forEach(question => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('how') || lowerQuestion.includes('what steps')) {
      types.add('How-To Questions');
    }
    if (lowerQuestion.includes('when') || lowerQuestion.includes('timing')) {
      types.add('Timing Questions');
    }
    if (lowerQuestion.includes('why') || lowerQuestion.includes('reason')) {
      types.add('Why Questions');
    }
    if (lowerQuestion.includes('worth') || lowerQuestion.includes('value')) {
      types.add('Value Questions');
    }
    if (lowerQuestion.includes('start') || lowerQuestion.includes('begin')) {
      types.add('Starting Questions');
    }
  });
  
  return Array.from(types);
}

/**
 * Generates content opportunities from PEQ data
 * @param peqData - PEQ data to analyze
 * @returns Array of content opportunities
 */
function generateContentOpportunities(peqData: PEQData): string[] {
  const opportunities: string[] = [];
  
  // Problem-based content
  peqData.problems.forEach(problem => {
    opportunities.push(`How to solve: ${problem}`);
    opportunities.push(`The truth about: ${problem}`);
  });
  
  // Excuse-busting content
  peqData.excuses.forEach(excuse => {
    opportunities.push(`Why ${excuse} is just an excuse`);
    opportunities.push(`How to overcome: ${excuse}`);
  });
  
  // Question-answering content
  peqData.questions.forEach(question => {
    opportunities.push(`Answering: ${question}`);
    opportunities.push(`The complete guide to: ${question.replace('?', '')}`);
  });
  
  return opportunities.slice(0, 10); // Limit to top 10 opportunities
}

/**
 * Validates PEQ data structure
 * @param peqData - PEQ data to validate
 * @returns Validation result
 */
export function validatePEQData(peqData: PEQData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!peqData.problems || !Array.isArray(peqData.problems)) {
    errors.push('Problems must be an array');
  }
  
  if (!peqData.excuses || !Array.isArray(peqData.excuses)) {
    errors.push('Excuses must be an array');
  }
  
  if (!peqData.questions || !Array.isArray(peqData.questions)) {
    errors.push('Questions must be an array');
  }
  
  if (peqData.problems && peqData.problems.length < 3) {
    errors.push('At least 3 problems required');
  }
  
  if (peqData.excuses && peqData.excuses.length < 2) {
    errors.push('At least 2 excuses required');
  }
  
  if (peqData.questions && peqData.questions.length < 3) {
    errors.push('At least 3 questions required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
} 