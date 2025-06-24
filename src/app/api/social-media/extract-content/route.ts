import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

export async function POST(request: NextRequest) {
  console.log('🎬 [EXTRACT] Starting social media content extraction...');
  
  if (!GEMINI_API_KEY) {
    console.error('❌ [EXTRACT] Gemini API key not configured');
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { url } = await request.json();
    console.log('📝 [EXTRACT] Received URL:', url);
    
    if (!url) {
      console.error('❌ [EXTRACT] No URL provided in request');
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
      console.log('✅ [EXTRACT] URL validation passed');
    } catch {
      console.error('❌ [EXTRACT] Invalid URL format:', url);
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Detect platform
    const platform = detectPlatform(url);
    const isVideoContent = ['tiktok', 'instagram', 'youtube'].includes(platform);
    console.log('🔍 [EXTRACT] Platform detected:', platform, '| Is video content:', isVideoContent);

    // For TikTok and Instagram videos, use the real transcription workflow
    if (platform === 'tiktok' || platform === 'instagram') {
      console.log('🎬 [EXTRACT] Detected TikTok/Instagram video - using real transcription workflow');
      
      try {
        const transcriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transcribe-social`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (transcriptionResponse.ok) {
          console.log('✅ [EXTRACT] Real transcription successful, using transcribed content');
          const transcriptionData = await transcriptionResponse.json();
          
          // Generate title from first few words of transcript
          let transcriptTitle = `${platform} content`;
          if (transcriptionData.transcript && transcriptionData.transcript.trim().length > 0) {
            const words = transcriptionData.transcript.trim().split(/\s+/);
            if (words.length > 0) {
              const titleWords = words.slice(0, Math.min(8, words.length));
              transcriptTitle = titleWords.join(' ');
              if (words.length > 8) {
                transcriptTitle += '...';
              }
              console.log('📝 [EXTRACT] Generated title from real transcript:', transcriptTitle);
            }
          }
          
          const result = {
            title: transcriptTitle,
            transcript: transcriptionData.transcript,
            components: transcriptionData.components,
            contentMetadata: transcriptionData.contentMetadata,
            visualContext: transcriptionData.visualContext,
            description: transcriptionData.transcript?.substring(0, 500) + '...' || 'No description available',
            summary: transcriptionData.transcript?.substring(0, 200) + '...' || 'No summary available',
            topics: transcriptionData.contentMetadata?.hashtags || [],
            platform: transcriptionData.contentMetadata?.platform || platform,
            contentType: 'video',
            hasAudio: true,
            sourceUrl: url,
            extractedAt: new Date().toISOString(),
            isTranscribed: true,
            realTranscription: true, // Flag to indicate this is a real transcription
            transcriptionMetadata: transcriptionData.transcriptionMetadata
          };

          return NextResponse.json(result);
        } else {
          console.log('⚠️ [EXTRACT] Real transcription failed, falling back to text-based extraction');
        }
      } catch (error) {
        console.log('⚠️ [EXTRACT] Real transcription error, falling back to text-based extraction:', error);
      }
    }

    // If this is video content and real transcription failed, don't create fake transcripts
    if (isVideoContent) {
      console.error('❌ [EXTRACT] Video transcription failed and no fallback should be attempted for video content');
      return NextResponse.json(
        { 
          error: 'Failed to transcribe video content',
          details: 'The video could not be downloaded or transcribed. This might be due to platform restrictions, network issues, or the video being private/deleted.',
          isVideoContent: true,
          platform: platform,
          sourceUrl: url,
          suggestedAction: 'Please try with a different video URL or check if the video is publicly accessible.'
        },
        { status: 500 }
      );
    }

    // Enhanced prompt for video content extraction and transcription (fallback for non-video or failed real transcription)
    const prompt = `Please analyze and extract content from this ${platform} URL: ${url}

${isVideoContent ? `
As this appears to be video content, please:
1. Extract or generate a detailed transcript of the spoken content if possible
2. Describe the visual elements, actions, and context
3. Identify key topics, themes, or messages
4. Note any text overlays, captions, or on-screen text
5. Summarize the overall content and purpose
` : `
For this social media content, please:
1. Extract the main text content
2. Describe any visual elements
3. Identify key topics or messages
4. Summarize the overall content
`}

Return the response in this exact JSON format:
{
  "title": "Use the first 6-8 words from the transcript as the title, followed by '...' if longer",
  "transcript": "${isVideoContent ? 'Full transcript of spoken content if available' : 'N/A for non-video content'}",
  "description": "Detailed description of visual content and context",
  "summary": "Concise summary of key points and messages",
  "topics": ["topic1", "topic2", "topic3"],
  "platform": "${platform}",
  "contentType": "${isVideoContent ? 'video' : 'post'}",
  "hasAudio": ${isVideoContent}
}

Important: For the title field, do NOT create a descriptive or creative title. Instead, use the first 6-8 words from the transcript exactly as spoken, followed by '...' if the transcript is longer. If no transcript is available, use "${platform} content".`;

    console.log('🤖 [EXTRACT] Sending request to Gemini API...');
    console.log('📋 [EXTRACT] Prompt type:', isVideoContent ? 'Video transcription' : 'Text extraction');
    
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
          temperature: 0.2,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [EXTRACT] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    console.log('✅ [EXTRACT] Gemini API response received successfully');
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ [EXTRACT] Invalid response structure from Gemini API:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response from Gemini API');
    }

    const extractedText = data.candidates[0].content.parts[0].text;
    console.log('📄 [EXTRACT] Raw Gemini response length:', extractedText.length, 'characters');
    console.log('📄 [EXTRACT] Raw response preview:', extractedText.substring(0, 200) + '...');
    
    // Parse JSON response from Gemini
    let extractedContent;
    try {
      console.log('🔍 [EXTRACT] Attempting to parse JSON from Gemini response...');
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('✅ [EXTRACT] JSON pattern found in response');
        console.log('🔧 [EXTRACT] JSON to parse:', jsonMatch[0].substring(0, 300) + '...');
        extractedContent = JSON.parse(jsonMatch[0]);
        console.log('✅ [EXTRACT] JSON parsed successfully');
        console.log('📊 [EXTRACT] Parsed content keys:', Object.keys(extractedContent));
      } else {
        console.error('❌ [EXTRACT] No JSON pattern found in response');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ [EXTRACT] JSON parsing error:', parseError);
      console.log('🔄 [EXTRACT] Using fallback content structure');
      
      // Fallback structure
      extractedContent = {
        title: `${platform} content`,
        transcript: isVideoContent ? extractedText : 'N/A',
        description: extractedText,
        summary: extractedText.substring(0, 200) + '...',
        topics: [],
        platform: platform,
        contentType: isVideoContent ? 'video' : 'post',
        hasAudio: isVideoContent
      };
    }

    // Ensure all required fields are present
    console.log('🔧 [EXTRACT] Building final result object...');
    
    // Generate title from first few words of transcript if available
    let finalTitle = extractedContent.title || `${platform} content`;
    if (extractedContent.transcript && 
        extractedContent.transcript !== 'N/A' && 
        extractedContent.transcript.trim().length > 0) {
      // Extract first 6-8 words from transcript for title
      const words = extractedContent.transcript.trim().split(/\s+/);
      if (words.length > 0) {
        const titleWords = words.slice(0, Math.min(8, words.length));
        finalTitle = titleWords.join(' ');
        if (words.length > 8) {
          finalTitle += '...';
        }
        console.log('📝 [EXTRACT] Generated title from transcript:', finalTitle);
      }
    }
    
    const result = {
      title: finalTitle,
      transcript: extractedContent.transcript || (isVideoContent ? 'Transcript not available' : 'N/A'),
      description: extractedContent.description || 'Content description not available',
      summary: extractedContent.summary || extractedContent.description || 'Summary not available',
      topics: Array.isArray(extractedContent.topics) ? extractedContent.topics : [],
      platform: extractedContent.platform || platform,
      contentType: extractedContent.contentType || (isVideoContent ? 'video' : 'post'),
      hasAudio: extractedContent.hasAudio || isVideoContent,
      sourceUrl: url,
      extractedAt: new Date().toISOString(),
      isTranscribed: isVideoContent && extractedContent.transcript && extractedContent.transcript !== 'N/A'
    };

    console.log('📊 [EXTRACT] Final result summary:');
    console.log('  - Title:', result.title);
    console.log('  - Platform:', result.platform);
    console.log('  - Content Type:', result.contentType);
    console.log('  - Has Audio:', result.hasAudio);
    console.log('  - Is Transcribed:', result.isTranscribed);
    console.log('  - Transcript Length:', result.transcript.length, 'characters');
    console.log('  - Topics Count:', result.topics.length);
    console.log('✅ [EXTRACT] Content extraction completed successfully');

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [EXTRACT] Social media content extraction error:', error);
    console.error('❌ [EXTRACT] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to extract social media content' },
      { status: 500 }
    );
  }
}

function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  console.log('🔍 [DETECT] Analyzing URL for platform detection:', urlLower);
  
  if (urlLower.includes('tiktok.com')) {
    console.log('✅ [DETECT] Platform identified: TikTok');
    return 'tiktok';
  }
  if (urlLower.includes('instagram.com')) {
    console.log('✅ [DETECT] Platform identified: Instagram');
    return 'instagram';
  }
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    console.log('✅ [DETECT] Platform identified: YouTube');
    return 'youtube';
  }
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    console.log('✅ [DETECT] Platform identified: Twitter/X');
    return 'twitter';
  }
  if (urlLower.includes('linkedin.com')) {
    console.log('✅ [DETECT] Platform identified: LinkedIn');
    return 'linkedin';
  }
  if (urlLower.includes('facebook.com')) {
    console.log('✅ [DETECT] Platform identified: Facebook');
    return 'facebook';
  }
  
  console.log('⚠️ [DETECT] Platform unknown for URL:', urlLower);
  return 'unknown';
} 