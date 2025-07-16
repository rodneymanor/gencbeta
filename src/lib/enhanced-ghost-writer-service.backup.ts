import { adminDb } from "@/lib/firebase-admin";
import { GeminiService } from "@/lib/gemini";
import { PEQExtractionService, PEQData } from "@/lib/peq-extraction-service";
import { VoiceTemplateProcessor } from "@/lib/voice-template-processor";
import { AIVoice } from "@/types/ai-voices";
import { BrandProfile } from "@/types/brand-profile";

export interface EnhancedContentIdea {
  id: string;
  concept: string;
  script: string;
  peqCategory: "problem" | "excuse" | "question";
  sourceText: string;
  targetAudience: string;
  estimatedDuration: string;
  createdAt: string;
  userId: string;
  cycleId: string;
  voiceTemplateId?: string;
  wordCount: number;
}

export interface IdeaGenerationResult {
  success: boolean;
  ideas?: EnhancedContentIdea[];
  error?: string;
  metadata?: {
    peqData: PEQData;
    conceptsGenerated: number;
    scriptsGenerated: number;
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

  private static readonly IDEAS_PER_CYCLE = 6;

  /**
   * Generate enhanced content ideas using PEQ framework (two-step process)
   */
  static async generateEnhancedIdeas(
    userId: string,
    brandProfile: BrandProfile,
    cycleId: string,
    activeVoice?: AIVoice | null,
  ): Promise<IdeaGenerationResult> {
    const startTime = Date.now();

    try {
      console.log("🎯 [EnhancedGhostWriter] Starting two-step idea generation");
      console.log("👤 [EnhancedGhostWriter] User:", userId);
      console.log("🎤 [EnhancedGhostWriter] Active voice:", activeVoice ? activeVoice.name : "None");

      // Step 1: Extract PEQ data from brand profile
      console.log("📊 [EnhancedGhostWriter] Step 1: Extracting PEQ data");
      const peqResult = await PEQExtractionService.extractPEQ(brandProfile.questionnaire);

      if (!peqResult.success || !peqResult.data) {
        throw new Error(`Failed to extract PEQ data: ${peqResult.error}`);
      }

      console.log("✅ [EnhancedGhostWriter] PEQ extraction successful");
      const peqData = peqResult.data;

      // Step 2: Generate content concepts based on PEQ
      console.log("💡 [EnhancedGhostWriter] Step 2: Generating content concepts");
      const conceptsResult = await this.generateContentConcepts(peqData, brandProfile);

      if (!conceptsResult.success || !conceptsResult.concepts) {
        throw new Error(`Failed to generate concepts: ${conceptsResult.error}`);
      }

      console.log(`✅ [EnhancedGhostWriter] Generated ${conceptsResult.concepts.length} concepts`);

      // Step 3: Convert concepts to scripts using voice templates
      console.log("📝 [EnhancedGhostWriter] Step 3: Converting concepts to scripts");
      const ideas: EnhancedContentIdea[] = [];

      for (const concept of conceptsResult.concepts) {
        try {
          let script = concept.concept; // Fallback if no voice processing
          let voiceTemplateId: string | undefined;
          let wordCount = concept.concept.split(/\s+/).length;

          // If voice is available, process through voice template
          if (activeVoice && activeVoice.templates && activeVoice.templates.length > 0) {
            const selectedTemplate = VoiceTemplateProcessor.selectRandomTemplate(activeVoice);

            if (selectedTemplate) {
              const targetWordCount = VoiceTemplateProcessor.calculateTargetWordCount(selectedTemplate, 60);

              const processingResult = await VoiceTemplateProcessor.processContent({
                sourceContent: concept.concept,
                voiceTemplate: selectedTemplate,
                targetWordCount,
              });

              if (processingResult.success && processingResult.script) {
                script = processingResult.script;
                voiceTemplateId = selectedTemplate.id;
                wordCount = processingResult.metadata?.wordCount || wordCount;
                console.log(`✅ [EnhancedGhostWriter] Processed concept through voice template: ${voiceTemplateId}`);
              } else {
                console.warn(
                  `⚠️ [EnhancedGhostWriter] Voice processing failed, using concept as-is: ${processingResult.error}`,
                );
              }
            }
          }

          const idea: EnhancedContentIdea = {
            id: `${cycleId}_${concept.peqCategory}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            concept: concept.concept,
            script,
            peqCategory: concept.peqCategory,
            sourceText: concept.sourceText,
            targetAudience: this.getTargetAudience(brandProfile),
            estimatedDuration: "60",
            createdAt: new Date().toISOString(),
            userId,
            cycleId,
            voiceTemplateId,
            wordCount,
          };

          ideas.push(idea);
        } catch (error) {
          console.error("❌ [EnhancedGhostWriter] Failed to process concept:", error);
          // Continue with other concepts
        }
      }

      // Save ideas to database
      if (ideas.length > 0) {
        console.log("💾 [EnhancedGhostWriter] Saving ideas to database");
        const batch = adminDb.batch();

        for (const idea of ideas) {
          const docRef = adminDb.collection(this.COLLECTIONS.ENHANCED_CONTENT_IDEAS).doc();
          batch.set(docRef, { ...idea, id: docRef.id });
        }

        await batch.commit();
        console.log(`✅ [EnhancedGhostWriter] Saved ${ideas.length} ideas to database`);
      }

      const processingTime = Date.now() - startTime;
      console.log(`🎉 [EnhancedGhostWriter] Generation complete: ${ideas.length} ideas in ${processingTime}ms`);

      return {
        success: true,
        ideas,
        metadata: {
          peqData,
          conceptsGenerated: conceptsResult.concepts.length,
          scriptsGenerated: ideas.length,
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("❌ [EnhancedGhostWriter] Failed to generate enhanced ideas:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          peqData: { problems: [], excuses: [], questions: [] },
          conceptsGenerated: 0,
          scriptsGenerated: 0,
          processingTime,
        },
      };
    }
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
        parsedConcepts.problem_concepts.forEach((item: any, index: number) => {
          concepts.push({
            concept: item.concept,
            peqCategory: "problem",
            sourceText: peqData.problems[index] || "Problem-based content",
          });
        });
      }

      // Process excuses
      if (parsedConcepts.excuse_concepts) {
        parsedConcepts.excuse_concepts.forEach((item: any, index: number) => {
          concepts.push({
            concept: item.concept,
            peqCategory: "excuse",
            sourceText: peqData.excuses[index] || "Excuse-based content",
          });
        });
      }

      // Process questions
      if (parsedConcepts.question_concepts) {
        parsedConcepts.question_concepts.forEach((item: any, index: number) => {
          concepts.push({
            concept: item.concept,
            peqCategory: "question",
            sourceText: peqData.questions[index] || "Question-based content",
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
Generate 2 content concepts for each PEQ category (6 total). Each concept should be a complete content idea that addresses the specific PEQ item and provides value to the audience.

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
    }
  ]
}

GUIDELINES:
- Each concept should be 2-3 sentences describing the complete content idea
- Make concepts actionable and valuable
- Ensure variety in approach and complexity
- Focus on transformation and results
- Use the brand personality to inform tone and style

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

    return `People in ${profession} struggling with ${problem}`;
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
}
