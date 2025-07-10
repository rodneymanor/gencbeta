const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * Extract video ID from Bunny iframe URL
 * Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 */
function extractVideoIdFromIframeUrl(iframeUrl) {
  try {
    const url = new URL(iframeUrl);
    const pathParts = url.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];
    
    if (videoId && videoId.length > 0) {
      console.log("🆔 [UPDATE] Extracted video ID from iframe:", videoId);
      return videoId;
    }
    
    console.error("❌ [UPDATE] Could not extract video ID from iframe URL");
    return null;
  } catch (error) {
    console.error("❌ [UPDATE] Error parsing iframe URL:", error);
    return null;
  }
}

/**
 * Generate a Bunny CDN thumbnail URL for a video
 * Format: https://vz-{hostname}.b-cdn.net/{videoId}/thumbnail.jpg
 */
function generateBunnyThumbnailUrl(videoId) {
  const hostname = process.env.BUNNY_CDN_HOSTNAME;
  
  if (!hostname) {
    console.error("❌ [UPDATE] BUNNY_CDN_HOSTNAME not configured");
    return null;
  }

  // The hostname should already be in format like "8416c36e-556.b-cdn.net"
  // We just need to add the "vz-" prefix for thumbnails
  const thumbnailUrl = `https://vz-${hostname}/${videoId}/thumbnail.jpg`;
  console.log("🖼️ [UPDATE] Generated thumbnail URL:", thumbnailUrl);
  
  return thumbnailUrl;
}

async function updateVideoThumbnails() {
  try {
    console.log("🚀 [UPDATE] Starting thumbnail update process...");
    
    // Get all videos from Firestore
    const videosSnapshot = await db.collection('videos').get();
    
    if (videosSnapshot.empty) {
      console.log("📭 [UPDATE] No videos found in database");
      return;
    }
    
    console.log(`📊 [UPDATE] Found ${videosSnapshot.size} videos to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of videosSnapshot.docs) {
      const videoData = doc.data();
      const videoId = doc.id;
      
      console.log(`\n🔍 [UPDATE] Processing video: ${videoId}`);
      console.log(`   Platform: ${videoData.platform}`);
      console.log(`   Current thumbnail: ${videoData.thumbnailUrl || 'null'}`);
      
      // Check if video has an iframe URL (Bunny CDN)
      if (!videoData.iframeUrl) {
        console.log("⚠️ [UPDATE] No iframe URL found, skipping...");
        skippedCount++;
        continue;
      }
      
      // Extract video ID from iframe URL
      const bunnyVideoId = extractVideoIdFromIframeUrl(videoData.iframeUrl);
      if (!bunnyVideoId) {
        console.log("⚠️ [UPDATE] Could not extract video ID, skipping...");
        skippedCount++;
        continue;
      }
      
      // Generate new thumbnail URL
      const newThumbnailUrl = generateBunnyThumbnailUrl(bunnyVideoId);
      if (!newThumbnailUrl) {
        console.log("⚠️ [UPDATE] Could not generate thumbnail URL, skipping...");
        skippedCount++;
        continue;
      }
      
      // Check if thumbnail URL is already correct
      if (videoData.thumbnailUrl === newThumbnailUrl) {
        console.log("✅ [UPDATE] Thumbnail URL already correct, skipping...");
        skippedCount++;
        continue;
      }
      
      // Update the video document
      try {
        await doc.ref.update({
          thumbnailUrl: newThumbnailUrl,
          updatedAt: new Date().toISOString()
        });
        
        console.log("✅ [UPDATE] Successfully updated thumbnail URL");
        updatedCount++;
      } catch (error) {
        console.error("❌ [UPDATE] Failed to update video:", error);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 [UPDATE] Thumbnail update process completed!`);
    console.log(`   ✅ Updated: ${updatedCount} videos`);
    console.log(`   ⏭️ Skipped: ${skippedCount} videos`);
    console.log(`   ❌ Errors: ${errorCount} videos`);
    
  } catch (error) {
    console.error("❌ [UPDATE] Script error:", error);
  }
}

// Run the update
updateVideoThumbnails().then(() => {
  console.log("🏁 [UPDATE] Script finished");
  process.exit(0);
}).catch((error) => {
  console.error("💥 [UPDATE] Script failed:", error);
  process.exit(1);
}); 