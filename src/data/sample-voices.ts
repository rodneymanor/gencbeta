import { AIVoice, VoiceTemplate } from "@/types/ai-voices";

// Fallback data structure
const fallbackTemplates = {
  allTemplates: [
    {
      hook: "Sample hook template",
      bridge: "Sample bridge template",
      nugget: "Sample nugget template",
      wta: "Sample WTA template",
    },
  ],
};

// Read the Alex Hormozi templates JSON file
let hermoziData: { allTemplates: any[] } = fallbackTemplates;
try {
  if (typeof window === "undefined") {
    // Server-side only
    const { readFileSync } = require("fs");
    const { join } = require("path");
    const filePath = join(process.cwd(), ".cursor/rules/alexhermozi templates.txt");
    const fileContent = readFileSync(filePath, "utf-8");
    hermoziData = JSON.parse(fileContent);
  }
} catch (error) {
  console.warn("Could not load Alex Hormozi templates:", error);
  hermoziData = fallbackTemplates;
}

function createVoiceTemplate(template: any, index: number): VoiceTemplate {
  return {
    id: `hermozi_template_${index + 1}`,
    hook: template.hook ?? "Sample hook template",
    bridge: template.bridge ?? "Sample bridge template",
    nugget: template.nugget ?? "Sample nugget template",
    wta: template.wta ?? "Sample WTA template",
    originalContent: {
      Hook: template.hook ?? "Sample hook content",
      Bridge: template.bridge ?? "Sample bridge content",
      "Golden Nugget": template.nugget ?? "Sample nugget content",
      WTA: template.wta ?? "Sample WTA content",
    },
    sourceVideoId: template.sourceVideoId,
    sourceMetadata: {
      viewCount: template.sourceMetadata?.viewCount,
      likeCount: template.sourceMetadata?.likeCount,
      platform: "tiktok" as const,
      url: template.sourceVideoId ? `https://www.tiktok.com/@alexhormozi/video/${template.sourceVideoId}` : undefined,
    },
  };
}

function createExampleScript(template: any, index: number) {
  return {
    id: `example_${index + 1}`,
    title: `Alex Hormozi Script ${index + 1}`,
    content: `${template.hook ?? "Sample hook"} ${template.bridge ?? "Sample bridge"} ${template.nugget ?? "Sample nugget"} ${template.wta ?? "Sample WTA"}`,
    source: template.sourceVideoId ? `https://www.tiktok.com/@alexhormozi/video/${template.sourceVideoId}` : undefined,
    platform: "tiktok" as const,
    metrics: {
      views: template.sourceMetadata?.viewCount ?? 0,
      likes: template.sourceMetadata?.likeCount ?? 0,
    },
    segments: {
      Hook: template.hook ?? "Sample hook",
      Bridge: template.bridge ?? "Sample bridge",
      "Golden Nugget": template.nugget ?? "Sample nugget",
      WTA: template.wta ?? "Sample WTA",
    },
  };
}

// Convert Alex Hormozi templates to our VoiceTemplate format
const hermoziVoiceTemplates: VoiceTemplate[] = (hermoziData.allTemplates ?? []).map(createVoiceTemplate);

// Create example scripts from the templates
const hermoziExampleScripts = (hermoziData.allTemplates ?? []).slice(0, 10).map(createExampleScript);

export const SAMPLE_VOICES: AIVoice[] = [
  {
    id: "alex_hormozi_voice",
    name: "Alex Hormozi Formula",
    badges: ["Business", "Persuasive", "Educational"],
    description:
      "Master the art of persuasive business content with Alex Hormozi's proven formula. Features 100+ templates from his highest-performing content, covering sales psychology, business growth, and entrepreneurial mindset.",
    creatorInspiration: "Alex Hormozi",
    templates: hermoziVoiceTemplates,
    exampleScripts: hermoziExampleScripts,
    isShared: true,
    userId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    isActive: false,
  },
  {
    id: "motivational_speaker_voice",
    name: "Motivational Speaker",
    badges: ["Inspirational", "Energetic", "Uplifting"],
    description:
      "Inspire and motivate your audience with powerful, energetic content. Perfect for personal development, success stories, and motivational messaging.",
    templates: [
      {
        id: "motivational_1",
        hook: "The difference between [Successful People] and [Unsuccessful People] isn't [Common Belief].",
        bridge:
          "Most people think [Common Misconception], but here's what [Successful People] actually do differently.",
        nugget:
          "They understand that [Key Insight] is more important than [Popular Focus]. While others are [Ineffective Action], they're [Effective Action] that leads to [Desired Result].",
        wta: "Start [Specific Action] today and join the [Percentage]% who [Achieve Success].",
        originalContent: {
          Hook: "The difference between millionaires and broke people isn't luck.",
          Bridge:
            "Most people think it's about having money to start, but here's what millionaires actually do differently.",
          "Golden Nugget":
            "They understand that cash flow is more important than net worth. While others are saving pennies, they're investing in assets that generate passive income.",
          WTA: "Start building your first income stream today and join the 3% who achieve financial freedom.",
        },
      },
    ],
    exampleScripts: [
      {
        id: "motivational_example_1",
        title: "Success Mindset",
        content:
          "The difference between millionaires and broke people isn't luck. Most people think it's about having money to start, but here's what millionaires actually do differently. They understand that cash flow is more important than net worth. While others are saving pennies, they're investing in assets that generate passive income. Start building your first income stream today and join the 3% who achieve financial freedom.",
        platform: "tiktok",
        metrics: { views: 500000, likes: 25000 },
      },
    ],
    isShared: true,
    userId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    isActive: false,
  },
  {
    id: "educational_voice",
    name: "Educational Expert",
    badges: ["Teaching", "Clear", "Informative"],
    description:
      "Break down complex topics into digestible, engaging content. Ideal for tutorials, how-to guides, and educational content that actually teaches.",
    templates: [
      {
        id: "educational_1",
        hook: "Here's the [Number] step process to [Achieve Goal] that [Expert/Authority] doesn't want you to know.",
        bridge:
          "I've been [Doing Activity] for [Time Period] and discovered this [Method/System] that [Impressive Result].",
        nugget:
          "Step 1: [First Action]. Step 2: [Second Action]. Step 3: [Third Action]. The key is [Critical Element] because [Explanation].",
        wta: "Try this [Method] for [Time Period] and see [Expected Result] for yourself.",
        originalContent: {
          Hook: "Here's the 3 step process to double your productivity that productivity gurus don't want you to know.",
          Bridge:
            "I've been optimizing workflows for 5 years and discovered this system that increased my output by 200%.",
          "Golden Nugget":
            "Step 1: Time block your calendar. Step 2: Batch similar tasks. Step 3: Eliminate decision fatigue. The key is consistency because small improvements compound exponentially.",
          WTA: "Try this system for 30 days and see dramatic improvements for yourself.",
        },
      },
    ],
    exampleScripts: [
      {
        id: "educational_example_1",
        title: "Productivity System",
        content:
          "Here's the 3 step process to double your productivity that productivity gurus don't want you to know. I've been optimizing workflows for 5 years and discovered this system that increased my output by 200%. Step 1: Time block your calendar. Step 2: Batch similar tasks. Step 3: Eliminate decision fatigue. The key is consistency because small improvements compound exponentially. Try this system for 30 days and see dramatic improvements for yourself.",
        platform: "instagram",
        metrics: { views: 300000, likes: 15000 },
      },
    ],
    isShared: true,
    userId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    isActive: false,
  },
];

export default SAMPLE_VOICES;
