"use client";

import { AIVoice, VoiceCreationRequest, VoiceActivationResponse, CustomVoiceLimit, OriginalScript } from "@/types/ai-voices";
import { auth } from "@/lib/firebase";

export class AIVoicesClient {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await currentUser.getIdToken();
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
    } catch (error) {
      console.error("[AIVoicesClient] Failed to get auth headers:", error);
      throw new Error("Authentication failed");
    }
  }

  /**
   * Get all available voices (shared + user's custom voices)
   */
  static async getAvailableVoices(): Promise<{ sharedVoices: AIVoice[]; customVoices: AIVoice[] }> {
    try {
      const response = await fetch("/api/voices", {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }

      return await response.json();
    } catch (error) {
      console.error("[AIVoicesClient] Failed to fetch voices:", error);
      throw new Error("Failed to fetch voices");
    }
  }

  /**
   * Get user's custom voice usage limit
   */
  static async getCustomVoiceLimit(): Promise<CustomVoiceLimit> {
    try {
      const response = await fetch("/api/voices/limit", {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to get voice limit");
      }

      return await response.json();
    } catch (error) {
      console.error("[AIVoicesClient] Failed to get voice limit:", error);
      throw new Error("Failed to get voice limit");
    }
  }

  /**
   * Create a custom voice from social media profile
   */
  static async createCustomVoice(request: VoiceCreationRequest): Promise<AIVoice> {
    try {
      console.log("[AIVoicesClient] Creating custom voice from profile:", request.profileUrl);

      const response = await fetch("/api/voices/create", {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "Failed to create custom voice");
      }

      const newVoice = await response.json();
      console.log("[AIVoicesClient] Custom voice created successfully:", newVoice.id);
      return newVoice;
    } catch (error) {
      console.error("[AIVoicesClient] Failed to create custom voice:", error);
      throw error;
    }
  }

  /**
   * Activate a voice for the user
   */
  static async activateVoice(voiceId: string): Promise<VoiceActivationResponse> {
    try {
      const response = await fetch(`/api/voices/${voiceId}/activate`, {
        method: "POST",
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "Failed to activate voice");
      }

      const result = await response.json();
      console.log("[AIVoicesClient] Voice activated successfully:", voiceId);
      return result;
    } catch (error) {
      console.error("[AIVoicesClient] Failed to activate voice:", error);
      throw error;
    }
  }

  /**
   * Get the user's currently active voice
   */
  static async getActiveVoice(): Promise<AIVoice | null> {
    try {
      const response = await fetch("/api/voices/active", {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[AIVoicesClient] Failed to get active voice:", error);
      return null;
    }
  }

  /**
   * Get example scripts for a voice
   */
  static async getVoiceExamples(voiceId: string): Promise<OriginalScript[]> {
    try {
      const response = await fetch(`/api/voices/${voiceId}/examples`, {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to get voice examples");
      }

      return await response.json();
    } catch (error) {
      console.error("[AIVoicesClient] Failed to get voice examples:", error);
      throw error;
    }
  }

  /**
   * Delete a custom voice
   */
  static async deleteCustomVoice(voiceId: string): Promise<void> {
    try {
      const response = await fetch(`/api/voices/${voiceId}`, {
        method: "DELETE",
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "Failed to delete voice");
      }

      console.log("[AIVoicesClient] Custom voice deleted successfully:", voiceId);
    } catch (error) {
      console.error("[AIVoicesClient] Failed to delete custom voice:", error);
      throw error;
    }
  }
} 