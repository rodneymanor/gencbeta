import { adminDb } from "@/lib/firebase-admin";
import { GeminiService } from "@/lib/gemini";
import { PEQExtractionService, PEQData } from "@/lib/peq-extraction-service";
import { createHookGenerationPrompt, type GeneratedHook } from "@/lib/prompts/hook-generation";
import { AIVoice } from "@/types/ai-voices";
import { BrandProfile } from "@/types/brand-profile";

export interface EnhancedContentIdea {
  id: string;
  concept: string;
  hook: string;
  hookTemplate: string;
  hookStrength: string;
  peqCategory: "problem" | "excuse" | "question";
  sourceText: string;
  targetAudience: string;
  estimatedDuration: string;
  createdAt: string;
  userId: string;
  cycleId: string;
  wordCount: number;
}

export interface IdeaGenerationResult {
  success: boolean;
  ideas?: EnhancedContentIdea[];
  error?: string;
  metadata?: {
    peqData: PEQData;
    conceptsGenerated: number;
    hooksGenerated: number;
    processingTime: number;
  };
}

export interface ConceptGenerationResult {
  success: boolean;
  concepts?: Array<{
    concept: string;
    peqCategory: "problem" | "excuse" | "question";
    sourceText: string;
  }>;
  error?: string;
}

export class EnhancedGhostWriterService {
  private static readonly COLLECTIONS = {
    ENHANCED_CONTENT_IDEAS: "enhanced_content_ideas",
    GHOST_WRITER_CYCLES: "ghost_writer_cycles",
  } as const;

  private static readonly IDEAS_PER_CYCLE = 9;

  /**
   * Generate enhanced content ideas using PEQ framework (two-step process)
   */
  static async generateEnhancedIdeas(
    userId: string,
    brandProfile: BrandProfile,
    cycleId: string,
    _activeVoice?: AIVoice | null,
  ): Promise<IdeaGenerationResult> {
    const startTime = Date.now();

    try {
      console.log("🎯 [EnhancedGhostWriter] Starting two-step idea generation");
      console.log("👤 [EnhancedGhostWriter] User:", userId);

      const peqData = await this.extractPEQData(brandProfile);
      const conceptsResult = await this.generateContentConcepts(peqData, brandProfile);
      const ideas = await this.convertConceptsToHooks(conceptsResult.concepts ?? [], userId, cycleId, brandProfile);
      await this.saveIdeasToDatabase(ideas);

      const processingTime = Date.now() - startTime;
      console.log(`🎉 [EnhancedGhostWriter] Generation complete: ${ideas.length} ideas in ${processingTime}ms`);

      return {
        success: true,
        ideas,
        metadata: {
          peqData,
          conceptsGenerated: conceptsResult.concepts?.length ?? 0,
          hooksGenerated: ideas.length,
          processingTime,
        },
      };
    } catch (error) {
      return this.handleGenerationError(error, Date.now() - startTime);
    }
  }

  /**
   * Extract PEQ data from brand profile
   */
  private static async extractPEQData(brandProfile: BrandProfile): Promise<PEQData> {
    console.log("📊 [EnhancedGhostWriter] Step 1: Extracting PEQ data");
    const peqResult = await PEQExtractionService.extractPEQ(brandProfile.questionnaire);

    if (!peqResult.success || !peqResult.data) {
      throw new Error(`Failed to extract PEQ data: ${peqResult.error}`);
    }

    console.log("✅ [EnhancedGhostWriter] PEQ extraction successful");
    return peqResult.data;
  }

