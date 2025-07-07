// Simple script to check video data in the database
// This uses the existing Firebase admin setup from the codebase

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import the existing Firebase admin setup
const { getAdminDb, isAdminInitialized } = require('../src/lib/firebase-admin.ts');

async function checkVideoData() {
  try {
    console.log('🔍 Checking video data in database...\n');
    
    if (!isAdminInitialized) {
      console.log('❌ Firebase Admin SDK not initialized');
      console.log('Please check your .env.local file has the required Firebase Admin credentials');
      return;
    }
    
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.log('❌ Admin database not available');
      return;
    }
    
    // Get a sample of videos from the database
    const videosSnapshot = await adminDb.collection('videos').limit(3).get();
    
    if (videosSnapshot.empty) {
      console.log('❌ No videos found in database');
      return;
    }
    
    console.log(`✅ Found ${videosSnapshot.size} videos\n`);
    
    videosSnapshot.forEach((doc, index) => {
      const videoData = doc.data();
      console.log(`📹 Video ${index + 1} (ID: ${doc.id}):`);
      console.log('=' .repeat(50));
      
      // Check all possible fields
      const fields = {
        // Basic info
        'title': videoData.title,
        'author': videoData.author,
        'platform': videoData.platform,
        'originalUrl': videoData.originalUrl,
        'iframeUrl': videoData.iframeUrl,
        'thumbnailUrl': videoData.thumbnailUrl,
        'duration': videoData.duration,
        'fileSize': videoData.fileSize,
        'addedAt': videoData.addedAt,
        
        // User/Collection info
        'userId': videoData.userId,
        'collectionId': videoData.collectionId,
        
        // Content
        'transcript': videoData.transcript ? `${videoData.transcript.substring(0, 100)}...` : null,
        'visualContext': videoData.visualContext,
        
        // Components
        'components.hook': videoData.components?.hook,
        'components.bridge': videoData.components?.bridge,
        'components.nugget': videoData.components?.nugget,
        'components.wta': videoData.components?.wta,
        
        // Content Metadata
        'contentMetadata.platform': videoData.contentMetadata?.platform,
        'contentMetadata.author': videoData.contentMetadata?.author,
        'contentMetadata.description': videoData.contentMetadata?.description,
        'contentMetadata.source': videoData.contentMetadata?.source,
        'contentMetadata.hashtags': videoData.contentMetadata?.hashtags,
        
        // Insights
        'insights.likes': videoData.insights?.likes,
        'insights.comments': videoData.insights?.comments,
        'insights.shares': videoData.insights?.shares,
        'insights.views': videoData.insights?.views,
        'insights.saves': videoData.insights?.saves,
        'insights.engagementRate': videoData.insights?.engagementRate,
        
        // Additional fields that might exist
        'metrics': videoData.metrics,
        'metadata': videoData.metadata,
        'transcriptionStatus': videoData.transcriptionStatus,
        'guid': videoData.guid,
        'directUrl': videoData.directUrl,
      };
      
      // Display populated fields
      Object.entries(fields).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          const displayValue = typeof value === 'string' && value.length > 50 
            ? `${value.substring(0, 50)}...` 
            : value;
          console.log(`  ✅ ${field}: ${displayValue}`);
        } else {
          console.log(`  ❌ ${field}: MISSING`);
        }
      });
      
      console.log('\n');
    });
    
  } catch (error) {
    console.error('❌ Error reading video data:', error);
  } finally {
    process.exit(0);
  }
}

checkVideoData(); 