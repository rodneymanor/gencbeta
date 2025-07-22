import { NextRequest, NextResponse } from "next/server";

import { generateContent } from "@/lib/services/gemini-service";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const prompt = `Act as a short-form video script editor. You specialize in condensing video scripts for maximum impact on platforms like TikTok, Instagram Reels, and YouTube Shorts while maintaining engagement and clarity.

**YOUR TASK:** Shorten the provided script text to create punchy, concise content using these specific techniques:

**SHORTENING TECHNIQUES:**

**Technique 1: Essential Message Focus**
- Identify the core point that must be communicated
- Remove supporting details that don't directly serve this point
- Keep only information that adds immediate value

**Technique 2: Ruthless Editing**
- Cut redundant phrases and repetitive ideas
- Eliminate filler words ("um," "so," "actually," "basically")
- Remove unnecessary qualifiers and hedge words

**Technique 3: Power Word Selection**
- Replace weak phrases with strong, direct alternatives
- Use active voice instead of passive constructions
- Choose specific words over general descriptions

**Technique 4: Engagement Retention**
- Preserve hooks and attention-grabbing elements
- Keep emotional triggers and relatable moments
- Maintain direct viewer address ("you," "your")

**Technique 5: Natural Flow**
- Ensure shortened version sounds conversational
- Maintain logical idea progression
- Keep essential transitions for clarity

**FORMAT REQUIREMENTS:**
- Maintain original message and intent
- Optimize for 15-60 second video consumption
- Ensure it sounds natural when spoken quickly
- No explanations or commentary in output

**SHORTENING EXAMPLES:**
- "If you're struggling with email marketing and you still haven't made any money from it, you might be making the same mistake I made." → "Struggling with email marketing? You might be making the same mistake I made."
- "You know when you feel like you're just not good enough? It's like no matter how hard you try... it never seems to be enough." → "Feel like you're not good enough? Like nothing you do is ever enough?"

**CUTTING PRIORITIES:**
1. Redundant information
2. Excessive context
3. Wordy explanations
4. Multiple examples (keep strongest)
5. Unnecessary transitions

Shorten this script text:
${text}`;

    const response = await generateContent({
      prompt,
      model: "gemini-1.5-flash",
      temperature: 0.3,
      maxTokens: 1000,
    });

    if (!response.success || !response.content) {
      return NextResponse.json({ error: response.error || "Failed to shorten text" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shortenedText: response.content,
      tokensUsed: response.tokensUsed,
      responseTime: response.responseTime,
    });
  } catch (error) {
    console.error("Shorten API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