  /**
   * Convert concepts to hooks using hook generation with diverse styles
   * Now uses 25+ different hook templates with random selection each generation
   * to ensure maximum variety and prevent repetitive patterns
   */
  private static async convertConceptsToHooks(
    concepts: Array<{ concept: string; peqCategory: "problem" | "excuse" | "question"; sourceText: string }>,
    userId: string,
    cycleId: string,
    brandProfile: BrandProfile,
  ): Promise<EnhancedContentIdea[]> {
    console.log("🎣 [EnhancedGhostWriter] Step 3: Converting concepts to hooks with diverse styles");
    const ideas: EnhancedContentIdea[] = [];

    // Define comprehensive hook style categories to ensure maximum variety
    const allHookStyleCategories = [
      // Conditional hooks
      "IF-AND-THEN",
      "IF-BUT-ONE",
      "IF-HERE IS WHAT I'D DO",
      "BEFORE",
      "WHENEVER",

      // Audience-focused hooks
      "YOU-YOUR",
      "YOU KNOW WHEN YOU",
      "YOU KNOW THOSE",
      "HAVE YOU EVER",

      // Personal story hooks
      "ME-YOU",
      "I-YOU",
      "I-EVEN THOUGH I AM NOT",
      "HATE",

      // Action & list hooks
      "SHOULD/MUST",
      "DO",
      "STOP",
      "STEAL",
      "TOP 3",
      "THIS",
      "THIS IS HOW/WHAT",

      // Reveal & insight hooks
      "SIGNS/TRAITS",
      "SECRET",
      "HAVE IN COMMON",
      "SCARY",
      "WHY/REASON",
    ];

    // Shuffle the hook styles to ensure different patterns each generation
    const shuffledHookStyles = [...allHookStyleCategories].sort(() => Math.random() - 0.5);

    // Select the first 9 unique hook styles for this generation
    const hookStyleCategories = shuffledHookStyles.slice(0, Math.min(9, concepts.length));

    console.log("🎭 [EnhancedGhostWriter] Selected hook styles for this generation:", hookStyleCategories);

    // Generate ideas in parallel for better performance
    console.log("🚀 [EnhancedGhostWriter] Starting parallel idea generation");
    const ideaPromises = concepts.map((concept, i) => {
      const preferredStyle = hookStyleCategories[i % hookStyleCategories.length];
      return this.createIdeaFromConcept(concept, userId, cycleId, brandProfile, preferredStyle);
    });

    // Wait for all ideas to complete
    const ideaResults = await Promise.all(ideaPromises);
    const generatedIdeas = ideaResults.filter((idea): idea is EnhancedContentIdea => idea !== null);

    console.log(
      `✅ [EnhancedGhostWriter] Parallel generation complete: ${generatedIdeas.length}/${concepts.length} ideas generated`,
    );

    // Add to the existing ideas array
    ideas.push(...generatedIdeas);

    return ideas;
  }

