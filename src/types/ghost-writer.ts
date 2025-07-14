export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  pillar: ContentPillar;
  hook: string;
  scriptOutline: string;
  targetAudience: string;
  callToAction: string;
  estimatedDuration: "20" | "60" | "90";
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  userId: string;
  cycleId: string;
}

export type ContentPillar =
  | "hyper_focused_value"
  | "quick_hit_value"
  | "major_perspective"
  | "the_trend"
  | "inspiration_bomb";

export interface ContentPillarInfo {
  id: ContentPillar;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface GhostWriterCycle {
  id: string;
  cycleNumber: number;
  generatedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "generating";
  totalIdeas: number;
  globalCycle: boolean;
}

export interface UserGhostWriterData {
  id?: string;
  userId: string;
  currentCycleId: string;
  lastAccessedAt: string;
  savedIdeas: string[]; // Array of idea IDs
  dismissedIdeas: string[]; // Array of idea IDs
  totalIdeasGenerated: number;
  totalIdeasUsed: number;
  preferences: {
    pillarsEnabled: ContentPillar[];
    preferredDuration: ("20" | "60" | "90")[];
    difficulty: ("beginner" | "intermediate" | "advanced")[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfileForIdeas {
  businessProfession: string;
  brandPersonality: string;
  universalProblem: string;
  initialHurdle: string;
  persistentStruggle: string;
  visibleTriumph: string;
  ultimateTransformation: string;
  contentPillars: string[];
  targetAudience: string;
  brandVoice: string;
  industry: string;
}

export interface IdeaGenerationRequest {
  brandProfile: BrandProfileForIdeas;
  pillarDistribution: Record<ContentPillar, number>;
  totalIdeas: number;
  cycleId: string;
  userId: string;
}

export interface IdeaGenerationResponse {
  success: boolean;
  ideas: ContentIdea[];
  cycleId: string;
  error?: string;
}

export const CONTENT_PILLARS: Record<ContentPillar, ContentPillarInfo> = {
  hyper_focused_value: {
    id: "hyper_focused_value",
    name: "Deep Dive",
    description: "In-depth, actionable how-to guidance",
    color: "bg-[#2d93ad]",
    icon: "🎯",
  },
  quick_hit_value: {
    id: "quick_hit_value",
    name: "Quick Win",
    description: "Fast, high-impact tips for immediate results",
    color: "bg-green-500",
    icon: "⚡",
  },
  major_perspective: {
    id: "major_perspective",
    name: "Game Changer",
    description: "Industry insights that shift perspectives",
    color: "bg-[#412722]",
    icon: "💡",
  },
  the_trend: {
    id: "the_trend",
    name: "Trending Now",
    description: "Current events connected to your expertise",
    color: "bg-[#2d93ad]",
    icon: "📈",
  },
  inspiration_bomb: {
    id: "inspiration_bomb",
    name: "Motivation",
    description: "Powerful content that inspires action",
    color: "bg-[#412722]",
    icon: "🚀",
  },
};
