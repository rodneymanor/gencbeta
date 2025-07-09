import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // Correctly import the initialized db instance

const BUNNY_THUMBNAIL_BASE_URL = 'https://vz-8416c36e-556.b-cdn.net/';

/**
 * Extracts the video GUID from the video data's URL fields.
 * @param {object} videoData - The data from the Firestore video document.
 * @param {function(string):void} log - A function to push logs to.
 * @returns {string|null} The extracted video ID or null.
 */
const getVideoId = (videoData, log) => {
  const urlsToCheck = [videoData.directUrl, videoData.iframeUrl];
  for (const urlString of urlsToCheck) {
    if (!urlString) continue;
    try {
      const path = new URL(urlString).pathname;
      const parts = path.split('/').filter(Boolean);
      const potentialId = parts.length > 0 ? parts[parts.length - 1] : null;
      
      // Check if the extracted part looks like a GUID.
      if (potentialId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId)) {
        log(`  [Debug]  - Extracted Video ID: ${potentialId} from ${urlString}`);
        return potentialId;
      }
    } catch {
      log(`  [Debug]  - Warning: Could not parse URL to get ID: ${urlString}`);
    }
  }
  log(`  [Debug]  - Warning: No valid Video ID found in directUrl or iframeUrl.`);
  return null;
};

/**
 * Builds the correct Bunny Stream thumbnail URL based on the user's specified format.
 * @param {object} videoData - The data from the Firestore video document.
 * @param {function(string):void} log - A function to push logs to.
 * @returns {string|null} The generated thumbnail URL or null.
 */
const getThumbnailUrl = (videoData, log) => {
  log(`  [Debug] Checking video doc: ${videoData.id ?? 'N/A'}`);
  log(`  [Debug]  - Current thumbnailUrl: ${videoData.thumbnailUrl ?? 'None'}`);

  const videoId = getVideoId(videoData, log);

  if (videoId) {
    const newUrl = `${BUNNY_THUMBNAIL_BASE_URL}${videoId}/thumbnail.jpg`;
    log(`  [Debug]  - Result: Constructed new URL: ${newUrl}`);
    return newUrl;
  }

  log('  [Debug]  - Result: No video ID found to construct new URL.');
  
  // Fallback to keep the existing URL if it's a valid http/https link
  if (videoData.thumbnailUrl && (videoData.thumbnailUrl.startsWith('http://') || videoData.thumbnailUrl.startsWith('https://'))) {
      log('  [Debug]  - Fallback: Keeping existing valid URL.');
      return videoData.thumbnailUrl;
  }
  
  return null;
};


export async function POST() {
  const logs = [];
  const log = (message) => logs.push(message);

  try {
    const videosCollectionRef = adminDb.collection('videos');
    const BATCH_SIZE = 400;

    log('🚀 Starting thumbnail update process...');
    const snapshot = await videosCollectionRef.get();

    if (snapshot.empty) {
      log('✅ No videos found. Exiting.');
      return NextResponse.json({ logs });
    }

    log(`🔍 Found ${snapshot.size} total videos to check.`);

    let batch = adminDb.batch();
    let updatesInBatch = 0;
    let totalUpdates = 0;

    for (const doc of snapshot.docs) {
      const videoData = { id: doc.id, ...doc.data() }; // Include doc ID for logging
      const currentThumbnail = videoData.thumbnailUrl;
      const newThumbnail = getThumbnailUrl(videoData, log);

      if (newThumbnail && newThumbnail !== currentThumbnail) {
        log(`  ➡️ UPDATE: Video ${doc.id}`);
        log(`     FROM: ${currentThumbnail ?? 'N/A'}`);
        log(`     TO:   ${newThumbnail}`);
        batch.update(doc.ref, { thumbnailUrl: newThumbnail });
        updatesInBatch++;
        totalUpdates++;
      } else {
        log(`  ✔️ SKIPPING: Video ${doc.id} - No update needed or new URL could not be derived.`);
      }

      if (updatesInBatch === BATCH_SIZE) {
        log(`\n📦 Committing a batch of ${updatesInBatch} updates...`);
        await batch.commit();
        log('✅ Batch committed successfully.');
        batch = adminDb.batch();
        updatesInBatch = 0;
      }
    }

    if (updatesInBatch > 0) {
      log(`\n📦 Committing the final batch of ${updatesInBatch} updates...`);
      await batch.commit();
      log('✅ Final batch committed successfully.');
    }

    log('\n-----------------------------------------');
    log('🎉 Thumbnail update process complete!');
    log(`   Total videos checked: ${snapshot.size}`);
    log(`   Total videos updated: ${totalUpdates}`);
    log('-----------------------------------------');

    return NextResponse.json({ logs });

  } catch (error) {
    console.error('🔴 Thumbnail update failed:', error);
    log('🔴 An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ logs, error: true }, { status: 500 });
  }
} 