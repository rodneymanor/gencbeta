export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  type?: "text" | "voice";
  audioUrl?: string;
  duration?: number;
}

export interface Tag {
  name: string;
  color: string;
}

// Mock notes data
export const mockNotes: Note[] = [
  {
    id: 1,
    title: "Morning Routine Ideas",
    content: `# Morning Routine Strategy

Key insights for content:
- Most people focus on what they do, not when they do it
- First 10 minutes are crucial for setting intention
- **Three-step framework:**
  1. Hydrate before caffeinate
  2. Set one clear intention
  3. Move your body (even 2 minutes)

> This could work as a TikTok series - one video per step

**Potential hooks:**
- "What if I told you 90% of people do morning routines wrong?"
- "The first 10 minutes of your day determine everything"`,
    tags: ["morning", "routine", "productivity", "tiktok"],
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
    starred: true,
    type: "text" as const,
  },
  {
    id: 2,
    title: "Content Ideas - Tech Reviews",
    content: `## Tech Review Framework

**Structure:**
1. Hook with personal story
2. Show the product in action
3. Honest pros and cons
4. Who it's perfect for
5. Call to action

**Upcoming reviews:**
- New iPhone features for creators
- Budget microphone comparison
- Editing apps for beginners

*Note: Focus on creator-specific use cases*`,
    tags: ["tech", "reviews", "content", "structure"],
    createdAt: "2024-01-18",
    updatedAt: "2024-01-19",
    starred: false,
    type: "text" as const,
  },
  {
    id: 3,
    title: "Storytelling Techniques",
    content: `Personal storytelling for social media:

**The 3-Act Structure:**
- Setup: Where I was
- Conflict: What went wrong
- Resolution: How I changed

**Emotional hooks:**
- Start with the end result
- Use specific details
- Include vulnerable moments
- End with actionable advice

Remember: People connect with struggle, not success.`,
    tags: ["storytelling", "social media", "engagement"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    starred: true,
    type: "text" as const,
  },
  {
    id: 4,
    title: "Quick Content Ideas",
    content: "",
    tags: ["brainstorm", "quick", "voice"],
    createdAt: "2024-01-21",
    updatedAt: "2024-01-21",
    starred: false,
    type: "voice" as const,
    audioUrl: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
    duration: 45,
  },
];

export const availableTags: Tag[] = [
  { name: "morning", color: "bg-blue-500" },
  { name: "routine", color: "bg-green-500" },
  { name: "productivity", color: "bg-purple-500" },
  { name: "tiktok", color: "bg-pink-500" },
  { name: "tech", color: "bg-orange-500" },
  { name: "reviews", color: "bg-cyan-500" },
  { name: "content", color: "bg-indigo-500" },
  { name: "structure", color: "bg-emerald-500" },
  { name: "storytelling", color: "bg-red-500" },
  { name: "social media", color: "bg-yellow-500" },
  { name: "engagement", color: "bg-violet-500" },
];
