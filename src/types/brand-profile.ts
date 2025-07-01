export interface BrandQuestionnaire {
  profession: string;
  brandPersonality: string;
  universalProblem: string;
  initialHurdle: string;
  persistentStruggle: string;
  visibleTriumph: string;
  ultimateTransformation: string;
}

export interface ContentPillar {
  pillar_name: string;
  description: string;
  suggested_themes: string[];
}

export interface BrandProfileData {
  core_keywords: string[];
  audience_keywords: string[];
  problem_aware_keywords: string[];
  solution_aware_keywords: string[];
  content_pillars: ContentPillar[];
  suggested_hashtags: {
    broad: string[];
    niche: string[];
    community: string[];
  };
}

export interface BrandProfile {
  id: string;
  userId: string;
  questionnaire: BrandQuestionnaire;
  profile: BrandProfileData;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  version: number;
}

export interface BrandOnboardingState {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  hasSeenOnboarding: boolean;
  neverShowAgain: boolean;
}
