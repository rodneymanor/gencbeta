import { adminDb } from "@/lib/firebase-admin";
import { GeminiService } from "@/lib/gemini";
import { 
  ContentIdea, 
  ContentPillar, 
  GhostWriterCycle, 
  UserGhostWriterData,
  BrandProfileForIdeas,
  IdeaGenerationRequest,
  CONTENT_PILLARS
} from "@/types/ghost-writer";

export class GhostWriterService {
  private static readonly COLLECTIONS = {
    GHOST_WRITER_CYCLES: "ghost_writer_cycles",
    CONTENT_IDEAS: "content_ideas", 
    USER_GHOST_WRITER_DATA: "user_ghost_writer_data",
  } as const;

  private static readonly CYCLE_DURATION_HOURS = 12;
  private static readonly IDEAS_PER_CYCLE = 6;

  /**
   * Get the current global cycle or create a new one if expired
   */
  static async getCurrentCycle(): Promise<GhostWriterCycle> {
    const now = new Date();
    
    // Check for active global cycle
    const activeCycleSnapshot = await adminDb
      .collection(this.COLLECTIONS.GHOST_WRITER_CYCLES)
      .where("status", "==", "active")
      .where("globalCycle", "==", true)
      .orderBy("generatedAt", "desc")
      .limit(1)
      .get();

    if (!activeCycleSnapshot.empty) {
      const cycle = { 
        id: activeCycleSnapshot.docs[0].id, 
        ...activeCycleSnapshot.docs[0].data() 
      } as GhostWriterCycle;
      
      // Check if cycle is still valid
      if (new Date(cycle.expiresAt) > now) {
        return cycle;
      } else {
        // Mark as expired
        await adminDb
          .collection(this.COLLECTIONS.GHOST_WRITER_CYCLES)
          .doc(cycle.id)
          .update({ status: "expired" });
      }
    }

    // Create new cycle
    return this.createNewCycle();
  }

