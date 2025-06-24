import { NextRequest, NextResponse } from 'next/server';

import { collection, addDoc, getDocs, query, where, limit, Timestamp, doc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  userId?: string; // Will be determined from email alias
}

interface ProcessedLink {
  url: string;
  platform: 'instagram' | 'tiktok' | 'other';
  extracted: boolean;
  content?: any;
}

// Import the social media extraction logic directly
async function extractSocialMediaContent(urls: string[]) {
  const results = [];
  
  for (const url of urls) {
    if (typeof url !== 'string') {
      results.push(null);
      continue;
    }

    // Check if it's an Instagram URL
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      const shortcode = extractInstagramShortcode(url);
      if (shortcode) {
        const content = await fetchInstagramContent(shortcode);
        results.push(content);
      } else {
        results.push(null);
      }
    }
    // Check if it's a TikTok URL
    else if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
      let videoId = extractTikTokVideoId(url);
      console.log('🔍 Extracted TikTok video ID from URL:', url, '-> ID:', videoId);
      
      // If it's a short URL format (non-numeric), try to resolve it
      if (videoId && !/^\d+$/.test(videoId)) {
        console.log('🔄 Detected short URL format, attempting to resolve...');
        const resolvedVideoId = await resolveTikTokShortUrl(url);
        if (resolvedVideoId && /^\d+$/.test(resolvedVideoId)) {
          videoId = resolvedVideoId;
          console.log('✅ Resolved to numeric video ID:', videoId);
        } else {
          console.log('❌ Failed to resolve to numeric video ID');
        }
      }
      
      if (videoId && /^\d+$/.test(videoId)) {
        const content = await fetchTikTokContent(videoId);
        results.push(content);
      } else {
        console.log('❌ No valid numeric video ID found for TikTok URL:', url);
        results.push(null);
      }
    }
    else {
      results.push(null);
    }
  }

  const successfulExtractions = results.filter(result => result !== null);
  
  return {
    success: true,
    extracted: successfulExtractions,
    total: urls.length,
    successful: successfulExtractions.length,
  };
}

