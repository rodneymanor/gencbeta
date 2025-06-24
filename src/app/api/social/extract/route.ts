import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Call Gemini API to extract content from URL
    const prompt = `Please extract and summarize the content from this social media URL: ${url}

Instructions:
1. If this is a video (YouTube, TikTok, etc.), provide a transcript or description of the video content
2. If this is a text post (Twitter/X, LinkedIn, Facebook), extract the main text content
3. If this is an image post (Instagram), describe what's shown and extract any captions
4. Provide a concise but comprehensive summary that captures the key points
5. Return the response in this JSON format:
{
  "title": "Brief descriptive title (max 60 characters)",
  "content": "Detailed content summary or transcript",
  "platform": "Platform name (e.g., YouTube, Twitter, Instagram)",
  "type": "Content type (e.g., video, text, image)"
}

Note: If you cannot access the URL directly, provide a helpful message explaining that the content extraction feature would normally process this type of social media link.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const extractedText = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON response from Gemini
    let extractedContent;
    try {
      // Look for JSON in the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedContent = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON format
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        extractedContent = {
          title: `Content from ${domain}`,
          content: extractedText.trim(),
          platform: domain,
          type: 'social_post'
        };
      }
    } catch {
      // Fallback parsing
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      extractedContent = {
        title: `Content from ${domain}`,
        content: extractedText.trim(),
        platform: domain,
        type: 'social_post'
      };
    }

    return NextResponse.json({
      ...extractedContent,
      sourceUrl: url,
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Social content extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract social media content' },
      { status: 500 }
    );
  }
} 