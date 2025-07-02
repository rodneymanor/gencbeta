export interface AIVoice {
  id: string;
  name: string;
  badges: string[]; // 3 descriptive badges
  description: string;
  creatorInspiration?: string; // Creator this voice is inspired by
  templates: VoiceTemplate[]; // Array of templates for this voice
  exampleScripts: OriginalScript[]; // Full original scripts for carousel
  isShared: boolean; // Super admin can share globally
  userId?: string; // null for shared voices, userId for custom voices
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // For user's active voice selection
  voiceLimit?: number; // For tracking usage limits
}

export interface VoiceTemplate {
  id: string;
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
  originalContent: {
    Hook: string;
    Bridge: string;
    "Golden Nugget": string;
    WTA: string;
  };
  sourceVideoId?: string;
  sourceMetadata?: {
    viewCount?: number;
    likeCount?: number;
    platform?: "tiktok" | "instagram";
    url?: string;
  };
}

export interface OriginalScript {
  id: string;
  title: string;
  content: string;
  source?: string; // TikTok/Instagram URL
  platform?: "tiktok" | "instagram";
  metrics?: {
    views?: number;
    likes?: number;
  };
  segments?: {
    Hook: string;
    Bridge: string;
    "Golden Nugget": string;
    WTA: string;
  };
}

export interface VoiceCreationRequest {
  profileUrl: string;
  platform: "tiktok" | "instagram";
  voiceName?: string;
}

export interface VoiceActivationResponse {
  success: boolean;
  voiceName: string;
  message: string;
}

export interface CustomVoiceLimit {
  used: number;
  total: number;
  remaining: number;
}
