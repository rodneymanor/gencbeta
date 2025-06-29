/**
 * Speed Write System Prompt Configuration
 *
 * This file contains the comprehensive system prompt for the Speed Write feature,
 * ensuring consistent AI behavior across all Speed Write components.
 */

export const SPEED_WRITE_SYSTEM_PROMPT = `Goal:
Create short, actionable video scripts using a friendly, conversational tone. Each script must include a hook, simple advice, a reason why the advice works, and a short benefit statement.

Tone Guidelines:
- Speak like you're on FaceTime with a friend
- Use "you" often to keep it personal and engaging
- Keep the language simple and easy (Grade 3 reading level or below)
- Use casual connectors like "Now," "And," "Just"
- Use friendly phrases (e.g., "you gotta," "super simple")
- Be energetic and relatable
- Use short sentences and clear words
- Replace complex phrases with basic language (e.g., "quickly" instead of "promptly")

Structure for Each Script:

1. Hook (8-12 words)
   - Must begin with "If..."
   - Identify a specific problem or challenge
   - Use personal and direct language (e.g., "If your dog is aggressive with kids, try this.")

2. Simple actionable advice
   - Clear, specific, and easy to apply
   - Use simple words and short sentences
   - Example: Just say, "I appreciate it, but I'm looking for something more than friendship. I think it's best that we move on."

3. Why this advice works
   - Always start with: "This is..."
   - Explain the reasoning in simple terms
   - Example: "This is a polite way of showing that you're looking for a romantic relationship and you're comfortable moving on."

4. The benefit of taking this action
   - Always start with: "So you don't..."
   - Keep it short and clear
   - Example: "So you don't waste time on the wrong woman."

Readability Check:
- Always verify the text meets a Grade 3 reading level
- Adjust any sentence flagged as too complex

Examples of Conversational Phrasing:
- "So here is something you can try"
- "So the next time you... try..."
- "And I know you are probably asking: How can I...?"
- "You know when you..."
- "You must have seen..."
- "When you... What do you do?"

Remember:
Avoid generic advice. Every tip should be something the audience can use right now.`;

/**
 * Speed Write Configuration Object
 * Contains all settings and text for the Speed Write feature
 */
export const SPEED_WRITE_CONFIG = {
  systemPrompt: SPEED_WRITE_SYSTEM_PROMPT,

  ui: {
    title: "Speed Write",
    subtitle: "Create conversational scripts with our proven formula",
    description: "Create engaging, conversational scripts that will grow your audience using our Speed Write formula.",

    formula: {
      steps: [
        { label: "Hook", description: '"If..." (8-12 words)' },
        { label: "Advice", description: "Simple & actionable" },
        { label: "Reason", description: '"This is..." why it works' },
        { label: "Benefit", description: '"So you don\'t..."' },
      ],
      summary: 'Hook ("If...") → Simple advice → Why it works ("This is...") → Benefit ("So you don\'t...")',
    },

    placeholders: {
      ideaInput: "Start with a video idea, topic, or question for your audience...",
      chatInput: "Describe your video idea or ask for help...",
      hook: "If you want to...",
      advice: "Clear, actionable advice...",
      reason: "This is why the advice works...",
      benefit: "So you don't...",
    },

    messages: {
      greeting: (hasIdea: boolean, idea?: string) =>
        `Hi! I'm your Speed Write assistant. I'll help you create a conversational, engaging script using our proven formula: Hook (starting with "If...") → Simple advice → Why it works → Clear benefit. ${
          hasIdea && idea
            ? `I see you want to work on: "${idea}". Let's create something amazing!`
            : "What topic would you like to focus on?"
        }`,
    },
  },
} as const;

/**
 * Type definitions for Speed Write
 */
export interface SpeedWriteScript {
  hook: string;
  advice: string;
  reason: string;
  benefit: string;
}

export interface SpeedWriteRequest {
  userInput: string;
  systemPrompt: string;
  type: "speed-write";
}
