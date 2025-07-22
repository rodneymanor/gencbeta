import { NextRequest, NextResponse } from "next/server";

import { generateContent } from "@/lib/services/gemini-service";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const prompt = `Act as a short-form video script humanizer. You specialize in making video scripts sound natural, conversational, and engaging for platforms like TikTok, Instagram Reels, and YouTube Shorts.

**YOUR TASK:** Transform the provided script text to sound like authentic human speech using these specific techniques:

**HUMANIZATION TECHNIQUES:**

**Technique 1: Personal Address**
- Replace group references with individual focus
- Use "you" instead of "everyone" or "you guys"
- Make it feel like a one-on-one conversation

**Technique 2: Natural Speech Patterns**
- Use contractions and informal language
- Include natural transitions ("So," "Now," "Here's the thing")
- Add conversational softeners ("just," "kind of," "it's like")

**Technique 3: Accessibility**
- Use simple, everyday words
- Aim for Grade 2-4 reading level
- Replace jargon with relatable terms

**Technique 4: Authenticity**
- Remove formal or sales-y language
- Eliminate infomercial-style phrasing
- Make recommendations feel helpful, not pushy

**Technique 5: Engagement**
- Increase direct address ("you," "your")
- Create intimacy through personal language
- Make viewer feel individually spoken to

**FORMAT REQUIREMENTS:**
- Maintain original message and intent
- Keep length appropriate for short-form content
- Ensure it sounds natural when spoken
- No explanations or commentary in output

**EXAMPLES OF TRANSFORMATIONS:**
- "Multiple studies indicate..." → "If you look at the studies, you'll see..."
- "Hey everyone, today I want to tell you guys..." → "If you're struggling with this, you might be making the same mistake I made..."
- "Implementing a consistent routine enhances..." → "When you go to bed at the same time every day, your brain works better..."

Transform this script text:
${text}`;

    const response = await generateContent({
      prompt,
      model: "gemini-1.5-flash",
      temperature: 0.7,
      maxTokens: 1000,
    });

    if (!response.success || !response.content) {
      return NextResponse.json({ error: response.error || "Failed to humanize text" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      humanizedText: response.content,
      tokensUsed: response.tokensUsed,
      responseTime: response.responseTime,
    });
  } catch (error) {
    console.error("Humanize API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
