import { NextRequest, NextResponse } from 'next/server';

import { fetchVideo } from '@prevter/tiktok-scraper';

export async function POST(request: NextRequest) {
  console.log('📥 [DOWNLOAD] Starting video download...');
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      console.error('❌ [DOWNLOAD] No URL provided');
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    console.log('🔍 [DOWNLOAD] Processing URL:', url);

    // Detect platform
    const platform = detectPlatform(url);
    console.log('🎯 [DOWNLOAD] Platform detected:', platform);

    if (!['tiktok', 'instagram'].includes(platform)) {
      console.error('❌ [DOWNLOAD] Unsupported platform:', platform);
      return NextResponse.json(
        { error: 'Only TikTok and Instagram videos are supported for download' },
        { status: 400 }
      );
    }

    let videoData;
    if (platform === 'tiktok') {
      videoData = await downloadTikTokVideo(url);
    } else if (platform === 'instagram') {
      videoData = await downloadInstagramVideo(url);
    }

    if (!videoData) {
      console.error('❌ [DOWNLOAD] Failed to download video');
      return NextResponse.json(
        { error: 'Failed to download video from the provided URL' },
        { status: 500 }
      );
    }

    console.log('✅ [DOWNLOAD] Video downloaded successfully');
    console.log('📊 [DOWNLOAD] Video info:');
    console.log('  - Size:', Math.round(videoData.size / 1024 / 1024 * 100) / 100, 'MB');
    console.log('  - Type:', videoData.mimeType);
    console.log('  - Platform:', platform);

    // Check if video is under 20MB limit
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (videoData.size > maxSize) {
      console.error('❌ [DOWNLOAD] Video too large for transcription:', videoData.size, 'bytes');
      return NextResponse.json(
        { error: 'Video is too large for transcription (max 20MB)' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      platform,
      videoData: {
        buffer: Array.from(new Uint8Array(videoData.buffer)), // Convert to array for JSON
        size: videoData.size,
        mimeType: videoData.mimeType,
        filename: videoData.filename || `${platform}-video.mp4`
      },
      metadata: {
        originalUrl: url,
        platform,
        downloadedAt: new Date().toISOString(),
        readyForTranscription: true
      }
    });

  } catch (error) {
    console.error('❌ [DOWNLOAD] Video download error:', error);
    console.error('❌ [DOWNLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to download video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  console.log('🔍 [DOWNLOAD] Analyzing URL for platform detection:', urlLower);
  
  if (urlLower.includes('tiktok.com')) {
    console.log('✅ [DOWNLOAD] Platform identified: TikTok');
    return 'tiktok';
  }
  if (urlLower.includes('instagram.com')) {
    console.log('✅ [DOWNLOAD] Platform identified: Instagram');
    return 'instagram';
  }
  
  console.log('⚠️ [DOWNLOAD] Platform unknown for URL:', urlLower);
  return 'unknown';
}

async function downloadTikTokVideo(url: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log('🎵 [DOWNLOAD] Downloading TikTok video...');
    
    // Extract video ID from URL
    const videoId = extractTikTokVideoId(url);
    if (!videoId) {
      console.error('❌ [DOWNLOAD] Could not extract TikTok video ID');
      return null;
    }

    console.log('🆔 [DOWNLOAD] TikTok video ID:', videoId);

    // First try RapidAPI with 30-second timeout
    console.log('🔄 [DOWNLOAD] Attempting RapidAPI download...');
    const rapidApiResult = await downloadTikTokViaRapidAPI(videoId);
    
    if (rapidApiResult) {
      console.log('✅ [DOWNLOAD] RapidAPI download successful');
      return rapidApiResult;
    }

    // Fallback: Try direct TikTok download
    console.log('🔄 [DOWNLOAD] RapidAPI failed, trying fallback method...');
    const fallbackResult = await downloadTikTokDirectFallback(url, videoId);
    
    if (fallbackResult) {
      console.log('✅ [DOWNLOAD] Fallback download successful');
      return fallbackResult;
    }

    // Final fallback: Try TikTok scraper library
    console.log('🔄 [DOWNLOAD] Direct fallback failed, trying TikTok scraper library...');
    const scraperResult = await downloadTikTokViaScraper(url);
    
    if (scraperResult) {
      console.log('✅ [DOWNLOAD] TikTok scraper download successful');
      return scraperResult;
    }

    console.error('❌ [DOWNLOAD] All TikTok download methods failed');
    return null;

  } catch (error) {
    console.error('❌ [DOWNLOAD] Error downloading TikTok video:', error);
    return null;
  }
}

async function downloadTikTokViaRapidAPI(videoId: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    // 30-second timeout for RapidAPI
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log('🌐 [DOWNLOAD] Calling TikTok RapidAPI with 30s timeout...');
    
    const metadataResponse = await fetch(
      `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/${videoId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e',
          'x-rapidapi-host': 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!metadataResponse.ok) {
      console.error('❌ [DOWNLOAD] TikTok RapidAPI error:', metadataResponse.status);
      return null;
    }

    const metadata = await metadataResponse.json();
    const videoData = metadata.data?.aweme_detail?.video;
    const videoUrls = videoData?.play_addr?.url_list;
    
    if (!videoUrls || videoUrls.length === 0) {
      console.error('❌ [DOWNLOAD] No video URLs found in TikTok RapidAPI response');
      return null;
    }

    console.log('🔗 [DOWNLOAD] TikTok video URLs found:', videoUrls.length, 'options');
    console.log('📊 [DOWNLOAD] Video metadata from RapidAPI:');
    console.log('  - Width:', videoData.width);
    console.log('  - Height:', videoData.height);
    console.log('  - API Data Size:', videoData.data_size, 'bytes');

    // Try each video URL
    for (let i = 0; i < videoUrls.length; i++) {
      const videoUrl = videoUrls[i];
      console.log(`🔄 [DOWNLOAD] Attempting download from RapidAPI URL ${i + 1}/${videoUrls.length}`);
      
      try {
        const videoController = new AbortController();
        const videoTimeoutId = setTimeout(() => videoController.abort(), 15000);

        const videoResponse = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          signal: videoController.signal
        });

        clearTimeout(videoTimeoutId);

        if (videoResponse.ok) {
          const buffer = await videoResponse.arrayBuffer();
          const size = buffer.byteLength;
          const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';
          
          console.log(`✅ [DOWNLOAD] Successfully downloaded from RapidAPI URL ${i + 1}`);
          console.log('📊 [DOWNLOAD] Download size:', size, 'bytes');
          
          return {
            buffer,
            size,
            mimeType,
            filename: `tiktok-${videoId}.mp4`
          };
        }
      } catch (error) {
        console.log(`❌ [DOWNLOAD] RapidAPI URL ${i + 1} failed:`, error);
      }
    }

    return null;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('⏰ [DOWNLOAD] TikTok RapidAPI timed out after 30 seconds');
    } else {
      console.error('❌ [DOWNLOAD] TikTok RapidAPI error:', error);
    }
    return null;
  }
}

async function downloadTikTokDirectFallback(url: string, videoId: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log('🔄 [DOWNLOAD] Attempting TikTok direct fallback...');
    
    // Try to extract video from TikTok's embed or mobile API
    const fallbackUrls = [
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    ];

    for (const fallbackUrl of fallbackUrls) {
      try {
        console.log('🔄 [DOWNLOAD] Trying fallback URL:', fallbackUrl.split('?')[0]);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 [DOWNLOAD] Fallback response received, analyzing...');
          
          // Try to extract video URL from various possible response structures
          const possibleVideoPaths = [
            data.thumbnail_url?.replace('jpg', 'mp4'),
            data.video_url,
            data.aweme_detail?.video?.play_addr?.url_list?.[0],
            data.ItemModule?.[videoId]?.video?.playAddr
          ];

          for (const videoUrl of possibleVideoPaths) {
            if (videoUrl && typeof videoUrl === 'string') {
              console.log('🔗 [DOWNLOAD] Found potential video URL in fallback');
              
              try {
                const videoResponse = await fetch(videoUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                  }
                });

                if (videoResponse.ok && videoResponse.headers.get('content-type')?.includes('video')) {
                  const buffer = await videoResponse.arrayBuffer();
                  const size = buffer.byteLength;
                  
                  if (size > 1000) { // Basic validation
                    console.log('✅ [DOWNLOAD] Fallback video download successful');
                    return {
                      buffer,
                      size,
                      mimeType: 'video/mp4',
                      filename: `tiktok-fallback-${videoId}.mp4`
                    };
                  }
                }
              } catch (videoError) {
                console.log('❌ [DOWNLOAD] Fallback video URL failed:', videoError);
              }
            }
          }
        }
      } catch (error) {
        console.log('❌ [DOWNLOAD] Fallback URL failed:', error);
      }
    }

    console.log('❌ [DOWNLOAD] All TikTok fallback methods failed');
    return null;

  } catch (error) {
    console.error('❌ [DOWNLOAD] TikTok fallback error:', error);
    return null;
  }
}

async function downloadTikTokViaScraper(url: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log('🔄 [DOWNLOAD] Attempting TikTok scraper library download...');
    
    // 30-second timeout for scraper
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log('🌐 [DOWNLOAD] Calling TikTok scraper with 30s timeout...');
    
    // Use the TikTok scraper library
    const video = await Promise.race([
      fetchVideo(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scraper timeout')), timeoutMs)
      )
    ]) as any;

    clearTimeout(timeoutId);

    if (!video) {
      console.error('❌ [DOWNLOAD] TikTok scraper returned no video data');
      return null;
    }

    console.log('📊 [DOWNLOAD] TikTok scraper metadata:');
    console.log('  - Title:', video.title?.substring(0, 50) + '...');
    console.log('  - Author:', video.author?.nickname);
    console.log('  - Duration:', video.duration, 'seconds');

    // Download the video buffer
    console.log('🔄 [DOWNLOAD] Downloading video buffer from scraper...');
    const buffer = await video.download();
    
    if (!buffer || buffer.length === 0) {
      console.error('❌ [DOWNLOAD] TikTok scraper returned empty buffer');
      return null;
    }

    const size = buffer.length;
    console.log('✅ [DOWNLOAD] TikTok scraper download successful');
    console.log('📊 [DOWNLOAD] Buffer size:', size, 'bytes');

    // Convert Buffer to ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    return {
      buffer: arrayBuffer,
      size,
      mimeType: 'video/mp4',
      filename: `tiktok-scraper-${Date.now()}.mp4`
    };

  } catch (error) {
    if (error instanceof Error && error.message === 'Scraper timeout') {
      console.log('⏰ [DOWNLOAD] TikTok scraper timed out after 30 seconds');
    } else {
      console.error('❌ [DOWNLOAD] TikTok scraper error:', error);
    }
    return null;
  }
}

async function downloadInstagramVideo(url: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log('📸 [DOWNLOAD] Downloading Instagram video...');
    
    // Extract shortcode from URL
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) {
      console.error('❌ [DOWNLOAD] Could not extract Instagram shortcode');
      return null;
    }

    console.log('🆔 [DOWNLOAD] Instagram shortcode:', shortcode);

    // First try RapidAPI with 30-second timeout
    console.log('🔄 [DOWNLOAD] Attempting Instagram RapidAPI download...');
    const rapidApiResult = await downloadInstagramViaRapidAPI(shortcode);
    
    if (rapidApiResult) {
      console.log('✅ [DOWNLOAD] Instagram RapidAPI download successful');
      return rapidApiResult;
    }

    // Fallback: Try direct Instagram download
    console.log('🔄 [DOWNLOAD] RapidAPI failed, trying Instagram fallback method...');
    const fallbackResult = await downloadInstagramDirectFallback(url, shortcode);
    
    if (fallbackResult) {
      console.log('✅ [DOWNLOAD] Instagram fallback download successful');
      return fallbackResult;
    }

    console.error('❌ [DOWNLOAD] All Instagram download methods failed');
    return null;

  } catch (error) {
    console.error('❌ [DOWNLOAD] Error downloading Instagram video:', error);
    return null;
  }
}

async function downloadInstagramViaRapidAPI(shortcode: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    // 30-second timeout for RapidAPI
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log('🌐 [DOWNLOAD] Calling Instagram RapidAPI with 30s timeout...');

    const metadataResponse = await fetch(
      `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reel_by_shortcode?shortcode=${shortcode}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e',
          'x-rapidapi-host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com',
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!metadataResponse.ok) {
      console.error('❌ [DOWNLOAD] Instagram RapidAPI error:', metadataResponse.status);
      return null;
    }

    const metadata = await metadataResponse.json();
    const videoVersions = metadata.video_versions;
    
    if (!videoVersions || videoVersions.length === 0) {
      console.error('❌ [DOWNLOAD] No video versions found in Instagram RapidAPI response');
      return null;
    }

    console.log('🔗 [DOWNLOAD] Instagram video versions found:', videoVersions.length, 'options');
    console.log('📊 [DOWNLOAD] Video metadata from RapidAPI:');
    console.log('  - Has Audio:', metadata.has_audio);
    console.log('  - Duration:', metadata.video_duration, 'seconds');

    // Try video versions, starting with the smallest (last in array)
    for (let i = videoVersions.length - 1; i >= 0; i--) {
      const videoVersion = videoVersions[i];
      const videoUrl = videoVersion.url;
      
      console.log(`🔄 [DOWNLOAD] Attempting download from Instagram version ${i + 1}/${videoVersions.length} (${videoVersion.width}x${videoVersion.height})`);
      
      try {
        const videoController = new AbortController();
        const videoTimeoutId = setTimeout(() => videoController.abort(), 15000);

        const videoResponse = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          signal: videoController.signal
        });

        clearTimeout(videoTimeoutId);

        if (videoResponse.ok) {
          const buffer = await videoResponse.arrayBuffer();
          const size = buffer.byteLength;
          const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';
          
          console.log(`✅ [DOWNLOAD] Successfully downloaded from Instagram version ${i + 1} (${videoVersion.width}x${videoVersion.height})`);
          console.log('📊 [DOWNLOAD] Download size:', size, 'bytes');
          
          return {
            buffer,
            size,
            mimeType,
            filename: `instagram-${shortcode}.mp4`
          };
        }
      } catch (error) {
        console.log(`❌ [DOWNLOAD] Instagram version ${i + 1} failed:`, error);
      }
    }

    return null;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('⏰ [DOWNLOAD] Instagram RapidAPI timed out after 30 seconds');
    } else {
      console.error('❌ [DOWNLOAD] Instagram RapidAPI error:', error);
    }
    return null;
  }
}

