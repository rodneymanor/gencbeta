export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export interface ScriptOption {
  id: string;
  title: string;
  content: string;
}

export interface RefinementControls {
  toneOfVoice: string;
  voiceEngine: string;
  scriptLength: string;
}

export type ViewMode = "ab-comparison" | "editor";

export interface UrlParams {
  idea: string;
  mode: string;
  length: string;
  source: string;
}

// Script generation utility
export const generateScriptContent = (idea: string, approach: string, length: string): string => {
  const isShort = length === "20";

  if (approach === "hook-focused") {
    return isShort
      ? `HOOK: Did you know that ${idea.toLowerCase()}? Here's the truth nobody talks about...

MAIN POINT: [Main insight or advice related to the idea]

CLOSER: And that's how you [benefit/outcome]. Try it and see the difference.`
      : `HOOK: If you've ever wondered about ${idea.toLowerCase()}, you're not alone. Here's what I discovered...

STORY: Last week, I [personal anecdote related to the idea]...

REVELATION: But here's what changed everything for me...

MAIN POINT: [Detailed insight or step-by-step advice]

CALL TO ACTION: Comment below if you've experienced this too, and follow for more insights like this.`;
  } else {
    return isShort
      ? `SCENE: Picture this - ${idea.toLowerCase()}.

CONFLICT: But here's the problem most people face...

SOLUTION: [Quick solution or insight]

RESULT: And that's the difference it makes.`
      : `OPENING: Let me tell you a story about ${idea.toLowerCase()}...

SETUP: [Background context and character introduction]

CONFLICT: But then something unexpected happened...

JOURNEY: [The process of overcoming the challenge]

RESOLUTION: [The outcome and lesson learned]

TAKEAWAY: The lesson? [Key insight for the audience]

ENGAGEMENT: What's your experience with this? Share in the comments!`;
  }
};
