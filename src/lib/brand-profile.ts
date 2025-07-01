import { auth } from "@/lib/firebase";
import type { BrandProfile, BrandQuestionnaire, BrandOnboardingState } from "@/types/brand-profile";

const BRAND_ONBOARDING_KEY = "brand-onboarding-state";

export class BrandProfileService {
  private static async getAuthHeaders(): Promise<{ Authorization: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const token = await currentUser.getIdToken();
    if (!token) {
      throw new Error("No auth token available");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  static async generateBrandProfile(questionnaire: BrandQuestionnaire): Promise<BrandProfile> {
    const headers = await this.getAuthHeaders();

    const response = await fetch("/api/brand", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ questionnaire }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to generate brand profile");
    }

    const data = await response.json();
    return data.profile;
  }

  static async fetchBrandProfiles(): Promise<{
    profiles: BrandProfile[];
    activeProfile: BrandProfile | null;
  }> {
    const headers = await this.getAuthHeaders();

    const response = await fetch("/api/brand", {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to fetch brand profiles");
    }

    const data = await response.json();
    return {
      profiles: data.profiles,
      activeProfile: data.activeProfile,
    };
  }

  static async updateBrandProfile(
    profileId: string,
    updates: {
      profile?: BrandProfile["profile"];
      questionnaire?: BrandQuestionnaire;
    },
  ): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch("/api/brand", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        profileId,
        ...updates,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to update brand profile");
    }
  }

  static async deleteBrandProfile(profileId: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`/api/brand?profileId=${profileId}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to delete brand profile");
    }
  }

  static async activateBrandProfile(profileId: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch("/api/brand/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ profileId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to activate brand profile");
    }
  }

  // Local storage management for onboarding state
  static getOnboardingState(): BrandOnboardingState {
    if (typeof window === "undefined") {
      return {
        currentStep: 0,
        totalSteps: 7,
        isComplete: false,
        hasSeenOnboarding: false,
        neverShowAgain: false,
      };
    }

    try {
      const stored = localStorage.getItem(BRAND_ONBOARDING_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to parse brand onboarding state:", error);
    }

    return {
      currentStep: 0,
      totalSteps: 7,
      isComplete: false,
      hasSeenOnboarding: false,
      neverShowAgain: false,
    };
  }

  static setOnboardingState(state: Partial<BrandOnboardingState>): void {
    if (typeof window === "undefined") return;

    const currentState = this.getOnboardingState();
    const newState = { ...currentState, ...state };

    try {
      localStorage.setItem(BRAND_ONBOARDING_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn("Failed to save brand onboarding state:", error);
    }
  }

  static shouldShowOnboarding(): boolean {
    const state = this.getOnboardingState();
    return !state.hasSeenOnboarding && !state.neverShowAgain;
  }

  static markOnboardingComplete(): void {
    this.setOnboardingState({
      isComplete: true,
      hasSeenOnboarding: true,
    });
  }

  static setNeverShowAgain(): void {
    this.setOnboardingState({
      neverShowAgain: true,
      hasSeenOnboarding: true,
    });
  }

  static resetOnboarding(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(BRAND_ONBOARDING_KEY);
    }
  }
}
