import {
  AIVoice,
  VoiceCreationRequest,
  VoiceActivationResponse,
  CustomVoiceLimit,
  VoiceTemplate,
} from "@/types/ai-voices";

import { adminDb } from "./firebase-admin";
import { TemplateGenerator } from "./template-generator-service";

export class AIVoicesService {
  private static readonly CUSTOM_VOICE_LIMIT = 3;
  private static readonly COLLECTION_NAME = "aiVoices";

  /**
   * Get all available voices (shared + user's custom voices)
   */
  static async getAvailableVoices(userId: string): Promise<{ sharedVoices: AIVoice[]; customVoices: AIVoice[] }> {
    try {
      // Get shared voices (isShared = true, userId = null)
      const sharedSnapshot = await adminDb.collection(this.COLLECTION_NAME).where("isShared", "==", true).get();

      const sharedVoices = sharedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AIVoice[];

      // Get user's custom voices
      const customSnapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("isShared", "==", false)
        .get();

      const customVoices = customSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AIVoice[];

      return { sharedVoices, customVoices };
    } catch (error) {
      console.error("[AIVoicesService] Failed to fetch voices:", error);
      throw new Error("Failed to fetch voices");
    }
  }

  /**
   * Get user's custom voice limit status
   */
  static async getCustomVoiceLimit(userId: string): Promise<CustomVoiceLimit> {
    try {
      const snapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("isShared", "==", false)
        .get();

      const used = snapshot.size;
      const total = this.CUSTOM_VOICE_LIMIT;
      const remaining = Math.max(0, total - used);

      return { used, total, remaining };
    } catch (error) {
      console.error("[AIVoicesService] Failed to get voice limit:", error);
      throw new Error("Failed to get voice limit");
    }
  }

  /**
   * Create a new custom voice from profile URL
   */
  static async createCustomVoice(userId: string, request: VoiceCreationRequest): Promise<AIVoice> {
    try {
      // Check voice limit
      const limit = await this.getCustomVoiceLimit(userId);
      if (limit.remaining <= 0) {
        throw new Error(`Voice limit reached. You can create up to ${this.CUSTOM_VOICE_LIMIT} custom voices.`);
      }

      console.log("[AIVoicesService] Creating custom voice from profile:", request.profileUrl);

      // Extract content from profile (this would integrate with existing video processing)
      const profileContent = await this.extractProfileContent(request.profileUrl, request.platform);

      // Generate templates using template-generator-service
      const templateGenerator = new TemplateGenerator();
      const templates: VoiceTemplate[] = [];

      for (const script of profileContent.scripts) {
        const result = await templateGenerator.generateTemplatesFromTranscription(script.content);

        if (result.success && result.templates && result.originalContent) {
          templates.push({
            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            hook: result.templates.hook,
            bridge: result.templates.bridge,
            nugget: result.templates.nugget,
            wta: result.templates.wta,
            originalContent: result.originalContent,
            sourceVideoId: script.id,
            sourceMetadata: {
              viewCount: script.metrics?.views,
              likeCount: script.metrics?.likes,
              platform: request.platform,
              url: script.source,
            },
          });
        }

        // Add small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (templates.length === 0) {
        throw new Error("Failed to generate any templates from the provided profile");
      }

      // Create voice data
      const voiceData: Omit<AIVoice, "id"> = {
        name: request.voiceName || `${profileContent.creatorName} Voice`,
        badges: this.generateVoiceBadges(templates),
        description: `AI voice inspired by ${profileContent.creatorName}'s content style. Generated from ${templates.length} analyzed scripts.`,
        creatorInspiration: profileContent.creatorName,
        templates,
        exampleScripts: profileContent.scripts,
        isShared: false,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: false,
      };

      // Save to Firestore
      const docRef = await adminDb.collection(this.COLLECTION_NAME).add(voiceData);

      const newVoice: AIVoice = {
        id: docRef.id,
        ...voiceData,
      };

      console.log("[AIVoicesService] Custom voice created successfully:", newVoice.id);
      return newVoice;
    } catch (error) {
      console.error("[AIVoicesService] Failed to create custom voice:", error);
      throw error;
    }
  }