  /**
   * Create an idea from a concept
   */
  private static async createIdeaFromConcept(
    concept: { concept: string; peqCategory: "problem" | "excuse" | "question"; sourceText: string },
    userId: string,
    cycleId: string,
    brandProfile: BrandProfile,
    preferredStyle?: string,
  ): Promise<EnhancedContentIdea | null> {
    try {
      const hookResult = await this.generateHookForConcept(concept.concept, preferredStyle);

      let hook = concept.concept;
      let hookTemplate = "Concept";
      let hookStrength = "curiosity";
      let wordCount = concept.concept.split(/\s+/).length;

      if (hookResult.success && hookResult.hook) {
        hook = hookResult.hook.hook;
        hookTemplate = hookResult.hook.template;
        hookStrength = hookResult.hook.strength;
        wordCount = hook.split(/\s+/).length;
        console.log(
          `✅ [EnhancedGhostWriter] Generated hook using template: ${hookTemplate} (preferred: ${preferredStyle})`,
        );
      } else {
        console.warn(`⚠️ [EnhancedGhostWriter] Hook generation failed, using concept as-is: ${hookResult.error}`);
      }

      return {
        id: `${cycleId}_${concept.peqCategory}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        concept: concept.concept,
        hook,
        hookTemplate,
        hookStrength,
        peqCategory: concept.peqCategory,
        sourceText: concept.sourceText,
        targetAudience: this.getTargetAudience(brandProfile),
        estimatedDuration: "60",
        createdAt: new Date().toISOString(),
        userId,
        cycleId,
        wordCount,
      };
    } catch (error) {
      console.error("❌ [EnhancedGhostWriter] Failed to process concept:", error);
      return null;
    }
  }

  /**
   * Save ideas to database
   */
  private static async saveIdeasToDatabase(ideas: EnhancedContentIdea[]): Promise<void> {
    if (ideas.length === 0) return;

    console.log("💾 [EnhancedGhostWriter] Saving ideas to database");
    const batch = adminDb.batch();

    for (const idea of ideas) {
      const docRef = adminDb.collection(this.COLLECTIONS.ENHANCED_CONTENT_IDEAS).doc();
      batch.set(docRef, { ...idea, id: docRef.id });
    }

    await batch.commit();
    console.log(`✅ [EnhancedGhostWriter] Saved ${ideas.length} ideas to database`);
  }

  /**
   * Handle generation errors
   */
  private static handleGenerationError(error: unknown, processingTime: number): IdeaGenerationResult {
    console.error("❌ [EnhancedGhostWriter] Failed to generate enhanced ideas:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      metadata: {
        peqData: { problems: [], excuses: [], questions: [] },
        conceptsGenerated: 0,
        hooksGenerated: 0,
        processingTime,
      },
    };
  }

  /**
   * Generate content concepts based on PEQ data
   */
  private static async generateContentConcepts(
    peqData: PEQData,
    brandProfile: BrandProfile,
  ): Promise<ConceptGenerationResult> {
    try {
      const prompt = this.buildConceptGenerationPrompt(peqData, brandProfile);

      const result = await GeminiService.generateContent({
        prompt,
        maxTokens: 1200,
        temperature: 0.8,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to generate concepts");
      }

      const text = result.content!;
      console.log("🤖 [EnhancedGhostWriter] Raw concept response:", text);

      // Parse the JSON response
      let parsedConcepts;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        parsedConcepts = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("❌ [EnhancedGhostWriter] Failed to parse concepts:", parseError);
        throw new Error("Failed to parse AI response");
      }

      // Convert to concept array
      const concepts: Array<{
        concept: string;
        peqCategory: "problem" | "excuse" | "question";
        sourceText: string;
      }> = [];

      // Process problems
      if (parsedConcepts.problem_concepts) {
        parsedConcepts.problem_concepts.forEach((item: { concept: string }, index: number) => {
          concepts.push({
            concept: item.concept,
            peqCategory: "problem",
            sourceText: peqData.problems[index] ?? "Problem-based content",
          });
        });
      }

      // Process excuses
      if (parsedConcepts.excuse_concepts) {
        parsedConcepts.excuse_concepts.forEach((item: { concept: string }, index: number) => {
          concepts.push({
            concept: item.concept,
            peqCategory: "excuse",
            sourceText: peqData.excuses[index] ?? "Excuse-based content",
          });
        });
      }

      // Process questions
      if (parsedConcepts.question_concepts) {
        parsedConcepts.question_concepts.forEach((item: { concept: string }, index: number) => {
          concepts.push({
            concept: item.concept,
            peqCategory: "question",
            sourceText: peqData.questions[index] ?? "Question-based content",
          });
        });
      }

      // Limit to target count and ensure variety
      const selectedConcepts = this.selectBestConcepts(concepts, this.IDEAS_PER_CYCLE);

      return {
        success: true,
        concepts: selectedConcepts,
      };
    } catch (error) {
      console.error("❌ [EnhancedGhostWriter] Failed to generate concepts:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build the concept generation prompt
   */
  private static buildConceptGenerationPrompt(peqData: PEQData, brandProfile: BrandProfile): string {
    return `You are a world-class content strategist specializing in viral short-form video content. Your task is to generate compelling content concepts based on the Problems, Excuses, and Questions (PEQ) framework.

BRAND CONTEXT:
- Business/Profession: ${brandProfile.questionnaire.profession}
- Brand Personality: ${brandProfile.questionnaire.brandPersonality}
- Target Transformation: ${brandProfile.questionnaire.ultimateTransformation}

PEQ DATA EXTRACTED FROM BRAND PROFILE:

PROBLEMS:
${peqData.problems.map((p, i) => `${i + 1}. ${p}`).join("\n")}

EXCUSES:
${peqData.excuses.map((e, i) => `${i + 1}. ${e}`).join("\n")}

QUESTIONS:
${peqData.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

TASK:
Generate 3 content concepts for each PEQ category (9 total). Each concept should be a complete content idea that addresses the specific PEQ item and provides value to the audience.

CRITICAL OUTPUT REQUIREMENT: 
Your response must start IMMEDIATELY with the opening brace { and contain NOTHING else except the JSON object.

Expected JSON format:
{
  "problem_concepts": [
    {
      "concept": "Complete content idea addressing problem 1",
      "target_problem": "The specific problem being addressed"
    },
    {
      "concept": "Complete content idea addressing problem 2", 
      "target_problem": "The specific problem being addressed"
    },
    {
      "concept": "Complete content idea addressing problem 3",
      "target_problem": "The specific problem being addressed"
    }
  ],
  "excuse_concepts": [
    {
      "concept": "Complete content idea addressing excuse 1",
      "target_excuse": "The specific excuse being addressed"
    },
    {
      "concept": "Complete content idea addressing excuse 2",
      "target_excuse": "The specific excuse being addressed"
    },
    {
      "concept": "Complete content idea addressing excuse 3",
      "target_excuse": "The specific excuse being addressed"
    }
  ],
  "question_concepts": [
    {
      "concept": "Complete content idea addressing question 1",
      "target_question": "The specific question being addressed"
    },
    {
      "concept": "Complete content idea addressing question 2",
      "target_question": "The specific question being addressed"
    },
    {
      "concept": "Complete content idea addressing question 3",
      "target_question": "The specific question being addressed"
    }
  ]
}

GUIDELINES:
- Each concept should be 2-3 sentences describing the complete content idea
- Make concepts actionable and valuable
- Ensure variety in approach and complexity
- Focus on transformation and results
- Use the brand personality to inform tone and style

CRITICAL FORMATTING RULES:
- DO NOT use asterisks (*) or double asterisks (**) anywhere in your response
- Write all text in plain format without markdown formatting
- Use clean, readable text without special characters for emphasis
- Keep all content natural and conversational

FINAL REMINDER: Your response must be PURE JSON starting with { and ending with }. No other text whatsoever.`;
  }

  /**
   * Select the best concepts ensuring variety across PEQ categories
   */
  private static selectBestConcepts(
    concepts: Array<{
      concept: string;
      peqCategory: "problem" | "excuse" | "question";
      sourceText: string;
    }>,
    targetCount: number,
  ): Array<{
    concept: string;
    peqCategory: "problem" | "excuse" | "question";
    sourceText: string;
  }> {
    const categories: Array<"problem" | "excuse" | "question"> = ["problem", "excuse", "question"];
    const conceptsPerCategory = Math.floor(targetCount / categories.length);
    const remainder = targetCount % categories.length;

    const selected: typeof concepts = [];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const categoryConcepts = concepts.filter((concept) => concept.peqCategory === category);
      const count = conceptsPerCategory + (i < remainder ? 1 : 0);

      selected.push(...categoryConcepts.slice(0, count));
    }

    // Fill remaining slots if needed
    const remaining = targetCount - selected.length;
    if (remaining > 0) {
      const unusedConcepts = concepts.filter((concept) => !selected.includes(concept));
      selected.push(...unusedConcepts.slice(0, remaining));
    }

    return selected.slice(0, targetCount);
  }

  /**
   * Get target audience from brand profile
   */
  private static getTargetAudience(brandProfile: BrandProfile): string {
    // Extract target audience from brand profile or use a default
    const profession = brandProfile.questionnaire.profession;
    const problem = brandProfile.questionnaire.universalProblem;

    return `People in ${profession} struggling with ${problem ?? "content creation"}`;
  }

  /**
   * Generate a hook for a specific concept with preferred style
   */
  private static async generateHookForConcept(
    concept: string,
    preferredStyle?: string,
  ): Promise<{ success: boolean; hook?: GeneratedHook; error?: string }> {
    try {
      const prompt = createHookGenerationPrompt(concept);

      const result = await GeminiService.generateContent({
        prompt,
        maxTokens: 1000,
        temperature: 0.8,
      });

      if (!result.success || !result.content) {
        throw new Error(result.error ?? "Failed to generate hook");
      }

      // Parse the JSON response
      let parsedHooks;
      try {
        // Try to find valid JSON by looking for code blocks first
        const codeBlockMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonText = "";

        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim();
        } else {
          // Fallback to finding JSON object
          const jsonMatch = result.content.match(/\{[\s\S]*?\}\s*(?=\n|$)/);
          if (!jsonMatch) {
            console.warn("⚠️ [EnhancedGhostWriter] No JSON found in response, using concept as-is");
            return {
              success: false,
              error: "No JSON found in hook generation response",
            };
          }
          jsonText = jsonMatch[0];
        }

        // Clean up common JSON formatting issues
        jsonText = jsonText
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
          .replace(/\n/g, " ") // Replace newlines with spaces
          .trim();

        parsedHooks = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("❌ [EnhancedGhostWriter] Failed to parse hooks:", parseError);
        console.error("❌ [EnhancedGhostWriter] Raw response:", result.content);

        // Return a fallback instead of throwing
        return {
          success: false,
          error: "Failed to parse hook generation response",
        };
      }

      if (parsedHooks.hooks && parsedHooks.hooks.length > 0) {
        const hooks = parsedHooks.hooks;

        // If we have a preferred style, try to find a hook that matches
        if (preferredStyle) {
          const matchingHook = hooks.find(
            (hook: GeneratedHook) =>
              hook.template.includes(preferredStyle) ||
              hook.template.toLowerCase().includes(preferredStyle.toLowerCase()),
          );

          if (matchingHook) {
            console.log(`🎯 [EnhancedGhostWriter] Found matching hook for preferred style: ${preferredStyle}`);
            return {
              success: true,
              hook: matchingHook,
            };
          }
        }

        // If no preferred style match found, use smart selection to avoid repetition
        const selectedHook = this.selectDiverseHook(hooks);

        return {
          success: true,
          hook: selectedHook,
        };
      } else {
        throw new Error("No hooks found in response");
      }
    } catch (error) {
      console.error("❌ [EnhancedGhostWriter] Failed to generate hook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Select a diverse hook from available options to avoid repetition
   */
  private static selectDiverseHook(hooks: GeneratedHook[]): GeneratedHook {
    // Define comprehensive template priority for maximum diversity
    const templatePriority = [
      // Conditional hooks
      "IF-AND-THEN",
      "IF-BUT-ONE",
      "IF-HERE IS WHAT I'D DO",
      "BEFORE",
      "WHENEVER",

      // Audience-focused hooks
      "YOU-YOUR",
      "YOU KNOW WHEN YOU",
      "YOU KNOW THOSE",
      "HAVE YOU EVER",

      // Personal story hooks
      "ME-YOU",
      "I-YOU",
      "I-EVEN THOUGH I AM NOT",
      "HATE",

      // Action & list hooks
      "SHOULD/MUST",
      "DO",
      "STOP",
      "STEAL",
      "TOP 3",
      "THIS",
      "THIS IS HOW/WHAT",

      // Reveal & insight hooks
      "SIGNS/TRAITS",
      "SECRET",
      "HAVE IN COMMON",
      "SCARY",
      "WHY/REASON",
    ];

    // Shuffle the priority list to ensure random selection order
    const shuffledPriority = [...templatePriority].sort(() => Math.random() - 0.5);

    // Try to find a hook that matches our shuffled priority templates
    for (const priority of shuffledPriority) {
      const matchingHook = hooks.find(
        (hook) => hook.template.includes(priority) || hook.template.toLowerCase().includes(priority.toLowerCase()),
      );

      if (matchingHook) {
        return matchingHook;
      }
    }

    // If no priority match found, return a random hook to ensure variety
    const randomIndex = Math.floor(Math.random() * hooks.length);
    return hooks[randomIndex];
  }

  /**
   * Get enhanced ideas for a user's current cycle
   */
  static async getEnhancedIdeasForUser(userId: string, cycleId: string): Promise<EnhancedContentIdea[]> {
    const snapshot = await adminDb
      .collection(this.COLLECTIONS.ENHANCED_CONTENT_IDEAS)
      .where("userId", "==", userId)
      .where("cycleId", "==", cycleId)
      .get();

    const ideas = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as EnhancedContentIdea,
    );

    // Sort by createdAt descending
    return ideas.sort(
      (a: EnhancedContentIdea, b: EnhancedContentIdea) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Save ideas to the ghost writer library
   */
  static async saveIdeasToLibrary(userId: string, ideas: EnhancedContentIdea[]): Promise<void> {
    if (ideas.length === 0) return;

    console.log(`📚 [EnhancedGhostWriter] Saving ${ideas.length} ideas to library for user: ${userId}`);
    const batch = adminDb.batch();
    const libraryCollection = adminDb.collection("ghost_writer_library");

    for (const idea of ideas) {
      const libraryDoc = libraryCollection.doc();
      const libraryItem = {
        id: libraryDoc.id,
        userId,
        originalIdeaId: idea.id,
        concept: idea.concept || "",
        hook: idea.hook || idea.concept || "", // Fallback to concept if hook is undefined
        hookTemplate: idea.hookTemplate || "Concept",
        hookStrength: idea.hookStrength || 0,
        peqCategory: idea.peqCategory || "problem",
        sourceText: idea.sourceText || "",
        targetAudience: idea.targetAudience || "",
        estimatedDuration: idea.estimatedDuration || "60",
        wordCount: idea.wordCount || 0,
        originalCycleId: idea.cycleId || "",
        savedToLibraryAt: new Date().toISOString(),
      };

      batch.set(libraryDoc, libraryItem);
    }

    // Delete the original ideas from the current cycle
    for (const idea of ideas) {
      const originalDoc = adminDb.collection(this.COLLECTIONS.ENHANCED_CONTENT_IDEAS).doc(idea.id);
      batch.delete(originalDoc);
    }

    await batch.commit();
    console.log(`✅ [EnhancedGhostWriter] Successfully saved ${ideas.length} ideas to library`);
  }
}
