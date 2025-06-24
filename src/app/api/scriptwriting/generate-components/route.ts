import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SCRIPT_COMPONENTS_PROMPT = `You are an expert scriptwriter and content researcher specializing in short-form video scripts. Your task is to analyze multiple sources and create comprehensive script outlines with multiple creative options for each component.

CRITICAL FORMATTING REQUIREMENT: Golden nuggets MUST follow the exact expanded format shown below. Do NOT provide simple single-line tips.

Create script components that follow the proven Hook-Bridge-Golden Nugget-WTA format optimized for short-form video engagement and viewer retention.

Component Guidelines:
- HOOKS: Must grab attention in first 3 seconds, address a specific pain point
- BRIDGES: Smooth transitions that maintain engagement while setting up the value
- GOLDEN NUGGETS: **MANDATORY FORMAT** - Each golden nugget must be structured as a title followed by 3-5 detailed bullet points. Each bullet point must contain specific steps, tools, metrics, or frameworks.
- WTAs (Why To Act): Compelling calls-to-action that drive engagement and following

Output must be a single JSON object with this exact structure:
{
  "video_topic": "The specific video topic being addressed",
  "target_audience": "Content creators, coaches, business owners posting daily video content", 
  "core_problem_addressed": "Which specific pain point this script solves",
  "hooks": [
    "Hook option 1 - attention-grabbing opener",
    "Hook option 2 - different angle/approach",
    "Hook option 3 - problem-focused opener", 
    "Hook option 4 - curiosity-driven opener"
  ],
  "bridges": [
    "Bridge option 1 - smooth transition to main content",
    "Bridge option 2 - story-based transition",
    "Bridge option 3 - statistics/facts transition",
    "Bridge option 4 - relatable scenario transition"
  ],
  "golden_nuggets": [
    {
      "title": "Method Title 1",
      "bullet_points": [
        "Specific actionable step with tools and metrics",
        "Detailed implementation guide with examples",
        "Optimization strategy with measurable outcomes"
      ]
    }
  ],
  "wtas": [
    "WTA option 1 - engagement-focused CTA",
    "WTA option 2 - follow for more value CTA", 
    "WTA option 3 - try this technique CTA",
    "WTA option 4 - share your results CTA"
  ],
  "sources_analyzed": "List the types/topics of sources referenced"
}`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const { videoIdea, sources, customTemplate } = await req.json();

    if (!videoIdea) {
      return NextResponse.json(
        { error: 'Video idea is required' },
        { status: 400 }
      );
    }

    // Prepare sources content for the prompt
    const sourcesContent = sources && sources.length > 0 
      ? sources
          .filter((s: any) => s.extractedText)
          .map((s: any) => `Source: ${s.title}\nContent: ${s.extractedText}`)
          .join('\n\n')
      : 'No specific sources provided - use general knowledge and best practices.';

    // Add custom template instruction if provided
    const templateInstruction = customTemplate 
      ? `\n\nCUSTOM TEMPLATE TO FOLLOW:\n${customTemplate}\n\nIMPORTANT: Use this custom template as the foundation for your script structure. Adapt the provided template content to fit the video idea while maintaining the overall style and format.`
      : '';

    const prompt = `${SCRIPT_COMPONENTS_PROMPT}

Video Idea: "${videoIdea}"

Research Sources:
${sourcesContent}${templateInstruction}

Based on this research${customTemplate ? ' and the custom template provided' : ''}, generate script components for the video idea. Focus on creating engaging, valuable content that addresses the target audience's needs and incorporates insights from the research sources.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedContent = JSON.parse(result.candidates[0].content.parts[0].text);
    
    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error('Error generating script components:', error);
    return NextResponse.json(
      { error: 'Failed to generate script components' },
      { status: 500 }
    );
  }
} 