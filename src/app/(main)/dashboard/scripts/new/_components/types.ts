import { Zap, Target, Mic, FileText, Lightbulb, TrendingUp, MessageSquare, HelpCircle } from "lucide-react";

// Types
export interface DailyIdea {
  id: string;
  text: string;
  source: "problems" | "excuses" | "questions" | "google-trends" | "reddit" | "x";
  category: string;
  isBookmarked: boolean;
}

export interface SavedIdea {
  id: string;
  text: string;
  type: "voice" | "written";
  createdAt: string;
}

export interface ScriptMode {
  id: "speed-write" | "hook" | "influencer" | "template";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

// Utility functions
export const getSourceIcon = (source: DailyIdea["source"]) => {
  switch (source) {
    case "problems":
      return HelpCircle;
    case "excuses":
      return MessageSquare;
    case "questions":
      return Lightbulb;
    case "google-trends":
      return TrendingUp;
    case "reddit":
      return MessageSquare;
    case "x":
      return MessageSquare;
    default:
      return Lightbulb;
  }
};

export const getSourceColor = (source: DailyIdea["source"]) => {
  switch (source) {
    case "problems":
      return "bg-red-500/10 text-red-700 border-red-200";
    case "excuses":
      return "bg-[#2d93ad]/10 text-[#2d93ad] border-[#2d93ad]/20";
    case "questions":
      return "bg-[#412722]/10 text-[#412722] border-[#412722]/20";
    case "google-trends":
      return "bg-green-500/10 text-green-700 border-green-200";
    case "reddit":
      return "bg-[#d9dcd6]/10 text-[#412722] border-[#d9dcd6]/20";
    case "x":
      return "bg-[#412722]/10 text-[#412722] border-[#412722]/20";
    default:
      return "bg-[#2d93ad]/10 text-[#2d93ad] border-[#2d93ad]/20";
  }
};

// Mock data
export const mockDailyIdeas: DailyIdea[] = [
  {
    id: "1",
    text: "Why do people spend more money when they're stressed, even when they know they shouldn't?",
    source: "problems",
    category: "Psychology",
    isBookmarked: false,
  },
  {
    id: "2",
    text: "I don't have time to exercise regularly because of my busy schedule",
    source: "excuses",
    category: "Health",
    isBookmarked: false,
  },
  {
    id: "3",
    text: "What's the most effective way to build confidence when speaking in public?",
    source: "questions",
    category: "Personal Development",
    isBookmarked: true,
  },
  {
    id: "4",
    text: "AI productivity tools are trending 300% this month",
    source: "google-trends",
    category: "Technology",
    isBookmarked: false,
  },
  {
    id: "5",
    text: "Remote work burnout discussion gaining traction in r/productivity",
    source: "reddit",
    category: "Workplace",
    isBookmarked: false,
  },
  {
    id: "6",
    text: "Viral thread about morning routines that actually work",
    source: "x",
    category: "Lifestyle",
    isBookmarked: false,
  },
];

export const mockSavedIdeas: SavedIdea[] = [
  {
    id: "1",
    text: "Content idea about time management techniques for entrepreneurs",
    type: "written",
    createdAt: "2024-01-20T10:30:00Z",
  },
  {
    id: "2",
    text: "Voice memo about social media strategy for small businesses",
    type: "voice",
    createdAt: "2024-01-19T15:45:00Z",
  },
  {
    id: "3",
    text: "Script concept around productivity apps comparison",
    type: "written",
    createdAt: "2024-01-18T09:15:00Z",
  },
];

export const scriptModes: ScriptMode[] = [
  {
    id: "speed-write",
    label: "Speed Write",
    description: "AI-powered A/B script generation",
    icon: Zap,
    available: true,
  },
  {
    id: "hook",
    label: "Hook Chooser",
    description: "Select from proven hooks",
    icon: Target,
    available: false,
  },
  {
    id: "influencer",
    label: "Influencer Tone of Voice",
    description: "Use influencer templates",
    icon: Mic,
    available: false,
  },
  {
    id: "template",
    label: "Template Chooser",
    description: "Choose script templates",
    icon: FileText,
    available: false,
  },
];