  /**
   * Activate a voice for the user
   */
  static async activateVoice(userId: string, voiceId: string): Promise<VoiceActivationResponse> {
    try {
      // Deactivate all current voices for the user
      const userVoicesSnapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("isActive", "==", true)
        .get();

      const batch = adminDb.batch();

      // Deactivate existing active voices
      userVoicesSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false, updatedAt: new Date().toISOString() });
      });

      // Get the voice to activate
      const voiceDoc = await adminDb.collection(this.COLLECTION_NAME).doc(voiceId).get();
      if (!voiceDoc.exists) {
        throw new Error("Voice not found");
      }

      const voice = voiceDoc.data() as AIVoice;

      // Check if user has access to this voice
      if (!voice.isShared && voice.userId !== userId) {
        throw new Error("Access denied to this voice");
      }

      // Activate the selected voice
      batch.update(voiceDoc.ref, { isActive: true, updatedAt: new Date().toISOString() });

      await batch.commit();

      console.log("[AIVoicesService] Voice activated successfully:", voiceId);

      return {
        success: true,
        voiceName: voice.name,
        message: `${voice.name} is ready to use`,
      };
    } catch (error) {
      console.error("[AIVoicesService] Failed to activate voice:", error);
      throw error;
    }
  }

  /**
   * Get the user's currently active voice
   */
  static async getActiveVoice(userId: string): Promise<AIVoice | null> {
    try {
      // Check user's custom voices first
      const customSnapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!customSnapshot.empty) {
        const doc = customSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AIVoice;
      }

      // Check shared voices
      const sharedSnapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where("isShared", "==", true)
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!sharedSnapshot.empty) {
        const doc = sharedSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AIVoice;
      }

      return null;
    } catch (error) {
      console.error("[AIVoicesService] Failed to get active voice:", error);
      return null;
    }
  }

  /**
   * Get example scripts for a voice
   */
  static async getVoiceExamples(voiceId: string): Promise<OriginalScript[]> {
    try {
      const voiceDoc = await adminDb.collection(this.COLLECTION_NAME).doc(voiceId).get();
      if (!voiceDoc.exists) {
        throw new Error("Voice not found");
      }

      const voice = voiceDoc.data() as AIVoice;
      return voice.exampleScripts || [];
    } catch (error) {
      console.error("[AIVoicesService] Failed to get voice examples:", error);
      throw error;
    }
  }

  /**
   * Delete a custom voice
   */
  static async deleteCustomVoice(userId: string, voiceId: string): Promise<void> {
    try {
      const voiceDoc = await adminDb.collection(this.COLLECTION_NAME).doc(voiceId).get();
      if (!voiceDoc.exists) {
        throw new Error("Voice not found");
      }

      const voice = voiceDoc.data() as AIVoice;

      // Check if user owns this voice
      if (voice.userId !== userId || voice.isShared) {
        throw new Error("Access denied - cannot delete this voice");
      }

      await adminDb.collection(this.COLLECTION_NAME).doc(voiceId).delete();

      console.log("[AIVoicesService] Custom voice deleted successfully:", voiceId);
    } catch (error) {
      console.error("[AIVoicesService] Failed to delete custom voice:", error);
      throw error;
    }
  }

  /**
   * Extract content from social media profile (placeholder implementation)
   */
  private static async extractProfileContent(
    profileUrl: string,
    platform: "tiktok" | "instagram",
  ): Promise<{
    creatorName: string;
    scripts: OriginalScript[];
  }> {
    // This would integrate with existing video processing services
    // For now, return mock data with realistic script content
    console.log("[AIVoicesService] Extracting content from profile:", profileUrl);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate realistic mock scripts that can be properly analyzed
    const mockScripts = [
      {
        id: "script_1",
        title: "Business Growth Script",
        content:
          "If you want to scale your business but keep hitting the same revenue ceiling, here's what you're missing. Most entrepreneurs think they need more customers, but that's not the real problem. The real issue is you're not maximizing the value of your existing customers. Here's what successful businesses do differently: they focus on increasing customer lifetime value through strategic upsells and retention programs. Start implementing a customer success program today and watch your revenue grow without spending more on acquisition.",
        source: profileUrl,
        platform,
        metrics: { views: 125000, likes: 8500 },
      },
      {
        id: "script_2",
        title: "Productivity Hack",
        content:
          "If you're working 12-hour days but still falling behind, you're doing it wrong. I used to be the same way until I discovered this simple system. The problem isn't that you don't have enough time, it's that you're not protecting your energy. Here's the game-changer: batch similar tasks together and eliminate decision fatigue. Block out 2-hour focused work sessions and turn off all notifications. Try this for one week and you'll accomplish more in 6 hours than you used to in 12.",
        source: profileUrl,
        platform,
        metrics: { views: 89000, likes: 6200 },
      },
      {
        id: "script_3",
        title: "Marketing Strategy",
        content:
          "If your marketing feels like you're shouting into the void, here's why. Everyone's trying to be everywhere at once, but that's a recipe for mediocrity. The secret successful brands know is this: dominate one platform before expanding. Pick the platform where your ideal customers spend the most time and become the go-to expert there. Focus all your energy on creating incredible content for that one platform for 90 days and watch your audience explode.",
        source: profileUrl,
        platform,
        metrics: { views: 156000, likes: 11300 },
      },
    ];

    return {
      creatorName: "Sample Creator",
      scripts: mockScripts,
    };
  }

  /**
   * Generate descriptive badges for a voice based on its templates
   */
  private static generateVoiceBadges(templates: VoiceTemplate[]): string[] {
    const badges = [];

    if (templates.length > 50) {
      badges.push("Extensive");
    } else if (templates.length > 20) {
      badges.push("Comprehensive");
    } else {
      badges.push("Focused");
    }

    // Analyze template content for additional badges
    const hasEducational = templates.some(
      (t) =>
        t.hook.toLowerCase().includes("learn") ||
        t.nugget.toLowerCase().includes("tip") ||
        t.nugget.toLowerCase().includes("secret"),
    );

    const hasMotivational = templates.some(
      (t) =>
        t.wta.toLowerCase().includes("start") ||
        t.wta.toLowerCase().includes("action") ||
        t.hook.toLowerCase().includes("success"),
    );

    if (hasEducational) badges.push("Educational");
    if (hasMotivational) badges.push("Motivational");

    // Ensure we have exactly 3 badges
    while (badges.length < 3) {
      badges.push("Professional");
    }

    return badges.slice(0, 3);
  }
}
