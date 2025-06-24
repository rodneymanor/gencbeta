import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🎬 [TRANSCRIBE-SOCIAL] Starting social media video transcription workflow...');
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      console.error('❌ [TRANSCRIBE-SOCIAL] No URL provided');
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    console.log('🔗 [TRANSCRIBE-SOCIAL] Processing URL:', url);

    // Step 1: Download the video
    console.log('📥 [TRANSCRIBE-SOCIAL] Step 1: Downloading video...');
    const downloadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/download-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!downloadResponse.ok) {
      const errorData = await downloadResponse.json();
      console.error('❌ [TRANSCRIBE-SOCIAL] Download failed:', errorData);
      
      // Check if it's a file size error
      if (errorData.error?.includes('too large')) {
        return NextResponse.json({
          error: 'Video file is too large for transcription',
          details: errorData.error,
          downloadSuccess: false,
          transcriptionSuccess: false
        }, { status: 400 });
      }
      
      // For other download errors, return a more generic error
      return NextResponse.json({
        error: 'Failed to download video for transcription',
        details: 'The video could not be downloaded from the provided URL. This might be due to platform restrictions, network issues, or the video being private/deleted.',
        downloadSuccess: false,
        transcriptionSuccess: false,
        suggestedAction: 'Please try with a different video URL or check if the video is publicly accessible.'
      }, { status: 500 });
    }

    const downloadData = await downloadResponse.json();
    console.log('✅ [TRANSCRIBE-SOCIAL] Video downloaded successfully');
    console.log('📊 [TRANSCRIBE-SOCIAL] Downloaded video info:');
    console.log('  - Platform:', downloadData.platform);
    console.log('  - Size:', Math.round(downloadData.videoData.size / 1024 / 1024 * 100) / 100, 'MB');
    console.log('  - Filename:', downloadData.videoData.filename);

    // Step 2: Prepare video data for transcription
    console.log('🔄 [TRANSCRIBE-SOCIAL] Step 2: Preparing video for transcription...');
    
    // Convert array back to buffer
    const videoBuffer = new Uint8Array(downloadData.videoData.buffer).buffer;
    
    // Create a File object for the transcription API
    const videoBlob = new Blob([videoBuffer], { type: downloadData.videoData.mimeType });
    const formData = new FormData();
    formData.append('video', videoBlob, downloadData.videoData.filename);

    // Step 3: Transcribe the video
    console.log('🎤 [TRANSCRIBE-SOCIAL] Step 3: Transcribing video...');
    const transcribeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!transcribeResponse.ok) {
      const transcribeError = await transcribeResponse.json();
      console.error('❌ [TRANSCRIBE-SOCIAL] Transcription failed:', transcribeError);
      return NextResponse.json(
        { error: `Transcription failed: ${transcribeError.error}` },
        { status: transcribeResponse.status }
      );
    }

    const transcriptionData = await transcribeResponse.json();
    console.log('✅ [TRANSCRIBE-SOCIAL] Transcription completed successfully');
    console.log('📊 [TRANSCRIBE-SOCIAL] Transcription response keys:', Object.keys(transcriptionData));
    console.log('📊 [TRANSCRIBE-SOCIAL] Transcript length:', transcriptionData.transcript?.length || 0, 'characters');
    console.log('🔍 [DEBUG] Components received:', transcriptionData.components);
    console.log('🔍 [DEBUG] Content metadata received:', transcriptionData.contentMetadata);
    console.log('🔍 [DEBUG] Visual context received:', transcriptionData.visualContext);

    // Return success response with all the data in the format the UI expects
    return NextResponse.json({
      success: true,
      transcript: transcriptionData.transcript,
      platform: transcriptionData.contentMetadata?.platform || transcriptionData.platform || downloadData.platform,
      components: transcriptionData.components || {
        hook: "Unable to extract hook",
        bridge: "Unable to extract bridge",
        nugget: "Unable to extract golden nugget",
        wta: "Unable to extract WTA"
      },
      contentMetadata: {
        platform: transcriptionData.contentMetadata?.platform || transcriptionData.platform || downloadData.platform,
        author: transcriptionData.contentMetadata?.author || 'Unknown',
        description: transcriptionData.contentMetadata?.description || 'Video content analysis',
        source: transcriptionData.contentMetadata?.source || 'video',
        hashtags: transcriptionData.contentMetadata?.hashtags || []
      },
      visualContext: transcriptionData.visualContext || "Unable to extract visual context",
      downloadMetadata: downloadData.metadata,
      transcriptionMetadata: transcriptionData.transcriptionMetadata,
      workflow: {
        downloadedAt: downloadData.metadata.downloadedAt,
        transcribedAt: transcriptionData.transcriptionMetadata?.processedAt || new Date().toISOString(),
        totalProcessingTime: null,
        workflowCompletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [TRANSCRIBE-SOCIAL] Workflow error:', error);
    console.error('❌ [TRANSCRIBE-SOCIAL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to complete transcription workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 