async function downloadInstagramDirectFallback(url: string, shortcode: string): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log('🔄 [DOWNLOAD] Attempting Instagram direct fallback...');
    
    // Try Instagram's embed and mobile endpoints
    const fallbackUrls = [
      `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`,
      `https://www.instagram.com/reel/${shortcode}/?__a=1&__d=dis`,
      `https://i.instagram.com/api/v1/media/${shortcode}/info/`
    ];

    for (const fallbackUrl of fallbackUrls) {
      try {
        console.log('🔄 [DOWNLOAD] Trying Instagram fallback URL:', fallbackUrl.split('?')[0]);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 [DOWNLOAD] Instagram fallback response received, analyzing...');
          
          // Try to extract video URL from various possible response structures
          const possibleVideoPaths = [
            data.graphql?.shortcode_media?.video_url,
            data.items?.[0]?.video_versions?.[0]?.url,
            data.media?.video_url,
            data.video_url
          ];

          for (const videoUrl of possibleVideoPaths) {
            if (videoUrl && typeof videoUrl === 'string') {
              console.log('🔗 [DOWNLOAD] Found potential video URL in Instagram fallback');
              
              try {
                const videoResponse = await fetch(videoUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                  }
                });

                if (videoResponse.ok && videoResponse.headers.get('content-type')?.includes('video')) {
                  const buffer = await videoResponse.arrayBuffer();
                  const size = buffer.byteLength;
                  
                  if (size > 1000) { // Basic validation
                    console.log('✅ [DOWNLOAD] Instagram fallback video download successful');
                    return {
                      buffer,
                      size,
                      mimeType: 'video/mp4',
                      filename: `instagram-fallback-${shortcode}.mp4`
                    };
                  }
                }
              } catch (videoError) {
                console.log('❌ [DOWNLOAD] Instagram fallback video URL failed:', videoError);
              }
            }
          }
        }
      } catch (error) {
        console.log('❌ [DOWNLOAD] Instagram fallback URL failed:', error);
      }
    }

    console.log('❌ [DOWNLOAD] All Instagram fallback methods failed');
    return null;

  } catch (error) {
    console.error('❌ [DOWNLOAD] Instagram fallback error:', error);
    return null;
  }
}

function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
} 