// Helper functions (copied from social media extraction API)
function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/p\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function resolveTikTokShortUrl(shortUrl: string): Promise<string | null> {
  try {
    console.log('🔍 Resolving TikTok short URL:', shortUrl);
    
    // Follow redirects to get the full URL
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    const location = response.headers.get('location');
    console.log('📍 Redirect location:', location);
    
    if (location) {
      // Extract video ID from the full URL
      const videoId = extractTikTokVideoId(location);
      console.log('🎬 Extracted video ID from redirect:', videoId);
      return videoId;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error resolving TikTok short URL:', error);
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

async function fetchInstagramContent(shortcode: string): Promise<any | null> {
  try {
    console.log('🔍 Fetching Instagram content for shortcode:', shortcode);
    
    const response = await fetch(
      `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reel_by_shortcode?shortcode=${shortcode}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e',
          'x-rapidapi-host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.log('❌ Instagram API error status:', response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      platform: 'instagram',
      url: `https://instagram.com/p/${shortcode}`,
      title: (typeof data.caption === 'string' ? data.caption : data.caption?.text) || 'Instagram Post',
      description: (typeof data.caption === 'string' ? data.caption : data.caption?.text) || '',
      thumbnail: data.thumbnail_url,
      author: data.username,
      likes: data.like_count,
      views: data.view_count,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error fetching Instagram content:', error);
    return null;
  }
}

async function fetchTikTokContent(videoId: string): Promise<any | null> {
  try {
    console.log('🔍 Fetching TikTok content for video ID:', videoId);
    
    const response = await fetch(
      `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/${videoId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e',
          'x-rapidapi-host': 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.log('❌ TikTok API error status:', response.status);
      return null;
    }

    const data = await response.json();

    // Check if the API returned an error
    if (data.status === 'error') {
      console.log('❌ TikTok API returned error:', data.error);
      return null;
    }

    // Check if we have the required data structure
    const awemeDetail = data.data?.aweme_detail;
    if (!awemeDetail) {
      console.log('❌ TikTok API response missing aweme_detail');
      return null;
    }

    return {
      platform: 'tiktok',
      url: `https://tiktok.com/@${awemeDetail.author?.unique_id || 'user'}/video/${videoId}`,
      title: awemeDetail.desc || 'TikTok Video',
      description: awemeDetail.desc,
      thumbnail: awemeDetail.video?.cover?.url_list?.[0],
      author: awemeDetail.author?.nickname || awemeDetail.author?.unique_id,
      likes: awemeDetail.statistics?.digg_count,
      views: awemeDetail.statistics?.play_count,
      duration: awemeDetail.video?.duration,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error fetching TikTok content:', error);
    return null;
  }
}

// Helper function to find user by email alias (simplified - in real implementation you'd have user alias mapping)
async function findUserByEmailAlias(emailAlias: string): Promise<string | null> {
  try {
    console.log('🔍 findUserByEmailAlias called with:', emailAlias);
    
    // For demo purposes, handle the format: {userId}@gencapp.pro
    if (emailAlias.includes('@gencapp.pro')) {
      const userId = emailAlias.split('@')[0];
      console.log('📧 Extracted userId from email:', userId, 'Length:', userId.length);
      
      // Validate that this is a real user ID by checking if they exist in auth
      // In a real implementation, you'd have a proper user_aliases collection
      // For now, we'll accept any format that looks like a valid user ID
      if (userId && userId.length > 10) { // Basic validation for Firebase UID format
        console.log('✅ Valid userId format, returning:', userId);
        return userId;
      } else {
        console.log('❌ Invalid userId format or too short');
      }
    }
    
    // Handle specific known aliases
    if (emailAlias === 'rodney@gencapp.pro') {
      console.log('✅ Found known alias for rodney, returning hardcoded userId');
      // Return the known user ID for the main user
      return 'RDY3YfpuY5ppYEzj0kpGFFVCSHpr'; // This should match the actual user ID
    }
    
    console.log('🔍 Checking database for emailAlias:', emailAlias);
    // In a real implementation, you'd query a user_aliases collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('emailAlias', '==', emailAlias), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const foundUserId = querySnapshot.docs[0].id;
      console.log('✅ Found user in database:', foundUserId);
      return foundUserId;
    }
    
    console.log('❌ No user found for email alias');
    return null;
  } catch (error) {
    console.error('Error finding user by email alias:', error);
    return null;
  }
}

// Helper function to extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : []; // Remove the # symbol
}

// Helper function to get or create default collection
async function getOrCreateDefaultCollection(userId: string): Promise<string> {
  try {
    // Look for existing "Email Inbox" collection
    const collectionsRef = collection(db, 'collections');
    const q = query(
      collectionsRef, 
      where('userId', '==', userId),
      where('name', '==', 'Email Inbox'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    // Create default collection
    const newCollectionRef = await addDoc(collectionsRef, {
      name: 'Email Inbox',
      description: 'Links received via email',
      userId,
      items: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      itemCount: 0,
      color: 'bg-purple-100',
    });
    
    return newCollectionRef.id;
  } catch (error) {
    console.error('Error getting/creating default collection:', error);
    throw error;
  }
}

// Helper function to get or create "All Videos" collection
async function getOrCreateAllVideosCollection(userId: string): Promise<string> {
  try {
    // Look for existing "All Videos" collection
    const collectionsRef = collection(db, 'collections');
    const q = query(
      collectionsRef, 
      where('userId', '==', userId),
      where('name', '==', 'All Videos'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    // Create "All Videos" collection
    const newCollectionRef = await addDoc(collectionsRef, {
      name: 'All Videos',
      description: 'All video content from TikTok and Instagram Reels',
      userId,
      items: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      itemCount: 0,
      color: 'bg-red-100',
    });
    
    return newCollectionRef.id;
  } catch (error) {
    console.error('Error getting/creating All Videos collection:', error);
    throw error;
  }
}

// Helper function to extract social media links from email content
function extractSocialMediaLinks(content: string): string[] {
  const patterns = [
    /https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/[^\s]+/gi,
    /https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/[^\s]+/gi,
  ];
  
  const links: string[] = [];
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      links.push(...matches);
    }
  });
  
  // Remove duplicates
  return [...new Set(links)];
}

// Helper function to determine platform from URL
function getPlatformFromUrl(url: string): 'instagram' | 'tiktok' | 'other' {
  if (url.includes('instagram.com') || url.includes('instagr.am')) {
    return 'instagram';
  } else if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  return 'other';
}

// POST - Process incoming email with social media links
export async function POST(request: NextRequest) {
  try {
    const emailData: EmailData = await request.json();
    
    if (!emailData.from || !emailData.to || !emailData.body) {
      return NextResponse.json(
        { error: 'Email data is incomplete' },
        { status: 400 }
      );
    }

    // Extract social media links from email body
    const links = extractSocialMediaLinks(emailData.body);
    
    if (links.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No social media links found in email',
        processed: [],
      });
    }

    // Find user by email alias
    console.log('🔍 Looking for user with email alias:', emailData.to);
    const userId = await findUserByEmailAlias(emailData.to);
    console.log('📧 Found user ID:', userId);
    
    if (!userId) {
      console.log('❌ No user found for email alias:', emailData.to);
      return NextResponse.json(
        { error: `User not found for email alias: ${emailData.to}` },
        { status: 404 }
      );
    }

    // Process each link using direct extraction
    console.log('🔗 Extracting content directly for URLs:', links);
    const extractData = await extractSocialMediaContent(links);
    console.log('✅ Direct extraction result:', JSON.stringify(extractData, null, 2));
    console.log('📊 Extracted array length:', extractData.extracted.length);
    console.log('📊 Links array length:', links.length);
    
    // Map results to processedLinks format - use simple index mapping
    const extractedIndex = 0;
    const processedLinks: ProcessedLink[] = [];
    for (let i = 0; i < links.length; i++) {
      const url = links[i];
      const platform = getPlatformFromUrl(url);
      const content = i < extractData.extracted.length ? extractData.extracted[i] : null;
      
      console.log(`📋 Mapping ${i}: URL=${url}, Content=${content ? 'Found' : 'None'}`);
      
      processedLinks.push({
        url,
        platform,
        extracted: content !== null,
        content,
      });
    }

    // Get or create default collection
    const collectionId = await getOrCreateDefaultCollection(userId);
    
    // Get or create "All Videos" collection for video content
    const allVideosCollectionId = await getOrCreateAllVideosCollection(userId);

    // Add successfully extracted content to collection
    const itemsToAdd = processedLinks
      .filter(link => link.extracted && link.content)
      .map(link => link.content);

    if (itemsToAdd.length > 0) {
      // Add items to Email Inbox collection using the correct API structure
      try {
        const response = await fetch(`http://localhost:3000/api/collections/${collectionId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsToAdd.map(item => ({
              platform: item.platform || 'unknown',
              url: item.url || '',
              title: item.title || 'Untitled',
              description: item.description || '',
              thumbnail: item.thumbnail || null,
              author: item.author || 'Unknown',
              likes: typeof item.likes === 'number' ? item.likes : 0,
              views: typeof item.views === 'number' ? item.views : 0,
              duration: typeof item.duration === 'number' ? item.duration : 0,
              extractedAt: item.extractedAt || new Date().toISOString(),
            })),
            userId,
          }),
        });

        if (response.ok) {
          console.log(`✅ Successfully added ${itemsToAdd.length} items to Email Inbox collection ${collectionId}`);
        } else {
          console.error('❌ Error adding items to Email Inbox collection:', await response.text());
        }
      } catch (error) {
        console.error('❌ Error adding items to Email Inbox collection:', error);
        // Don't throw error, just log it - the extraction was successful
      }

      // Add video content to "All Videos" collection
      const videoItems = itemsToAdd.filter(item => 
        item.platform === 'tiktok' || item.platform === 'instagram'
      );

      if (videoItems.length > 0) {
        try {
          const response = await fetch(`http://localhost:3000/api/collections/${allVideosCollectionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: videoItems.map(item => ({
                platform: item.platform || 'unknown',
                url: item.url || '',
                title: item.title || 'Untitled',
                description: item.description || '',
                thumbnail: item.thumbnail || null,
                author: item.author || 'Unknown',
                likes: typeof item.likes === 'number' ? item.likes : 0,
                views: typeof item.views === 'number' ? item.views : 0,
                duration: typeof item.duration === 'number' ? item.duration : 0,
                extractedAt: item.extractedAt || new Date().toISOString(),
                // Additional video-specific metadata
                videoType: item.platform === 'tiktok' ? 'TikTok Video' : 'Instagram Reel',
                hashtags: item.title ? extractHashtags(item.title) : [],
                source: 'email_processing',
              })),
              userId,
            }),
          });

          if (response.ok) {
            console.log(`✅ Successfully added ${videoItems.length} video items to All Videos collection ${allVideosCollectionId}`);
          } else {
            console.error('❌ Error adding video items to All Videos collection:', await response.text());
          }
        } catch (error) {
          console.error('❌ Error adding video items to All Videos collection:', error);
          // Don't throw error, just log it - the extraction was successful
        }
      }
    }

    // Store email processing record with sanitized data
    const emailRecordsRef = collection(db, 'email_records');
    const sanitizedProcessedLinks = processedLinks.map(link => ({
      url: link.url,
      platform: link.platform,
      extracted: link.extracted,
      content: link.content ? {
        platform: link.content.platform || 'unknown',
        url: link.content.url || '',
        title: link.content.title || 'Untitled',
        description: link.content.description || '',
        thumbnail: link.content.thumbnail || null,
        author: link.content.author || 'Unknown',
        likes: typeof link.content.likes === 'number' ? link.content.likes : 0,
        views: typeof link.content.views === 'number' ? link.content.views : 0,
        duration: typeof link.content.duration === 'number' ? link.content.duration : 0,
        extractedAt: link.content.extractedAt || new Date().toISOString(),
      } : null,
    }));
    
    await addDoc(emailRecordsRef, {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject || 'No Subject',
      userId,
      linksFound: links.length,
      linksProcessed: processedLinks.filter(l => l.extracted).length,
      collectionId,
      processedAt: Timestamp.now(),
      links: sanitizedProcessedLinks,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${processedLinks.filter(l => l.extracted).length} of ${links.length} links`,
      processed: processedLinks,
      collectionId,
    });

  } catch (error) {
    console.error('Error processing email links:', error);
    return NextResponse.json(
      { error: 'Failed to process email links' },
      { status: 500 }
    );
  }
}

// GET - Retrieve email processing history for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const emailRecordsRef = collection(db, 'email_records');
    const q = query(
      emailRecordsRef,
      where('userId', '==', userId),
      limit(50)
    );
    const querySnapshot = await getDocs(q);

    const history = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      processedAt: doc.data().processedAt.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      history,
    });

  } catch (error) {
    console.error('Error retrieving email history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve email history' },
      { status: 500 }
    );
  }
}