  /**
   * Create a new global cycle
   */
  private static async createNewCycle(): Promise<GhostWriterCycle> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.CYCLE_DURATION_HOURS * 60 * 60 * 1000));
    
    // Get the latest cycle number
    const latestCycleSnapshot = await adminDb
      .collection(this.COLLECTIONS.GHOST_WRITER_CYCLES)
      .orderBy("cycleNumber", "desc")
      .limit(1)
      .get();

    const cycleNumber = latestCycleSnapshot.empty 
      ? 1 
      : (latestCycleSnapshot.docs[0].data().cycleNumber + 1);

    const newCycle: Omit<GhostWriterCycle, "id"> = {
      cycleNumber,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "active",
      totalIdeas: 0,
      globalCycle: true,
    };

    const docRef = await adminDb
      .collection(this.COLLECTIONS.GHOST_WRITER_CYCLES)
      .add(newCycle);

    console.log(`🔄 [GhostWriter] Created new global cycle ${cycleNumber}`);

    return {
      id: docRef.id,
      ...newCycle,
    };
  }

  /**
   * Generate content ideas for a user based on their brand profile
   */
  static async generateIdeasForUser(
    userId: string, 
    brandProfile: BrandProfileForIdeas,
    cycleId: string
  ): Promise<ContentIdea[]> {
    try {
      console.log(`🎯 [GhostWriter] Generating ideas for user ${userId}`);

      const prompt = this.buildIdeaGenerationPrompt(brandProfile);
      
      const result = await GeminiService.generateContent({
        prompt,
        maxTokens: 2000,
        temperature: 0.8,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to generate content with Gemini");
      }

      const text = result.content!;
      console.log("🤖 [GhostWriter] Raw AI response:", text);

      // Parse the JSON response
      let parsedIdeas;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("❌ [GhostWriter] No JSON found in AI response");
          throw new Error("No JSON found in response");
        }
        console.log("🔍 [GhostWriter] Extracted JSON:", jsonMatch[0]);
        parsedIdeas = JSON.parse(jsonMatch[0]);
        console.log("✅ [GhostWriter] Parsed ideas:", JSON.stringify(parsedIdeas, null, 2));
      } catch (parseError) {
        console.error("❌ [GhostWriter] Failed to parse AI response:", parseError);
        console.error("❌ [GhostWriter] Raw text was:", text);
        throw new Error("Failed to parse AI response");
      }

      // Convert to ContentIdea objects
      const ideas: ContentIdea[] = [];
      const pillars = Object.keys(parsedIdeas) as ContentPillar[];
      
      for (const pillar of pillars) {
        if (parsedIdeas[pillar] && Array.isArray(parsedIdeas[pillar])) {
          for (const ideaData of parsedIdeas[pillar]) {
            const idea: ContentIdea = {
              id: `${cycleId}_${pillar}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: ideaData.title || ideaData.hook || "Untitled Idea",
              description: ideaData.description || ideaData.script_outline || "",
              pillar,
              hook: ideaData.hook || ideaData.title || "",
              scriptOutline: ideaData.script_outline || ideaData.description || "",
              targetAudience: ideaData.target_audience || brandProfile.targetAudience,
              callToAction: ideaData.call_to_action || "Follow for more tips!",
              estimatedDuration: ideaData.estimated_duration || "60",
              tags: ideaData.tags || [],
              difficulty: ideaData.difficulty || "intermediate",
              createdAt: new Date().toISOString(),
              userId,
              cycleId,
            };
            ideas.push(idea);
          }
        }
      }

      // Limit to 6 ideas and ensure we have a good distribution
      const selectedIdeas = this.selectBestIdeas(ideas, 6);

      // Save ideas to database
      const batch = adminDb.batch();
      for (const idea of selectedIdeas) {
        const docRef = adminDb.collection(this.COLLECTIONS.CONTENT_IDEAS).doc();
        batch.set(docRef, { ...idea, id: docRef.id });
      }
      await batch.commit();

      console.log(`✅ [GhostWriter] Generated ${selectedIdeas.length} ideas for user ${userId}`);
      return selectedIdeas;

    } catch (error) {
      console.error("❌ [GhostWriter] Failed to generate ideas:", error);
      throw error;
    }
  }

  /**
   * Build the AI prompt for idea generation
   */
  private static buildIdeaGenerationPrompt(brandProfile: BrandProfileForIdeas): string {
    return `You are a world-class content strategist and viral video specialist. Generate 6 highly-tailored short-form video content ideas based on the brand profile below.

BRAND PROFILE:
- Business/Profession: ${brandProfile.businessProfession}
- Brand Personality: ${brandProfile.brandPersonality}  
- Universal Problem: ${brandProfile.universalProblem}
- Initial Hurdle: ${brandProfile.initialHurdle}
- Persistent Struggle: ${brandProfile.persistentStruggle}
- Visible Triumph: ${brandProfile.visibleTriumph}
- Ultimate Transformation: ${brandProfile.ultimateTransformation}
- Content Pillars: ${brandProfile.contentPillars.join(", ")}
- Target Audience: ${brandProfile.targetAudience}
- Brand Voice: ${brandProfile.brandVoice}
- Industry: ${brandProfile.industry}

Generate ideas using the "Problems, Excuses, Questions" (PEQ) framework, addressing the audience's struggles, justifications for inaction, and direct questions.

Organize into these 5 content pillars, with 1-2 ideas per pillar:

1. **hyper_focused_value**: In-depth, actionable how-to guidance
2. **quick_hit_value**: Quick, high-impact tips for immediate wins  
3. **major_perspective**: Industry insights that shift perspectives
4. **the_trend**: Current events connected to expertise
5. **inspiration_bomb**: Powerful content that inspires action

REQUIRED JSON FORMAT:
{
  "hyper_focused_value": [
    {
      "title": "Compelling video title",
      "hook": "Attention-grabbing opening line",
      "script_outline": "Brief outline of video flow",
      "target_audience": "Specific audience segment",
      "call_to_action": "Clear next step",
      "estimated_duration": "60",
      "tags": ["relevant", "hashtags"],
      "difficulty": "intermediate"
    }
  ],
  "quick_hit_value": [...],
  "major_perspective": [...],
  "the_trend": [...],
  "inspiration_bomb": [...]
}

Make each idea specific to the brand voice (${brandProfile.brandVoice}) and directly address the problems/excuses/questions from the brand profile. Ensure variety in difficulty and duration.`;
  }

  /**
   * Select the best ideas ensuring good distribution across pillars
   */
  private static selectBestIdeas(ideas: ContentIdea[], targetCount: number): ContentIdea[] {
    const pillars = Object.keys(CONTENT_PILLARS) as ContentPillar[];
    const ideasPerPillar = Math.floor(targetCount / pillars.length);
    const remainder = targetCount % pillars.length;
    
    const selected: ContentIdea[] = [];
    
    for (let i = 0; i < pillars.length; i++) {
      const pillar = pillars[i];
      const pillarIdeas = ideas.filter(idea => idea.pillar === pillar);
      const count = ideasPerPillar + (i < remainder ? 1 : 0);
      
      selected.push(...pillarIdeas.slice(0, count));
    }
    
    // Fill remaining slots if needed
    const remaining = targetCount - selected.length;
    if (remaining > 0) {
      const unusedIdeas = ideas.filter(idea => !selected.includes(idea));
      selected.push(...unusedIdeas.slice(0, remaining));
    }
    
    return selected.slice(0, targetCount);
  }

  /**
   * Get ideas for a user's current cycle
   */
  static async getIdeasForUser(userId: string, cycleId: string): Promise<ContentIdea[]> {
    const snapshot = await adminDb
      .collection(this.COLLECTIONS.CONTENT_IDEAS)
      .where("userId", "==", userId)
      .where("cycleId", "==", cycleId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContentIdea));
  }

  /**
   * Get or create user ghost writer data
   */
  static async getUserData(userId: string): Promise<UserGhostWriterData> {
    const snapshot = await adminDb
      .collection(this.COLLECTIONS.USER_GHOST_WRITER_DATA)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as UserGhostWriterData;
    }

    // Create new user data
    const userData: Omit<UserGhostWriterData, "id"> = {
      userId,
      currentCycleId: "",
      lastAccessedAt: new Date().toISOString(),
      savedIdeas: [],
      dismissedIdeas: [],
      totalIdeasGenerated: 0,
      totalIdeasUsed: 0,
      preferences: {
        pillarsEnabled: Object.keys(CONTENT_PILLARS) as ContentPillar[],
        preferredDuration: ["20", "60", "90"],
        difficulty: ["beginner", "intermediate", "advanced"],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb
      .collection(this.COLLECTIONS.USER_GHOST_WRITER_DATA)
      .add(userData);

    return {
      id: docRef.id,
      ...userData,
    };
  }

  /**
   * Save an idea to user's saved list
   */
  static async saveIdea(userId: string, ideaId: string): Promise<void> {
    const userData = await this.getUserData(userId);
    
    if (!userData.savedIdeas.includes(ideaId)) {
      await adminDb
        .collection(this.COLLECTIONS.USER_GHOST_WRITER_DATA)
        .doc(userData.id!)
        .update({
          savedIdeas: [...userData.savedIdeas, ideaId],
          updatedAt: new Date().toISOString(),
        });
    }
  }

  /**
   * Dismiss an idea
   */
  static async dismissIdea(userId: string, ideaId: string): Promise<void> {
    const userData = await this.getUserData(userId);
    
    if (!userData.dismissedIdeas.includes(ideaId)) {
      await adminDb
        .collection(this.COLLECTIONS.USER_GHOST_WRITER_DATA)
        .doc(userData.id!)
        .update({
          dismissedIdeas: [...userData.dismissedIdeas, ideaId],
          updatedAt: new Date().toISOString(),
        });
    }
  }
} 